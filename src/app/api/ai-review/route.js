import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Module-level in-memory store for basic rate limiting across cold starts
const rateLimitMap = new Map();

export async function POST(req) {
  try {
    // 1. Authenticate user from request header (Authorization) or token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized user.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    // Fetch user details from supabase auth using token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid user token.' }, { status: 401 });
    }

    // Rate Limiting Logic (In-Memory per instance)
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 3; // Max 3 requests per minute per user

    if (!rateLimitMap.has(user.id)) {
      rateLimitMap.set(user.id, { count: 1, resetTime: now + windowMs });
    } else {
      const rateData = rateLimitMap.get(user.id);
      if (now > rateData.resetTime) {
        // Reset window
        rateLimitMap.set(user.id, { count: 1, resetTime: now + windowMs });
      } else if (rateData.count >= maxRequests) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please wait a minute before requesting another AI review.' 
        }, { status: 429, headers: { 'Retry-After': Math.ceil((rateData.resetTime - now) / 1000).toString() } });
      } else {
        rateData.count += 1;
      }
    }

    // 2. Parse request payload
    const { tasks, expenses, budgetAmount, weekStartDate, currency = '$' } = await req.json();

    if (!weekStartDate) {
      return NextResponse.json({ error: 'Week start date is required.' }, { status: 400 });
    }

    // Prepare text representation of user activities
    const completedTasks = tasks.filter(t => t.is_completed);
    const pendingTasks = tasks.filter(t => !t.is_completed && t.task_date >= weekStartDate);
    const missedTasks = tasks.filter(t => !t.is_completed && t.task_date < weekStartDate);
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const taskSummary = tasks.map(t => 
      `- [${t.is_completed ? 'Completed' : 'Pending'}] Title: "${t.title}", Date: ${t.task_date}, Priority: ${t.priority}`
    ).join('\n');

    const expenseSummary = expenses.map(e => 
      `- Category: ${e.category}, Amount: ${currency}${e.amount}, Note: "${e.note || ''}", Date: ${e.expense_date}`
    ).join('\n');

    // 3. Call Gemini API (with Mock Fallback if key is missing)
    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponseText = '';

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables. Providing a realistic mock review.');
      
      const mockWarnings = totalSpent > budgetAmount
        ? `🚨 CRITICAL WARNING: You have exceeded your weekly budget by ${currency}${(totalSpent - budgetAmount).toFixed(2)}! Avoid shopping or leisure activities for the rest of the week.`
        : totalSpent > budgetAmount * 0.85
        ? `⚠️ ALERT: You have consumed ${((totalSpent / budgetAmount) * 100).toFixed(0)}% of your weekly budget. Try to hold off on optional expenses like shopping or entertainment.`
        : `✅ Doing great! You have ${currency}${(budgetAmount - totalSpent).toFixed(2)} left in your budget. Stay mindful of small expenses.`;

      const mockProductivity = completedTasks.length === 0 && tasks.length > 0
        ? `You haven't completed any tasks yet this week! You have ${pendingTasks.length} pending items. Start with your high-priority items to build momentum.`
        : tasks.length === 0
        ? `You don't have any tasks scheduled. Add some study or work items in the Planner to organize your week!`
        : `Solid progress! You've completed ${completedTasks.length} of your ${tasks.length} tasks. Try checking off the remaining pending tasks today.`;

      aiResponseText = JSON.stringify({
        productivity_review: mockProductivity + " (This is a mock analysis because GEMINI_API_KEY is not set).",
        spending_review: `You have spent ${currency}${totalSpent.toFixed(2)} out of your ${currency}${budgetAmount.toFixed(2)} weekly budget. Your biggest items are visible on your expense logs. (Mock Review).`,
        warnings_and_advice: mockWarnings + " (Configure GEMINI_API_KEY in .env.local to enable real AI advice)."
      });
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
        You are Savan, an honest, friendly, but realistic personal life coach and financial advisor helping a beginner user.
        Analyze the user's weekly planner and expense data below:
        
        WEEKLY BUDGET LIMIT: ${currency}${budgetAmount}
        TOTAL SPENT THIS WEEK: ${currency}${totalSpent}
        REMAINING BALANCE: ${currency}${budgetAmount - totalSpent}
        CURRENCY SYMBOL: ${currency} (Please output all monetary reviews using the currency symbol "${currency}")
        
        TASKS FOR THIS WEEK:
        Completed Tasks count: ${completedTasks.length}
        Pending Tasks count: ${pendingTasks.length}
        Missed Tasks count: ${missedTasks.length}
        
        DETAILED TASKS LOG:
        ${taskSummary || 'No tasks recorded.'}
        
        DETAILED EXPENSES LOG:
        ${expenseSummary || 'No expenses logged.'}
        
        Provide a detailed constructive audit of the user's performance. 
        You MUST respond in valid JSON format. Do not write any markdown code blocks, backticks, or other text outside the JSON.
        
        The JSON structure MUST be:
        {
          "productivity_review": "Write a friendly, honest audit of task completions, priority management, and advice to tackle pending/missed tasks. (Max 100 words)",
          "spending_review": "Analyze their spending against their budget. Highlight if they spent too much, categories that look heavy, and how to improve. (Max 100 words)",
          "warnings_and_advice": "A bold warning/suggestion. E.g. 'Avoid shopping this week because remaining budget is low' or 'Prioritize your study sessions today'. Give 2 specific actionable tips. (Max 100 words)"
        }
      `;

      const result = await model.generateContent(prompt);
      aiResponseText = result.response.text();
    }

    // Clean up response text if Gemini wraps it in markdown backticks
    let cleanedText = aiResponseText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(json)?\s*/, '').replace(/```\s*$/, '').trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedText);
    } catch (jsonErr) {
      console.error('Failed to parse Gemini JSON output:', cleanedText, jsonErr);
      parsedResult = {
        productivity_review: "Your task planning is under review. Try to complete your high priority items.",
        spending_review: "Your expenses are under review. Monitor your weekly budget balances.",
        warnings_and_advice: "Action advice is being compiled. Stay mindful of your goals."
      };
    }

    // 4. Save review to supabase ai_reviews table
    const { error: dbError } = await supabase
      .from('ai_reviews')
      .upsert({
        user_id: user.id,
        week_start_date: weekStartDate,
        productivity_review: parsedResult.productivity_review,
        spending_review: parsedResult.spending_review,
        warnings_and_advice: parsedResult.warnings_and_advice
      }, { onConflict: 'user_id, week_start_date' });

    if (dbError) {
      console.error('Failed to save AI review to Database:', dbError);
    }

    return NextResponse.json(parsedResult);

  } catch (err) {
    console.error('Internal server error in ai-review API:', err);
    return NextResponse.json({ error: 'Failed to process AI review: ' + err.message }, { status: 500 });
  }
}
