import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Authenticate user from request header (Authorization)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized user.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid user token.' }, { status: 401 });
    }

    // 2. Parse request payload
    const { tasks, expenses, budgetAmount, monthDate, currency = '$' } = await req.json();

    if (!monthDate) {
      return NextResponse.json({ error: 'Month date (YYYY-MM-01) is required.' }, { status: 400 });
    }

    // Filter tasks and expenses specifically for this calendar month
    const targetMonth = monthDate.slice(0, 7); // YYYY-MM
    const completedTasks = tasks.filter(t => t.is_completed && t.task_date.startsWith(targetMonth));
    const pendingTasks = tasks.filter(t => !t.is_completed && t.task_date.startsWith(targetMonth) && new Date(t.task_date) >= new Date());
    const missedTasks = tasks.filter(t => !t.is_completed && t.task_date.startsWith(targetMonth) && new Date(t.task_date) < new Date());

    const totalSpent = expenses.filter(e => e.expense_date.startsWith(targetMonth)).reduce((sum, e) => sum + Number(e.amount), 0);

    const taskSummary = tasks
      .filter(t => t.task_date.startsWith(targetMonth))
      .map(t => `- [${t.is_completed ? 'Completed' : 'Pending'}] Title: "${t.title}", Date: ${t.task_date}, Priority: ${t.priority}`)
      .join('\n');

    const expenseSummary = expenses
      .filter(e => e.expense_date.startsWith(targetMonth))
      .map(e => `- Category: ${e.category}, Amount: ${currency}${e.amount}, Note: "${e.note || ''}", Date: ${e.expense_date}`)
      .join('\n');

    // 3. Call Gemini API (with Mock Fallback if key is missing)
    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponseText = '';

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables. Providing a realistic mock review.');
      
      const mockWarnings = totalSpent > budgetAmount
        ? `🚨 CRITICAL MONTHLY WARNING: You have exceeded your monthly budget of ${currency}${budgetAmount.toFixed(2)} by ${currency}${(totalSpent - budgetAmount).toFixed(2)}! It is crucial to review your heavy categories and cut down on non-essential spending next month.`
        : totalSpent > budgetAmount * 0.85
        ? `⚠️ MONTHLY ALERT: You have consumed ${((totalSpent / budgetAmount) * 100).toFixed(0)}% of your monthly budget limit. Try to restrict optional entertainment or shopping for the remaining days.`
        : `✅ Great job! You managed your budget well this month, with ${currency}${(budgetAmount - totalSpent).toFixed(2)} left in savings. Keep up this disciplined approach!`;

      const mockProductivity = completedTasks.length === 0 && tasks.length > 0
        ? `You didn't check off any tasks scheduled for this month! You have ${pendingTasks.length} pending items. Let's work on time management and start breaking your tasks down into smaller actions.`
        : tasks.length === 0
        ? `You didn't record any tasks this month. To get the most out of Savan, make sure to plan your activities and studies in the Task Planner.`
        : `Solid month! You completed ${completedTasks.length} of your ${tasks.length} planned tasks. You've established a great rhythm; let's aim for an even higher completion rate next month!`;

      aiResponseText = JSON.stringify({
        productivity_review: mockProductivity + " (This is a mock monthly analysis because GEMINI_API_KEY is not set).",
        spending_review: `You have spent a total of ${currency}${totalSpent.toFixed(2)} this month out of your ${currency}${budgetAmount.toFixed(2)} target budget. Review your categorical log below to find leakages. (Mock Review).`,
        warnings_and_advice: mockWarnings + " (Configure GEMINI_API_KEY in .env.local to enable real AI monthly advice)."
      });
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
        You are Savan, an honest, friendly, but realistic personal life coach and financial advisor helping a beginner user.
        Analyze the user's monthly planner and expense data for the month starting ${monthDate}:
        
        MONTHLY BUDGET TARGET LIMIT: ${currency}${budgetAmount}
        TOTAL SPENT THIS MONTH: ${currency}${totalSpent}
        REMAINING BALANCE: ${currency}${budgetAmount - totalSpent}
        CURRENCY SYMBOL: ${currency} (Please output all monetary reviews using the currency symbol "${currency}")
        
        TASKS FOR THIS MONTH:
        Completed Tasks count: ${completedTasks.length}
        Pending Tasks count: ${pendingTasks.length}
        Missed Tasks count: ${missedTasks.length}
        
        DETAILED MONTH'S TASKS LOG:
        ${taskSummary || 'No tasks recorded for this calendar month.'}
        
        DETAILED MONTH'S EXPENSES LOG:
        ${expenseSummary || 'No expenses logged for this calendar month.'}
        
        Provide a detailed constructive monthly audit of the user's habits, performance, and financial discipline. 
        You MUST respond in valid JSON format. Do not write any markdown code blocks, backticks, or other text outside the JSON.
        
        The JSON structure MUST be:
        {
          "productivity_review": "Write a friendly, honest audit of task completions, priority management, and advice to tackle pending/missed tasks at a monthly scale. (Max 120 words)",
          "spending_review": "Analyze their spending against their monthly budget target. Highlight if they spent too much, categories that look heavy, and how to improve. (Max 120 words)",
          "warnings_and_advice": "A bold warning/suggestion. E.g. 'High spending in shopping this month. Curtail non-essential logs.' or 'Excellent discipline this month. Keep it up!'. Provide 2 specific actionable tips for the upcoming month. (Max 120 words)"
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
      console.error('Failed to parse Gemini monthly JSON output:', cleanedText, jsonErr);
      parsedResult = {
        productivity_review: "Your monthly task planning is under review. Try to complete your high priority items.",
        spending_review: "Your monthly expenses are under review. Monitor your weekly and monthly budget balances.",
        warnings_and_advice: "Monthly action advice is being compiled. Stay mindful of your goals."
      };
    }

    // 4. Save review to supabase monthly_reviews table
    const { error: dbError } = await supabase
      .from('monthly_reviews')
      .upsert({
        user_id: user.id,
        month_date: monthDate,
        productivity_review: parsedResult.productivity_review,
        spending_review: parsedResult.spending_review,
        warnings_and_advice: parsedResult.warnings_and_advice
      }, { onConflict: 'user_id, month_date' });

    if (dbError) {
      console.error('Failed to save Monthly AI review to Database:', dbError);
    }

    return NextResponse.json(parsedResult);

  } catch (err) {
    console.error('Internal server error in monthly-review API:', err);
    return NextResponse.json({ error: 'Failed to process monthly AI review: ' + err.message }, { status: 500 });
  }
}
