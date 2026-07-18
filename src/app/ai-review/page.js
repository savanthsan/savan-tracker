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
  const [hasAttempted, setHasAttempted] = useState(false);

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

  useEffect(() => {
    if (user) {
      loadExistingReview();
    }
  }, [user]);

  useEffect(() => {
    if (!fetchingDB && !review && user && !loading && !hasAttempted) {
      setHasAttempted(true);
      generateAIReview();
    }
  }, [fetchingDB, review, user, loading, hasAttempted]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-705 text-sm font-mono">Tuning AI frequencies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary tracking-tight font-sans">
            Savan AI Advisor
          </h1>
          <p className="text-sm text-slate-655 mt-1.5 font-mono">
            Get personalized audits analyzing your task management and weekly budget progress.
          </p>
        </div>

        <button
          onClick={generateAIReview}
          disabled={loadingReview || fetchingDB}
          className="doodle-btn flex items-center justify-center gap-2 py-3.5 px-5 text-xs font-bold transition-all cursor-pointer"
        >
          {loadingReview ? (
            <>
              <RefreshCw size={14} className="animate-spin text-secondary" />
              <span>Consulting Advisor...</span>
            </>
          ) : review ? (
            <>
              <RefreshCw size={14} className="text-secondary" />
              <span>Regenerate Audit</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-secondary animate-pulse" />
              <span>Generate Audit</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {fetchingDB ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-600 font-mono">Checking database archives...</span>
        </div>
      ) : !review ? (
        /* Empty State */
        <div className="doodle-card p-12 text-center max-w-2xl mx-auto flex flex-col items-center space-y-6">
          <div className="p-4 bg-slate-50 border-2 border-secondary text-primary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] shadow-[2px_2px_0px_var(--secondary)] animate-pulse">
            <Sparkles size={40} className="text-secondary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-secondary font-sans">Generate your first audit</h3>
            <p className="text-slate-655 text-sm leading-relaxed font-mono">
              Once you schedule tasks and log expenses, click the button above. Savan will parse your details and provide a custom dashboard evaluating your execution and habits!
            </p>
          </div>
          <button
            onClick={generateAIReview}
            disabled={loadingReview}
            className="doodle-btn px-6 py-3 text-xs font-bold transition-all"
          >
            Ask Savan for Advice
          </button>
        </div>
      ) : (
        /* Audit Dashboard Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch font-mono">
          
          {/* Card: Productivity Review */}
          <div className="doodle-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-primary mb-4 border-b-2 border-secondary pb-2">
                <div className="p-2 rounded-lg bg-blue-50 border-2 border-secondary shadow-[1.5px_1.5px_0px_var(--secondary)] text-secondary">
                  <CalendarRange size={18} />
                </div>
                <span className="font-bold text-sm font-sans text-secondary">Productivity Review</span>
              </div>
              <p className="text-slate-800 text-sm leading-relaxed">
                {review.productivity_review}
              </p>
            </div>
            <div className="mt-6 border-t-2 border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-505">
              <span>Audited cycle starting</span>
              <span className="text-secondary font-bold">{weekStart}</span>
            </div>
          </div>

          {/* Card: Financial Review */}
          <div className="doodle-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-success mb-4 border-b-2 border-secondary pb-2">
                <div className="p-2 rounded-lg bg-emerald-50 border-2 border-secondary shadow-[1.5px_1.5px_0px_var(--secondary)] text-success">
                  <Wallet size={18} />
                </div>
                <span className="font-bold text-sm font-sans text-success">Spending Review</span>
              </div>
              <p className="text-slate-800 text-sm leading-relaxed">
                {review.spending_review}
              </p>
            </div>
            <div className="mt-6 border-t-2 border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-505">
              <span>Limit target active</span>
              <span className="text-secondary font-bold">
                {weeklyBudget ? `${currency}${weeklyBudget.amount}` : 'Not set'}
              </span>
            </div>
          </div>

          {/* Card: Warnings & Action Advice */}
          <div className="doodle-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-warning mb-4 border-b-2 border-secondary pb-2">
                <div className="p-2 rounded-lg bg-amber-50 border-2 border-secondary shadow-[1.5px_1.5px_0px_var(--secondary)] text-warning">
                  <Lightbulb size={18} />
                </div>
                <span className="font-bold text-sm font-sans text-warning">Savan&apos;s Advice</span>
              </div>
              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                {review.warnings_and_advice}
              </p>
            </div>
            <div className="mt-6 border-t-2 border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-505">
              <span>Auditor classification</span>
              <span className="text-secondary font-bold flex items-center gap-1">
                <Sparkles size={12} className="text-success animate-pulse" />
                <span>Honest Companion</span>
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
