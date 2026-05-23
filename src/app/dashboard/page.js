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
        colors: ['#6366f1', '#10b981']
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
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Organizing dashboard workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header & Currency Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Hello,{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              {profile?.full_name || 'User'}
            </span>
            !
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Here is your visual roadmap for tasks and financial budgets this week.
          </p>
        </div>

        {/* Currency Selector Panel */}
        <div className="flex items-center gap-2.5 glass-card py-2.5 px-4 border border-white/5 w-fit">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currency:</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent border-none text-slate-200 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="$" className="bg-slate-950 text-slate-200">USD ($)</option>
            <option value="A$" className="bg-slate-950 text-slate-200">AUD (A$)</option>
            <option value="₹" className="bg-slate-950 text-slate-200">INR (₹)</option>
            <option value="€" className="bg-slate-950 text-slate-200">EUR (€)</option>
            <option value="£" className="bg-slate-950 text-slate-200">GBP (£)</option>
            <option value="¥" className="bg-slate-950 text-slate-200">JPY (¥)</option>
            <option value="د.إ" className="bg-slate-950 text-slate-200">AED (د.إ)</option>
          </select>
        </div>
      </div>

      {/* Financial Health Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget */}
        <div className="glass-card p-6 bg-slate-900/40 border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly Budget Limit</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{currency}{budgetAmount.toFixed(2)}</span>
            <span className="text-slate-500 text-xs ml-1">/ week</span>
          </div>
          <Link href="/budget" className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 w-fit">
            <span>Manage Budget</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Spent */}
        <div className="glass-card p-6 bg-slate-900/40 border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Spent This Week</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-white">{currency}{totalSpentThisWeek.toFixed(2)}</span>
          </div>
          <Link href="/expenses" className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 w-fit">
            <span>Log Expense</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Remaining */}
        <div className="glass-card p-6 bg-slate-900/40 border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Wallet Balance</span>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-3xl font-extrabold ${remainingBudget < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {currency}{remainingBudget.toFixed(2)}
            </span>
            {remainingBudget < 0 && <AlertTriangle size={20} className="text-red-400 animate-bounce" />}
          </div>
          <span className="mt-3 text-xs text-slate-500">
            {remainingBudget < 0 ? 'Exceeded week threshold!' : 'Currently under budget.'}
          </span>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Today's Tasks & AI Advisor Snippet */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Today's Checklist */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                <Calendar size={18} />
                <span>Today's Task Checklist</span>
              </div>
              <Link href="/tasks" className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1">
                <span>View Planner</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {todayPendingTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm space-y-2">
                <p>No remaining tasks scheduled for today!</p>
                <p className="text-xs text-slate-600">Enjoy your free time or add item in the planner.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayPendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all"
                  >
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Circle size={18} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{task.title}</p>
                      {task.task_time && (
                        <p className="text-xs text-slate-500 mt-0.5">{task.task_time.slice(0, 5)}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize border ${
                      task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Advisor Preview Panel */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <Sparkles size={18} className="pulse-glow" />
                <span>Advisor Insight Snippet</span>
              </div>
              <Link href="/ai-review" className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1">
                <span>View Full Review</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {loadingAi ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500">Checking for insights...</span>
              </div>
            ) : !aiSnippet ? (
              <div className="text-center py-6 text-slate-500 text-sm space-y-3">
                <p>No audit review compiled for the week.</p>
                <Link
                  href="/ai-review"
                  className="inline-flex py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all w-fit"
                >
                  Generate AI Audit
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Info size={14} />
                    <span>Savan's Focus Warning</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{aiSnippet.warnings_and_advice.slice(0, 180)}..."
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-500 mb-1 uppercase tracking-wider font-semibold">Productivity Log</span>
                    <p className="text-slate-300 line-clamp-3">{aiSnippet.productivity_review}</p>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1 uppercase tracking-wider font-semibold">Budget Audit</span>
                    <p className="text-slate-300 line-clamp-3">{aiSnippet.spending_review}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Interactive Charts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Chart: Daily Spending */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
            <h3 className="text-base font-bold text-white mb-4">Daily Spending (Last 7 Days)</h3>
            <SpendingChart data={chartData} currency={currency} />
          </div>

          {/* Chart: Task completion ratios */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
            <h3 className="text-base font-bold text-white mb-4">Task Status Ratios</h3>
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
