'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, getWeekStartDate } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { SpendingChart, TaskPieChart } from '@/components/Charts';
import Dock from '@/components/Dock/Dock';
import { playSuccessChime } from '@/lib/audio';
import { 
  Sparkles, 
  CheckCircle, 
  Circle, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  ChevronRight,
  CalendarDays,
  LayoutDashboard,
  Wallet,
  BarChart3,
  History,
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { 
    user, 
    profile, 
    loading, 
    tasks, 
    expenses, 
    weeklyBudget, 
    fetchTasks, 
    addNotification,
    currency,
    setCurrency
  } = useApp();

  const [aiSnippet, setAiSnippet] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);

  const dockItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <Calendar size={18} />, label: 'Tasks Planner', onClick: () => router.push('/tasks') },
    { icon: <Wallet size={18} />, label: 'Expense Log', onClick: () => router.push('/expenses') },
    { icon: <TrendingUp size={18} />, label: 'Weekly Budget', onClick: () => router.push('/budget') },
    { icon: <BarChart3 size={18} />, label: 'Monthly Hub', onClick: () => router.push('/monthly') },
    { icon: <Sparkles size={18} />, label: 'AI Review', onClick: () => router.push('/ai-review') },
    { icon: <History size={18} />, label: 'History Log', onClick: () => router.push('/history') },
    { icon: <Settings size={18} />, label: 'Settings', onClick: () => router.push('/settings') },
  ];

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentWeekStart = getWeekStartDate();

  // Load latest AI advice snippet
  useEffect(() => {
    const fetchAiSnippet = async () => {
      if (!user) return;
      setLoadingAi(true);
      try {
        const { data, error } = await supabase
          .from('ai_reviews')
          .select('*')
          .eq('week_start_date', currentWeekStart)
          .maybeSingle();
        if (!error && data) {
          setAiSnippet(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAi(false);
      }
    };
    fetchAiSnippet();
  }, [user, currentWeekStart]);

  // Calculations for task statistics
  const completedTasksCount = tasks.filter(t => t.is_completed).length;
  const pendingTasksCount = tasks.filter(t => !t.is_completed && t.task_date >= todayStr).length;
  const missedTasksCount = tasks.filter(t => !t.is_completed && t.task_date < todayStr).length;

  const todayPendingTasks = tasks.filter(t => !t.is_completed && t.task_date === todayStr);

  // Calculations for financial stats
  const budgetAmount = weeklyBudget ? Number(weeklyBudget.amount) : 0;
  const thisWeeksExpenses = expenses.filter(e => e.expense_date >= currentWeekStart);
  const totalSpentThisWeek = thisWeeksExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const remainingBudget = budgetAmount - totalSpentThisWeek;

  // Process data for daily spending chart
  const getDailySpendingChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [];
    
    // Fill in last 7 days starting from 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      
      const amount = expenses
        .filter(e => e.expense_date === dateStr)
        .reduce((sum, item) => sum + Number(item.amount), 0);
        
      data.push({
        day: dayName,
        amount: Number(amount.toFixed(2))
      });
    }
    return data;
  };

  const chartData = getDailySpendingChartData();

  const handleToggleComplete = async (task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: true })
        .eq('id', task.id);

      if (error) throw error;

      // Celebrate
      playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#49b6e5', '#16a34a']
      });

      addNotification(`Task "${task.title}" completed!`, 'success');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      addNotification('Failed to toggle task completion.', 'error');
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-700 text-sm font-mono">Organizing dashboard workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header & Currency Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary tracking-tight font-sans">
            Hello,{' '}
            <span className="text-primary underline decoration-wavy decoration-secondary">
              {profile?.full_name || 'User'}
            </span>
            !
          </h1>
          <p className="text-sm text-slate-655 mt-1.5 font-mono">
            Here is your visual roadmap for tasks and financial budgets this week.
          </p>
        </div>

        {/* Currency Selector Panel */}
        <div className="flex items-center gap-2.5 bg-white border-2 border-secondary py-2.5 px-4 rounded-[12px_4px_12px_4px/4px_12px_4px_12px] shadow-[2.5px_3px_0px_var(--secondary)] w-fit font-mono">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Currency:</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent border-none text-secondary text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="$" className="bg-white text-secondary font-mono">USD ($)</option>
            <option value="A$" className="bg-white text-secondary font-mono">AUD (A$)</option>
            <option value="₹" className="bg-white text-secondary font-mono">INR (₹)</option>
            <option value="€" className="bg-white text-secondary font-mono">EUR (€)</option>
            <option value="£" className="bg-white text-secondary font-mono">GBP (£)</option>
            <option value="¥" className="bg-white text-secondary font-mono">JPY (¥)</option>
            <option value="د.إ" className="bg-white text-secondary font-mono">AED (د.إ)</option>
          </select>
        </div>
      </div>

      {/* Financial Health Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget */}
        <div className="doodle-card p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Weekly Budget Limit</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-secondary font-sans">{currency}{budgetAmount.toFixed(2)}</span>
            <span className="text-slate-500 text-xs ml-1 font-mono">/ week</span>
          </div>
          <Link href="/budget" className="mt-3 text-xs text-secondary hover:text-primary font-bold font-mono flex items-center gap-1 w-fit underline">
            <span>Manage Budget</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Spent */}
        <div className="doodle-card p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Spent This Week</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-secondary font-sans">{currency}{totalSpentThisWeek.toFixed(2)}</span>
          </div>
          <Link href="/expenses" className="mt-3 text-xs text-secondary hover:text-primary font-bold font-mono flex items-center gap-1 w-fit underline">
            <span>Log Expense</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Remaining */}
        <div className="doodle-card p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Remaining Wallet Balance</span>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-3xl font-extrabold font-sans ${remainingBudget < 0 ? 'text-danger' : 'text-success'}`}>
              {currency}{remainingBudget.toFixed(2)}
            </span>
            {remainingBudget < 0 && <AlertTriangle size={20} className="text-danger animate-bounce" />}
          </div>
          <span className="mt-3 text-xs text-slate-600 font-mono">
            {remainingBudget < 0 ? 'Exceeded week threshold!' : 'Currently under budget.'}
          </span>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Today's Tasks & AI Advisor Snippet */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Today's Checklist */}
          <div className="doodle-card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-secondary">
              <div className="flex items-center gap-2 text-secondary font-bold text-base font-sans">
                <Calendar size={18} className="text-primary" />
                <span>Today's Task Checklist</span>
              </div>
              <Link href="/tasks" className="text-xs text-slate-700 hover:text-secondary font-bold font-mono flex items-center gap-1 underline">
                <span>View Planner</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {todayPendingTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-sm font-mono space-y-2">
                <p>No remaining tasks scheduled for today!</p>
                <p className="text-xs text-slate-500">Enjoy your free time or add items in the planner.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayPendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] hover:bg-slate-100 transition-all shadow-[2.5px_3px_0px_var(--secondary)]"
                  >
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                      <Circle size={18} className="hover:scale-110" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-secondary truncate font-sans">{task.title}</p>
                      {task.task_time && (
                        <p className="text-xs text-slate-660 mt-0.5 font-mono">{task.task_time.slice(0, 5)}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize border border-secondary font-mono shadow-[1px_1.5px_0px_var(--secondary)] ${
                      task.priority === 'high' ? 'bg-red-100 text-danger' :
                      task.priority === 'medium' ? 'bg-amber-100 text-warning' :
                      'bg-emerald-100 text-success'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Advisor Preview Panel */}
          <div className="doodle-card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-secondary">
              <div className="flex items-center gap-2 text-secondary font-bold text-base font-sans">
                <Sparkles size={18} className="animate-pulse text-primary" />
                <span>Advisor Insight Snippet</span>
              </div>
              <Link href="/ai-review" className="text-xs text-slate-700 hover:text-secondary font-bold font-mono flex items-center gap-1 underline">
                <span>View Full Review</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {loadingAi ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-655 font-mono">Checking for insights...</span>
              </div>
            ) : !aiSnippet ? (
              <div className="text-center py-6 text-slate-600 text-sm font-mono space-y-3">
                <p>No audit review compiled for the week.</p>
                <Link
                  href="/ai-review"
                  className="doodle-btn py-2 px-4 text-xs font-bold transition-all w-fit"
                >
                  Generate AI Audit
                </Link>
              </div>
            ) : (
              <div className="space-y-4 font-mono">
                <div className="p-4 bg-amber-50 border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] shadow-[2px_3px_0px_var(--secondary)] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-warning">
                    <Info size={14} className="text-warning" />
                    <span>Savan's Focus Warning</span>
                  </div>
                  <p className="text-xs text-slate-850 leading-relaxed italic">
                    "{aiSnippet.warnings_and_advice.slice(0, 180)}..."
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-500 mb-1 uppercase tracking-wider font-bold">Productivity Log</span>
                    <p className="text-slate-800 line-clamp-3">{aiSnippet.productivity_review}</p>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1 uppercase tracking-wider font-bold">Budget Audit</span>
                    <p className="text-slate-800 line-clamp-3">{aiSnippet.spending_review}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Interactive Charts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Chart: Daily Spending */}
          <div className="doodle-card p-6">
            <h3 className="text-base font-bold text-secondary mb-4 font-sans border-b-2 border-secondary pb-2">Daily Spending (Last 7 Days)</h3>
            <SpendingChart data={chartData} currency={currency} />
          </div>

          {/* Chart: Task completion ratios */}
          <div className="doodle-card p-6">
            <h3 className="text-base font-bold text-secondary mb-4 font-sans border-b-2 border-secondary pb-2">Task Status Ratios</h3>
            <TaskPieChart 
              completedCount={completedTasksCount}
              pendingCount={pendingTasksCount}
              missedCount={missedTasksCount}
            />
          </div>
        </div>

      </div>

      {/* Floating Navigation Dock */}
      <div className="pb-16 md:pb-0">
        <Dock items={dockItems} panelHeight={68} baseItemSize={50} magnification={70} />
      </div>
    </div>
  );
}
