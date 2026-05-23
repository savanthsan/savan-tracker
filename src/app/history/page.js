'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  Wallet, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Tag,
  ArrowRight,
  TrendingDown,
  Info,
  CalendarRange
} from 'lucide-react';

export default function HistoryLog() {
  const router = useRouter();
  const { user, loading, tasks, expenses, currency } = useApp();

  // Search & Filter state controls
  const [activeTab, setActiveTab] = useState('all'); // all, tasks, expenses, reviews
  const [searchQuery, setSearchQuery] = useState('');
  
  // Specific filters
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

  // Review states
  const [weeklyReviews, setWeeklyReviews] = useState([]);
  const [monthlyReviews, setMonthlyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState(null); // id of review card expanded

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch reviews history
  const fetchReviewsHistory = async () => {
    if (!user) return;
    setLoadingReviews(true);
    try {
      const [weeklyRes, monthlyRes] = await Promise.all([
        supabase
          .from('ai_reviews')
          .select('*')
          .order('week_start_date', { ascending: false }),
        supabase
          .from('monthly_reviews')
          .select('*')
          .order('month_date', { ascending: false })
      ]);

      if (!weeklyRes.error && weeklyRes.data) {
        setWeeklyReviews(weeklyRes.data);
      }
      if (!monthlyRes.error && monthlyRes.data) {
        setMonthlyReviews(monthlyRes.data);
      }
    } catch (err) {
      console.error('Error fetching reviews history:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReviewsHistory();
    }
  }, [user]);

  // Combined events feed
  const getCombinedEvents = () => {
    const combined = [
      ...tasks.map(t => {
        // Calculate status
        const isMissed = !t.is_completed && new Date(t.task_date) < new Date();
        const status = t.is_completed ? 'completed' : isMissed ? 'missed' : 'pending';
        return {
          id: t.id,
          type: 'task',
          title: t.title,
          description: t.description || 'No description provided.',
          date: t.task_date,
          time: t.task_time,
          priority: t.priority,
          status,
          original: t
        };
      }),
      ...expenses.map(e => ({
        id: e.id,
        type: 'expense',
        title: `Logged Expense: ${e.category.toUpperCase()}`,
        description: e.note || 'No note added.',
        date: e.expense_date,
        amount: Number(e.amount),
        category: e.category,
        original: e
      }))
    ];

    // Sort by date (descending)
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const combinedEvents = getCombinedEvents();

  // Search/Filter logic for all categories
  const filteredEvents = combinedEvents.filter(event => {
    // 1. Search Query filter (matches title, description, or category notes)
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Tab Specific filtering
    if (activeTab === 'all') return true;
    
    if (activeTab === 'tasks') {
      if (event.type !== 'task') return false;
      const matchesPriority = taskPriorityFilter === 'all' || event.priority === taskPriorityFilter;
      const matchesStatus = taskStatusFilter === 'all' || event.status === taskStatusFilter;
      return matchesPriority && matchesStatus;
    }

    if (activeTab === 'expenses') {
      if (event.type !== 'expense') return false;
      const matchesCategory = expenseCategoryFilter === 'all' || event.category === expenseCategoryFilter;
      return matchesCategory;
    }

    return true;
  });

  const handleToggleExpandReview = (id) => {
    if (expandedReviewId === id) {
      setExpandedReviewId(null);
    } else {
      setExpandedReviewId(id);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Retrieving event archives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Historical Logs & Archives
          <span className="inline-flex ml-2.5 items-center justify-center px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full">
            History
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Chronological database of all planned events, categorized spending transactions, and smart AI coach audits.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 shrink-0 cursor-pointer ${
            activeTab === 'all' 
              ? 'border-indigo-500 text-white' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          All Activity Log
        </button>
        <button
          onClick={() => { setActiveTab('tasks'); setSearchQuery(''); }}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 shrink-0 cursor-pointer ${
            activeTab === 'tasks' 
              ? 'border-indigo-500 text-white' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Planner Tasks History
        </button>
        <button
          onClick={() => { setActiveTab('expenses'); setSearchQuery(''); }}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 shrink-0 cursor-pointer ${
            activeTab === 'expenses' 
              ? 'border-indigo-500 text-white' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Expense Transactions
        </button>
        <button
          onClick={() => { setActiveTab('reviews'); setSearchQuery(''); }}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 shrink-0 cursor-pointer ${
            activeTab === 'reviews' 
              ? 'border-indigo-500 text-white' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Coach Reviews
        </button>
      </div>

      {/* Search & Filter Options */}
      {activeTab !== 'reviews' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-900/40 p-4 border border-white/5 rounded-2xl">
          {/* Search bar */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by keyword or note..."
              className="glass-input pl-10 w-full text-xs py-3"
            />
          </div>

          {/* Filters column */}
          <div className="md:col-span-6 flex flex-wrap items-center gap-3">
            {activeTab === 'tasks' && (
              <>
                {/* Priority filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Priority:</span>
                  <select
                    value={taskPriorityFilter}
                    onChange={(e) => setTaskPriorityFilter(e.target.value)}
                    className="bg-slate-950/70 border border-white/5 rounded-xl px-2.5 py-1.5 text-slate-300 font-semibold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                {/* Status filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value)}
                    className="bg-slate-950/70 border border-white/5 rounded-xl px-2.5 py-1.5 text-slate-300 font-semibold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="missed">Missed</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'expenses' && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Category:</span>
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="bg-slate-950/70 border border-white/5 rounded-xl px-2.5 py-1.5 text-slate-300 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all">All Categories</option>
                  <option value="food">Food & Dining</option>
                  <option value="travel">Transport & Travel</option>
                  <option value="shopping">Shopping</option>
                  <option value="study">Academics & Study</option>
                  <option value="bills">Utilities & Bills</option>
                  <option value="entertainment">Leisure & Entertainment</option>
                  <option value="other">Others</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Renderers */}
      <div className="space-y-4">
        
        {/* Render for Reviews History */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            
            {loadingReviews ? (
              <div className="flex flex-col items-center justify-center p-12 gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500">Retrieving Saved AI Audits...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Monthly reviews */}
                {monthlyReviews.length === 0 && weeklyReviews.length === 0 ? (
                  <div className="glass-card p-12 text-center border border-white/5 text-slate-500 text-xs">
                    No historical weekly or monthly AI review logs saved in Supabase.
                  </div>
                ) : (
                  <>
                    {/* Monthly reviews list */}
                    {monthlyReviews.map(review => {
                      const id = `monthly-${review.id}`;
                      const isExpanded = expandedReviewId === id;
                      const monthName = new Date(review.month_date).toLocaleString('default', { month: 'long', year: 'numeric' });
                      return (
                        <div key={id} className="glass-card border border-emerald-500/10 bg-slate-900/40 rounded-2xl overflow-hidden transition-all duration-300 hover:border-emerald-500/20">
                          <button
                            onClick={() => handleToggleExpandReview(id)}
                            className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <Sparkles size={18} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">Monthly Advisor Audit: {monthName}</h4>
                                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">Month cycle audit</span>
                              </div>
                            </div>
                            <div className="text-slate-400">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-6 pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/20">
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                  <Clock size={12} />
                                  <span>Monthly Task Productivity</span>
                                </h5>
                                <p className="text-xs text-slate-300 leading-relaxed italic">{review.productivity_review}</p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                  <Wallet size={12} />
                                  <span>Monthly Spending Summary</span>
                                </h5>
                                <p className="text-xs text-slate-300 leading-relaxed italic">{review.spending_review}</p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                  <Info size={12} />
                                  <span>Warnings & Recommendations</span>
                                </h5>
                                <p className="text-xs text-slate-300 leading-relaxed italic">{review.warnings_and_advice}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Weekly reviews list */}
                    {weeklyReviews.map(review => {
                      const id = `weekly-${review.id}`;
                      const isExpanded = expandedReviewId === id;
                      return (
                        <div key={id} className="glass-card border border-white/5 bg-slate-900/40 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10">
                          <button
                            onClick={() => handleToggleExpandReview(id)}
                            className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                <CalendarRange size={18} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">Weekly Advisor Audit: Week of {review.week_start_date}</h4>
                                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">Weekly cycle audit</span>
                              </div>
                            </div>
                            <div className="text-slate-400">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-6 pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/20">
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                  <Clock size={12} />
                                  <span>Productivity Review</span>
                                </h5>
                                <p className="text-xs text-slate-300 leading-relaxed italic">{review.productivity_review}</p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                  <Wallet size={12} />
                                  <span>Spending Audit</span>
                                </h5>
                                <p className="text-xs text-slate-300 leading-relaxed italic">{review.spending_review}</p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                  <Info size={12} />
                                  <span>Warnings & Recommendations</span>
                                </h5>
                                <p className="text-xs text-slate-300 leading-relaxed italic">{review.warnings_and_advice}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Render for Combined / Tasks / Expenses List Feed */}
        {activeTab !== 'reviews' && (
          <div className="space-y-3.5">
            {filteredEvents.length === 0 ? (
              <div className="glass-card p-12 text-center border border-white/5 text-slate-500 text-xs">
                No history records match the search keywords or filters.
              </div>
            ) : (
              filteredEvents.map(event => {
                const isTask = event.type === 'task';
                return (
                  <div 
                    key={`${event.type}-${event.id}`}
                    className={`glass-card p-4.5 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-900/50 ${
                      isTask 
                        ? 'border-indigo-500/10 hover:border-indigo-500/25 bg-indigo-950/2'
                        : 'border-white/5 hover:border-white/10 bg-slate-900/30'
                    }`}
                  >
                    {/* Left: icon and labels */}
                    <div className="flex items-start gap-4">
                      {isTask ? (
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          event.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          event.status === 'missed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          <Calendar size={18} />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                          <Wallet size={18} />
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-200">{event.title}</h4>
                          
                          {/* Badges for status or category */}
                          {isTask ? (
                            <>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize border ${
                                event.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                event.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {event.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize border ${
                                event.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                event.status === 'missed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              }`}>
                                {event.status}
                              </span>
                            </>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize bg-slate-800 border border-white/5 text-slate-300">
                              {event.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 max-w-xl leading-relaxed">{event.description}</p>
                      </div>
                    </div>

                    {/* Right: Date, Time, Amount values */}
                    <div className="text-left md:text-right shrink-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                      {isTask ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock size={12} className="text-slate-500" />
                            <span>{event.date}</span>
                          </div>
                          {event.time && (
                            <span className="text-[10px] text-slate-500 font-semibold">{event.time.slice(0, 5)}</span>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-base font-black text-white">
                            -{currency}{event.amount.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Calendar size={10} />
                            <span>{event.date}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}
