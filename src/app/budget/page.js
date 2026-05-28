'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, getWeekStartDate } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { 
  TrendingUp, 
  Plus, 
  DollarSign, 
  Calendar,
  Sparkles,
  History,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Budget() {
  const router = useRouter();
  const { user, loading, weeklyBudget, setWeeklyBudget, addNotification, currency } = useApp();

  // State controls
  const [amount, setAmount] = useState('');
  const [historicalBudgets, setHistoricalBudgets] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Set initial input value if budget already exists
  useEffect(() => {
    if (weeklyBudget) {
      setAmount(weeklyBudget.amount);
    }
  }, [weeklyBudget]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('weekly_budgets')
        .select('*')
        .order('week_start_date', { ascending: false });

      if (!error && data) {
        setHistoricalBudgets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, weeklyBudget]);

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 0) {
      addNotification('Please enter a valid budget amount.', 'error');
      return;
    }

    setFormLoading(true);
    const currentWeekStart = getWeekStartDate();

    try {
      // Upsert: unique constraint on (user_id, week_start_date)
      const { data, error } = await supabase
        .from('weekly_budgets')
        .upsert({
          user_id: user.id,
          week_start_date: currentWeekStart,
          amount: Number(amount)
        }, { onConflict: 'user_id, week_start_date' })
        .select()
        .single();

      if (error) throw error;

      // Update state in context
      setWeeklyBudget(data);
      addNotification(`Weekly budget set to ${currency}${amount} for week of ${currentWeekStart}!`, 'success');
      
      // Celebrate
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#8b5cf6', '#16a34a']
      });

      fetchHistory();
    } catch (err) {
      console.error(err);
      addNotification(err.message || 'Error setting budget.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-750 text-sm font-mono">Retrieving budget records...</p>
      </div>
    );
  }

  const currentMonday = getWeekStartDate();

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary tracking-tight font-sans">
          Weekly Budget Manager
        </h1>
        <p className="text-sm text-slate-650 mt-1.5 font-mono">
          Establish spending boundaries and track budget targets week-by-week.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Panel */}
        <div className="lg:col-span-5 doodle-card p-6">
          <div className="flex items-center gap-2 mb-6 border-b-2 border-secondary pb-3">
            <Sparkles size={18} className="text-success animate-pulse" />
            <h2 className="text-lg font-bold text-secondary font-sans">Define Target Budget</h2>
          </div>

          <div className="mb-6 p-4 bg-emerald-50 border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] text-xs text-slate-700 space-y-2 font-mono shadow-[2px_2px_0px_var(--secondary)]">
            <p className="flex items-center gap-2 text-success font-bold">
              <CheckCircle size={14} className="shrink-0" />
              <span>Current Cycle Period</span>
            </p>
            <p className="leading-relaxed">
              Your budget covers the week starting on Monday:{' '}
              <span className="text-slate-900 font-bold">{currentMonday}</span>. Any expense logged during this week will count against this budget limit.
            </p>
          </div>

          <form onSubmit={handleBudgetSubmit} className="space-y-5 font-mono text-sm">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2.5">
                Weekly Amount Limit ({currency})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary font-bold text-sm">
                  {currency}
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="300.00"
                  className="doodle-input pl-10 w-full text-base font-bold shadow-[2px_2px_0px_var(--secondary)]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="doodle-btn w-full py-3.5 px-4 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              ) : weeklyBudget ? (
                'Update Weekly Budget'
              ) : (
                <>
                  <Plus size={16} />
                  <span>Set Budget Limit</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: History Log */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-secondary pb-2">
            <History size={18} className="text-primary" />
            <h3 className="text-lg font-bold text-secondary font-sans">Historical Budgets Log</h3>
          </div>

          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-mono">Loading history...</span>
            </div>
          ) : historicalBudgets.length === 0 ? (
            <div className="doodle-card p-10 text-center flex flex-col items-center justify-center space-y-2">
              <AlertCircle size={24} className="text-slate-500 mb-2" />
              <h4 className="text-sm font-bold text-secondary font-sans">No records found</h4>
              <p className="text-xs text-slate-650 font-mono">Once you establish your weekly budgets, they will log here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historicalBudgets.map((b) => {
                const isCurrent = b.week_start_date === currentMonday;
                return (
                  <div
                    key={b.id}
                    className={`doodle-card p-4 flex items-center justify-between transition-all ${
                      isCurrent ? 'bg-sky-50/50 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg border-2 border-secondary flex items-center justify-center shrink-0 shadow-[1px_1px_0px_var(--secondary)] ${
                        isCurrent ? 'bg-primary text-secondary' : 'bg-slate-50 text-slate-700'
                      }`}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-secondary font-mono">
                          Week starting: {b.week_start_date}
                        </p>
                        {isCurrent && (
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 bg-primary border border-secondary text-secondary font-bold rounded font-mono uppercase shadow-[1px_1px_0px_var(--secondary)]">
                            Current Period
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-secondary font-sans">
                        {currency}{Number(b.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
