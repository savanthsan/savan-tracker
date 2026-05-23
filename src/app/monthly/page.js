'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  BarChart3, 
  Activity, 
  Info,
  DollarSign
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function MonthlyHub() {
  const router = useRouter();
  const { user, loading, tasks, expenses, weeklyBudget, addNotification, currency } = useApp();

  // Monthly Budget local state
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState('');
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState(1000);

  // Review states
  const [monthlyReview, setMonthlyReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [fetchingDB, setFetchingDB] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load custom monthly budget from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savan_monthly_budget');
      if (saved) {
        setMonthlyBudgetLimit(Number(saved));
        setMonthlyBudgetInput(saved);
      } else {
        const fallback = weeklyBudget ? Number(weeklyBudget.amount) * 4 : 1000;
        setMonthlyBudgetLimit(fallback);
        setMonthlyBudgetInput(fallback.toString());
      }
    }
  }, [weeklyBudget]);

  // Get current calendar month key (YYYY-MM-01) & description
  const getMonthKeys = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${yyyy}-${mm}-01`;
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    return { monthStart, monthName, monthPrefix: `${yyyy}-${mm}` };
  };

  const { monthStart, monthName, monthPrefix } = getMonthKeys();

  // Load existing monthly review
  const loadExistingReview = async () => {
    if (!user) return;
    setFetchingDB(true);
    try {
      const { data, error } = await supabase
        .from('monthly_reviews')
        .select('*')
        .eq('month_date', monthStart)
        .maybeSingle();

      if (!error && data) {
        setMonthlyReview(data);
      } else {
        setMonthlyReview(null);
      }
    } catch (err) {
      console.error('Error fetching monthly review:', err);
    } finally {
      setFetchingDB(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadExistingReview();
    }
  }, [user]);

  // Filter tasks & expenses for current month
  const currentMonthTasks = tasks.filter(t => t.task_date.startsWith(monthPrefix));
  const currentMonthExpenses = expenses.filter(e => e.expense_date.startsWith(monthPrefix));

  // Compute tasks numbers
  const completedTasksCount = currentMonthTasks.filter(t => t.is_completed).length;
  const pendingTasksCount = currentMonthTasks.filter(t => !t.is_completed && new Date(t.task_date) >= new Date()).length;
  const missedTasksCount = currentMonthTasks.filter(t => !t.is_completed && new Date(t.task_date) < new Date()).length;

  // Compute spending
  const totalSpentThisMonth = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remainingBudget = monthlyBudgetLimit - totalSpentThisMonth;

  // Category breakdown lists
  const categories = [
    { name: 'food', label: 'Food & Dining', color: 'bg-emerald-500', barColor: '#10b981' },
    { name: 'travel', label: 'Transport & Travel', color: 'bg-blue-500', barColor: '#3b82f6' },
    { name: 'shopping', label: 'Shopping', color: 'bg-pink-500', barColor: '#ec4899' },
    { name: 'study', label: 'Academics & Study', color: 'bg-purple-500', barColor: '#a855f7' },
    { name: 'bills', label: 'Utilities & Bills', color: 'bg-orange-500', barColor: '#f97316' },
    { name: 'entertainment', label: 'Leisure & Entertainment', color: 'bg-indigo-500', barColor: '#6366f1' },
    { name: 'other', label: 'Others', color: 'bg-slate-500', barColor: '#64748b' }
  ];

  const categoryData = categories.map(cat => {
    const total = currentMonthExpenses
      .filter(e => e.category === cat.name)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      ...cat,
      total,
      percentage: monthlyBudgetLimit > 0 ? (total / monthlyBudgetLimit) * 100 : 0
    };
  }).filter(c => c.total > 0);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = Number(monthlyBudgetInput);
    if (!monthlyBudgetInput || val < 0) {
      addNotification('Please enter a valid monthly budget limit.', 'error');
      return;
    }
    setMonthlyBudgetLimit(val);
    localStorage.setItem('savan_monthly_budget', monthlyBudgetInput);
    addNotification(`Monthly spending limit adjusted to ${currency}${val}!`, 'success');
    confetti({
      particleCount: 50,
      spread: 40,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#a855f7']
    });
  };

  const generateMonthlyAIReview = async () => {
    setLoadingReview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('User session expired. Please sign in again.');
      }

      const res = await fetch('/api/monthly-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tasks,
          expenses,
          budgetAmount: monthlyBudgetLimit,
          monthDate: monthStart,
          currency
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to compile monthly audit.');
      }

      const data = await res.json();
      setMonthlyReview(data);
      addNotification(`Monthly audit generated for ${monthName}!`, 'success');

    } catch (err) {
      console.error(err);
      addNotification(err.message || 'Error communicating with AI Auditor.', 'error');
    } finally {
      setLoadingReview(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Organizing monthly charts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Monthly Analytics Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Overview of spending thresholds, task outputs, and Gemini reviews for <span className="text-indigo-400 font-semibold">{monthName}</span>.
          </p>
        </div>

        <button
          onClick={generateMonthlyAIReview}
          disabled={loadingReview || fetchingDB}
          className="glow-btn flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] cursor-pointer"
        >
          {loadingReview ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Consulting Monthly Auditor...</span>
            </>
          ) : monthlyReview ? (
            <>
              <RefreshCw size={14} />
              <span>Regenerate Monthly Review</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="pulse-glow" />
              <span>Request Monthly AI Review</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 bg-slate-900/40 border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Budget Target</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{currency}{monthlyBudgetLimit.toFixed(2)}</span>
            <span className="text-slate-500 text-xs ml-1">/ month</span>
          </div>
          <span className="mt-3 text-xs text-slate-500">Persisted locally in your browser.</span>
        </div>

        <div className="glass-card p-6 bg-slate-900/40 border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Spent This Month</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-white">{currency}{totalSpentThisMonth.toFixed(2)}</span>
          </div>
          <span className="mt-3 text-xs text-indigo-400 font-semibold">{currentMonthExpenses.length} transaction entries logged</span>
        </div>

        <div className="glass-card p-6 bg-slate-900/40 border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Balance</span>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-3xl font-extrabold ${remainingBudget < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {currency}{remainingBudget.toFixed(2)}
            </span>
            {remainingBudget < 0 && <AlertTriangle size={20} className="text-red-400 animate-bounce" />}
          </div>
          <span className="mt-3 text-xs text-slate-500">
            {remainingBudget < 0 ? 'Exceeded monthly savings margin!' : 'Under monthly budget target.'}
          </span>
        </div>
      </div>

      {/* Main Grid: Settings & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Setup Budget & Tasks stats */}
        <div className="lg:col-span-5 space-y-6">
          {/* Monthly Budget Setup Card */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-indigo-400" />
              <h3 className="text-base font-bold text-white">Adjust Month Limit</h3>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                  {currency}
                </div>
                <input
                  type="number"
                  step="1"
                  value={monthlyBudgetInput}
                  onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                  placeholder="1000"
                  className="glass-input pl-10 w-full"
                  required
                />
              </div>
              <button
                type="submit"
                className="glow-btn w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Set Monthly Budget Limit
              </button>
            </form>
          </div>

          {/* Monthly Task Completion Status */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                <Calendar size={18} />
                <span>Monthly Task Stats</span>
              </div>
            </div>
            
            {currentMonthTasks.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-xs">No tasks recorded in this calendar month.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5">
                  <span className="block text-xl font-black text-emerald-400">{completedTasksCount}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Done</span>
                </div>
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3.5">
                  <span className="block text-xl font-black text-indigo-400">{pendingTasksCount}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pending</span>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3.5">
                  <span className="block text-xl font-black text-red-400">{missedTasksCount}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Missed</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Category Chart */}
        <div className="lg:col-span-7">
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-emerald-400" />
                <h3 className="text-base font-bold text-white">Monthly Expenditure Category Shares</h3>
              </div>
              
              {categoryData.length === 0 ? (
                <div className="h-48 w-full flex items-center justify-center text-slate-500 text-xs">
                  No expense records logged in {monthName}.
                </div>
              ) : (
                <div className="h-56 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis dataKey="label" type="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: 'rgba(255,255,255,0.08)', 
                          borderRadius: '0.75rem', 
                          color: '#f8fafc' 
                        }}
                        formatter={(val) => [`${currency}${Number(val).toFixed(2)}`, 'Spent']}
                      />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.barColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI monthly reviews display */}
      <div className="border-t border-white/5 pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={20} className="text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Savan's Monthly Performance Review</h3>
        </div>

        {fetchingDB ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Checking monthly review archives...</span>
          </div>
        ) : !monthlyReview ? (
          <div className="glass-card p-10 text-center border border-white/5 flex flex-col items-center space-y-4 max-w-2xl mx-auto bg-slate-900/20">
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <Sparkles size={24} />
            </div>
            <h4 className="text-sm font-bold text-white">No Monthly Review generated yet</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a smart summary report at the end of the month. Savan will scan your completed tasks, evaluate category leakages, and output a detailed advisor review.
            </p>
            <button
              onClick={generateMonthlyAIReview}
              disabled={loadingReview}
              className="glow-btn py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Ask Savan for Monthly Audit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 border border-white/5 bg-slate-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 mb-3 font-semibold text-sm">
                  <Activity size={16} />
                  <span>Task Productivity Audit</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {monthlyReview.productivity_review}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-6 uppercase tracking-widest block border-t border-white/5 pt-3">
                Monthly Target Cycle
              </span>
            </div>

            <div className="glass-card p-6 border border-white/5 bg-slate-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-3 font-semibold text-sm">
                  <Wallet size={16} />
                  <span>Financial Spend Audit</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {monthlyReview.spending_review}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-6 uppercase tracking-widest block border-t border-white/5 pt-3">
                Total Month Spent
              </span>
            </div>

            <div className="glass-card p-6 border border-white/5 bg-slate-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 mb-3 font-semibold text-sm">
                  <Info size={16} />
                  <span>Warnings & Actions</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {monthlyReview.warnings_and_advice}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-6 uppercase tracking-widest block border-t border-white/5 pt-3">
                Savan Coach Advice
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
