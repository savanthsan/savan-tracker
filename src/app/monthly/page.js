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
  const [hasAttempted, setHasAttempted] = useState(false);

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

  useEffect(() => {
    if (!fetchingDB && !monthlyReview && user && !loading && !hasAttempted) {
      setHasAttempted(true);
      generateMonthlyAIReview();
    }
  }, [fetchingDB, monthlyReview, user, loading, hasAttempted]);

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
    { name: 'food', label: 'Food & Dining', color: 'bg-success', barColor: '#16a34a' },
    { name: 'travel', label: 'Transport & Travel', color: 'bg-primary', barColor: '#49b6e5' },
    { name: 'shopping', label: 'Shopping', color: 'bg-warning', barColor: '#d97706' },
    { name: 'study', label: 'Academics & Study', color: 'bg-secondary', barColor: '#263d5b' },
    { name: 'bills', label: 'Utilities & Bills', color: 'bg-danger', barColor: '#dc2626' },
    { name: 'entertainment', label: 'Leisure & Entertainment', color: 'bg-primary-hover', barColor: '#38a3d2' },
    { name: 'other', label: 'Others', color: 'bg-slate-500', barColor: '#4b5563' }
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
      colors: ['#3b82f6', '#8b5cf6']
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-700 text-sm font-mono">Organizing monthly charts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary tracking-tight font-sans">
            Monthly Analytics Hub
          </h1>
          <p className="text-sm text-slate-655 mt-1.5 font-mono">
            Overview of spending thresholds, task outputs, and AI advisor reviews for <span className="text-primary font-bold">{monthName}</span>.
          </p>
        </div>

        <button
          onClick={generateMonthlyAIReview}
          disabled={loadingReview || fetchingDB}
          className="doodle-btn flex items-center justify-center gap-2 py-3.5 px-5 text-xs font-bold transition-all cursor-pointer"
        >
          {loadingReview ? (
            <>
              <RefreshCw size={14} className="animate-spin text-secondary" />
              <span>Consulting Monthly Auditor...</span>
            </>
          ) : monthlyReview ? (
            <>
              <RefreshCw size={14} className="text-secondary" />
              <span>Regenerate Monthly Review</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-secondary animate-pulse" />
              <span>Request Monthly AI Review</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="doodle-card p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Monthly Budget Target</span>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-extrabold text-secondary font-sans">{currency}{monthlyBudgetLimit.toFixed(2)}</span>
            <span className="text-slate-500 text-xs ml-1 font-mono">/ month</span>
          </div>
          <span className="mt-3 text-xs text-slate-600 font-mono">Persisted locally in your browser.</span>
        </div>

        <div className="doodle-card p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Spent This Month</span>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-secondary font-sans">{currency}{totalSpentThisMonth.toFixed(2)}</span>
          </div>
          <span className="mt-3 text-xs text-primary font-bold font-mono">{currentMonthExpenses.length} transaction entries logged</span>
        </div>

        <div className="doodle-card p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Remaining Balance</span>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-3xl font-extrabold font-sans ${remainingBudget < 0 ? 'text-danger' : 'text-success'}`}>
              {currency}{remainingBudget.toFixed(2)}
            </span>
            {remainingBudget < 0 && <AlertTriangle size={20} className="text-danger animate-bounce" />}
          </div>
          <span className="mt-3 text-xs text-slate-600 font-mono">
            {remainingBudget < 0 ? 'Exceeded monthly savings margin!' : 'Under monthly budget target.'}
          </span>
        </div>
      </div>

      {/* Main Grid: Settings & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Setup Budget & Tasks stats */}
        <div className="lg:col-span-5 space-y-6">
          {/* Monthly Budget Setup Card */}
          <div className="doodle-card p-6">
            <div className="flex items-center gap-2 mb-4 border-b-2 border-secondary pb-2">
              <TrendingUp size={18} className="text-primary" />
              <h3 className="text-base font-bold text-secondary font-sans">Adjust Month Limit</h3>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4 font-mono text-sm">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary font-bold text-sm">
                  {currency}
                </div>
                <input
                  type="number"
                  step="1"
                  value={monthlyBudgetInput}
                  onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                  placeholder="1000"
                  className="doodle-input pl-10 w-full font-bold shadow-[2px_2px_0px_var(--secondary)]"
                  required
                />
              </div>
              <button
                type="submit"
                className="doodle-btn w-full py-3 text-xs font-bold transition-all cursor-pointer"
              >
                Set Monthly Budget Limit
              </button>
            </form>
          </div>

          {/* Monthly Task Completion Status */}
          <div className="doodle-card p-6">
            <div className="flex items-center justify-between mb-4 border-b-2 border-secondary pb-2">
              <div className="flex items-center gap-2 text-primary font-bold text-base font-sans">
                <Calendar size={18} />
                <span>Monthly Task Stats</span>
              </div>
            </div>
            
            {currentMonthTasks.length === 0 ? (
              <p className="text-center py-6 text-slate-600 text-xs font-mono">No tasks recorded in this calendar month.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 text-center font-mono">
                <div className="bg-emerald-50 border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] p-3.5 shadow-[2px_2px_0px_var(--secondary)]">
                  <span className="block text-xl font-black text-success">{completedTasksCount}</span>
                  <span className="text-[10px] text-slate-700 uppercase tracking-wider font-bold">Done</span>
                </div>
                <div className="bg-blue-50 border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] p-3.5 shadow-[2px_2px_0px_var(--secondary)]">
                  <span className="block text-xl font-black text-primary">{pendingTasksCount}</span>
                  <span className="text-[10px] text-slate-700 uppercase tracking-wider font-bold">Pending</span>
                </div>
                <div className="bg-red-50 border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] p-3.5 shadow-[2px_2px_0px_var(--secondary)]">
                  <span className="block text-xl font-black text-danger">{missedTasksCount}</span>
                  <span className="text-[10px] text-slate-700 uppercase tracking-wider font-bold">Missed</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Category Chart */}
        <div className="lg:col-span-7">
          <div className="doodle-card p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b-2 border-secondary pb-2">
                <BarChart3 size={18} className="text-success" />
                <h3 className="text-base font-bold text-secondary font-sans">Monthly Expenditure Category Shares</h3>
              </div>
              
              {categoryData.length === 0 ? (
                <div className="h-48 w-full flex items-center justify-center text-slate-650 text-xs font-mono">
                  No expense records logged in {monthName}.
                </div>
              ) : (
                <div className="h-56 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" stroke="var(--secondary)" fontSize={10} tickLine={true} axisLine={true} style={{ fontFamily: 'var(--font-mono)' }} />
                      <YAxis dataKey="label" type="category" stroke="var(--secondary)" fontSize={10} tickLine={true} axisLine={true} width={110} style={{ fontFamily: 'var(--font-mono)' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '2px solid var(--secondary)', 
                          borderRadius: '8px', 
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-mono)',
                          boxShadow: '3px 3px 0px var(--secondary)'
                        }}
                        formatter={(val) => [`${currency}${Number(val).toFixed(2)}`, 'Spent']}
                      />
                      <Bar dataKey="total" radius={[0, 0, 0, 0]} stroke="var(--secondary)" strokeWidth={1.5}>
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
      <div className="border-t-2 border-secondary pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={20} className="text-secondary animate-pulse" />
          <h3 className="text-xl font-bold text-secondary font-sans">Savan's Monthly Performance Review</h3>
        </div>

        {fetchingDB ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-600 font-mono">Checking monthly review archives...</span>
          </div>
        ) : !monthlyReview ? (
          <div className="doodle-card p-10 text-center flex flex-col items-center space-y-4 max-w-2xl mx-auto">
            <div className="p-3.5 bg-slate-50 border-2 border-secondary text-primary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] shadow-[2px_2px_0px_var(--secondary)]">
              <Sparkles size={24} className="text-secondary" />
            </div>
            <h4 className="text-sm font-bold text-secondary font-sans">No Monthly Review generated yet</h4>
            <p className="text-xs text-slate-650 leading-relaxed font-mono">
              Generate a smart summary report at the end of the month. Savan will scan your completed tasks, evaluate category leakages, and output a detailed advisor review.
            </p>
            <button
              onClick={generateMonthlyAIReview}
              disabled={loadingReview}
              className="doodle-btn py-2 px-5 text-xs font-bold transition-all cursor-pointer"
            >
              Ask Savan for Monthly Audit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div className="doodle-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary mb-3 font-bold text-sm">
                  <Activity size={16} className="text-secondary" />
                  <span className="text-secondary">Task Productivity Audit</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {monthlyReview.productivity_review}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-6 uppercase tracking-widest block border-t-2 border-slate-150 pt-3">
                Monthly Target Cycle
              </span>
            </div>

            <div className="doodle-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-success mb-3 font-bold text-sm">
                  <Wallet size={16} className="text-success" />
                  <span className="text-success">Financial Spend Audit</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {monthlyReview.spending_review}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-6 uppercase tracking-widest block border-t-2 border-slate-150 pt-3">
                Total Month Spent
              </span>
            </div>

            <div className="doodle-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-warning mb-3 font-bold text-sm">
                  <Info size={16} className="text-warning" />
                  <span className="text-warning">Warnings & Actions</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {monthlyReview.warnings_and_advice}
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-6 uppercase tracking-widest block border-t-2 border-slate-150 pt-3">
                Savan Coach Advice
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
