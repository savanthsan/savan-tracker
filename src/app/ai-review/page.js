'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, getWeekStartDate } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, 
  RefreshCw, 
  CalendarRange, 
  Wallet, 
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function AIReview() {
  const router = useRouter();
  const { user, loading, tasks, expenses, weeklyBudget, addNotification, currency } = useApp();

  // Review states
  const [review, setReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [fetchingDB, setFetchingDB] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const weekStart = getWeekStartDate();

  // Load existing review from Supabase
  const loadExistingReview = async () => {
    if (!user) return;
    setFetchingDB(true);
    try {
      const { data, error } = await supabase
        .from('ai_reviews')
        .select('*')
        .eq('week_start_date', weekStart)
        .maybeSingle();

      if (!error && data) {
        setReview(data);
      }
    } catch (err) {
      console.error('Error fetching existing AI review:', err);
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
    if (!fetchingDB && !review && user && !loading) {
      generateAIReview();
    }
  }, [fetchingDB, review, user, loading]);

  const generateAIReview = async () => {
    setLoadingReview(true);
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('User session expired. Please sign in again.');
      }

      const budgetAmount = weeklyBudget ? Number(weeklyBudget.amount) : 0;

      // Make API call
      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tasks,
          expenses,
          budgetAmount,
          weekStartDate: weekStart,
          currency
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate review.');
      }

      const data = await res.json();
      setReview(data);
      addNotification('Savan generated your weekly audit review!', 'success');

    } catch (err) {
      console.error(err);
      addNotification(err.message || 'Error communicating with AI Advisor.', 'error');
    } finally {
      setLoadingReview(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Tuning AI frequencies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Savan AI Advisor
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Get personalized audits analyzing your task management and weekly budget progress.
          </p>
        </div>

        <button
          onClick={generateAIReview}
          disabled={loadingReview || fetchingDB}
          className="glow-btn flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
        >
          {loadingReview ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Consulting Advisor...</span>
            </>
          ) : review ? (
            <>
              <RefreshCw size={14} />
              <span>Regenerate Audit</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="pulse-glow" />
              <span>Generate Audit</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {fetchingDB ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Checking database archives...</span>
        </div>
      ) : !review ? (
        /* Empty State */
        <div className="glass-card p-12 text-center max-w-2xl mx-auto border border-white/5 flex flex-col items-center space-y-6">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-3xl animate-pulse">
            <Sparkles size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Generate your first audit</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Once you schedule tasks and log expenses, click the button above. Savan will parse your details and provide a custom dashboard evaluating your execution and habits!
            </p>
          </div>
          <button
            onClick={generateAIReview}
            disabled={loadingReview}
            className="glow-btn px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            Ask Savan for Advice
          </button>
        </div>
      ) : (
        /* Audit Dashboard Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Card: Productivity Review */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-indigo-400 mb-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <CalendarRange size={18} />
                </div>
                <span className="font-bold text-sm">Productivity Review</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {review.productivity_review}
              </p>
            </div>
            <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Audited cycle starting</span>
              <span className="text-slate-300 font-semibold">{weekStart}</span>
            </div>
          </div>

          {/* Card: Financial Review */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-emerald-400 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Wallet size={18} />
                </div>
                <span className="font-bold text-sm">Spending Review</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {review.spending_review}
              </p>
            </div>
            <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Limit target active</span>
              <span className="text-slate-300 font-semibold">
                {weeklyBudget ? `${currency}${weeklyBudget.amount}` : 'Not set'}
              </span>
            </div>
          </div>

          {/* Card: Warnings & Action Advice */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-amber-400 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Lightbulb size={18} />
                </div>
                <span className="font-bold text-sm">Savan's Advice</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {review.warnings_and_advice}
              </p>
            </div>
            <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Auditor classification</span>
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <Sparkles size={12} className="text-emerald-400" />
                <span>Honest Companion</span>
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
