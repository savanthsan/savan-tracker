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
  CalendarRange,
  Download
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

  const handleExportCSV = () => {
    if (expenses.length === 0 && tasks.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['Type', 'Title/Category', 'Description/Note', 'Date', 'Time/Amount', 'Priority/Status'];
    const rows = [
      ...tasks.map(t => [
        'Task',
        t.title,
        t.description || '',
        t.task_date,
        t.task_time || '',
        t.is_completed ? 'Completed' : 'Pending'
      ]),
      ...expenses.map(e => [
        'Expense',
        e.category,
        e.note || '',
        e.expense_date,
        `${currency}${e.amount}`,
        ''
      ])
    ];

    const csvRows = [
      headers.join(','),
      ...rows.map(row => 
        row.map(value => `"${value.toString().replace(/"/g, '""')}"`).join(',')
      )
    ];

    // Prepend UTF-8 BOM for Microsoft Excel compliance with currency symbols
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `savan_historical_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-700 text-sm font-mono">Retrieving event archives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary tracking-tight font-sans flex flex-wrap items-center gap-2">
            Historical Logs & Archives
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold bg-primary border border-secondary text-secondary rounded-full shadow-[1.5px_1.5px_0px_var(--secondary)] font-mono">
              History
            </span>
          </h1>
          <p className="text-sm text-slate-655 mt-1.5 font-mono">
            Chronological database of all planned events, categorized spending transactions, and smart AI coach audits.
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="doodle-btn flex items-center justify-center gap-2 py-3 px-5 text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <Download size={14} className="text-secondary" />
          <span>Export Data to CSV</span>
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b-2 border-secondary overflow-x-auto no-scrollbar gap-2 pb-2">
        {[
          { id: 'all', label: 'All Activity Log' },
          { id: 'tasks', label: 'Planner Tasks History' },
          { id: 'expenses', label: 'Expense Transactions' },
          { id: 'reviews', label: 'AI Coach Reviews' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              className={`py-2.5 px-4 text-xs font-bold transition-all border-2 shrink-0 cursor-pointer rounded-xl font-mono ${
                isActive 
                  ? 'bg-primary border-secondary text-secondary shadow-[2px_2px_0px_var(--secondary)]' 
                  : 'border-transparent text-slate-600 hover:text-secondary hover:border-secondary hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Options */}
      {activeTab !== 'reviews' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center doodle-card p-4">
          {/* Search bar */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by keyword or note..."
              className="doodle-input pl-10 w-full text-xs py-3 shadow-[1.5px_1.5px_0px_var(--secondary)]"
            />
          </div>

          {/* Filters column */}
          <div className="md:col-span-6 flex flex-wrap items-center gap-3 font-mono text-xs">
            {activeTab === 'tasks' && (
              <>
                {/* Priority filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-secondary font-bold">Priority:</span>
                  <select
                    value={taskPriorityFilter}
                    onChange={(e) => setTaskPriorityFilter(e.target.value)}
                    className="bg-white border-2 border-secondary rounded-[12px_4px_14px_4px/4px_14px_4px_12px] px-2.5 py-1.5 text-secondary font-bold focus:outline-none cursor-pointer text-xs shadow-[1.5px_1.5px_0px_var(--secondary)]"
                  >
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                {/* Status filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-secondary font-bold">Status:</span>
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value)}
                    className="bg-white border-2 border-secondary rounded-[12px_4px_14px_4px/4px_14px_4px_12px] px-2.5 py-1.5 text-secondary font-bold focus:outline-none cursor-pointer text-xs shadow-[1.5px_1.5px_0px_var(--secondary)]"
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
              <div className="flex items-center gap-1.5">
                <span className="text-secondary font-bold">Category:</span>
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="bg-white border-2 border-secondary rounded-[12px_4px_14px_4px/4px_14px_4px_12px] px-2.5 py-1.5 text-secondary font-bold focus:outline-none cursor-pointer text-xs shadow-[1.5px_1.5px_0px_var(--secondary)]"
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
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-600 font-mono">Retrieving Saved AI Audits...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 font-mono">
                {/* Monthly reviews */}
                {monthlyReviews.length === 0 && weeklyReviews.length === 0 ? (
                  <div className="doodle-card p-12 text-center text-slate-650 text-xs">
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
                        <div key={id} className="doodle-card overflow-hidden">
                          <button
                            onClick={() => handleToggleExpandReview(id)}
                            className="w-full flex items-center justify-between p-5 text-left cursor-pointer bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-secondary text-success shadow-[1.5px_1.5px_0px_var(--secondary)]">
                                <Sparkles size={18} className="text-success" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-secondary font-sans">Monthly Advisor Audit: {monthName}</h4>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Month cycle audit</span>
                              </div>
                            </div>
                            <div className="text-secondary">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-6 pt-4 border-t-2 border-secondary grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50">
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-primary flex items-center gap-1.5">
                                  <Clock size={12} className="text-primary" />
                                  <span className="text-secondary">Monthly Task Productivity</span>
                                </h5>
                                <p className="text-xs text-slate-800 leading-relaxed italic">{review.productivity_review}</p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-success flex items-center gap-1.5">
                                  <Wallet size={12} className="text-success" />
                                  <span className="text-success">Monthly Spending Summary</span>
                                </h5>
                                <p className="text-xs text-slate-800 leading-relaxed italic">{review.spending_review}</p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-warning flex items-center gap-1.5">
                                  <Info size={12} className="text-warning" />
                                  <span className="text-warning">Warnings & Recommendations</span>
                                </h5>
                                <p className="text-xs text-slate-800 leading-relaxed italic">{review.warnings_and_advice}</p>
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
                        <div key={id} className="doodle-card overflow-hidden">
                          <button
                            onClick={() => handleToggleExpandReview(id)}
                            className="w-full flex items-center justify-between p-5 text-left cursor-pointer bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-blue-50 border-2 border-secondary text-primary shadow-[1.5px_1.5px_0px_var(--secondary)]">
                                <CalendarRange size={18} className="text-secondary" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-secondary font-sans">Weekly Advisor Audit: Week of {review.week_start_date}</h4>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Weekly cycle audit</span>
                              </div>
                            </div>
                            <div className="text-secondary">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-6 pt-4 border-t-2 border-secondary grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50">
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-primary flex items-center gap-1.5">
                                  <Clock size={12} className="text-primary" />
                                  <span className="text-secondary">Productivity Review</span>
                                </h5>
                                <p className="text-xs text-slate-800 leading-relaxed italic">{review.productivity_review}</p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-success flex items-center gap-1.5">
                                  <Wallet size={12} className="text-success" />
                                  <span className="text-success">Spending Audit</span>
                                </h5>
                                <p className="text-xs text-slate-800 leading-relaxed italic">{review.spending_review}</p>
                              </div>
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-warning flex items-center gap-1.5">
                                  <Info size={12} className="text-warning" />
                                  <span className="text-warning">Warnings & Recommendations</span>
                                </h5>
                                <p className="text-xs text-slate-800 leading-relaxed italic">{review.warnings_and_advice}</p>
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
          <div className="space-y-3.5 font-mono">
            {filteredEvents.length === 0 ? (
              <div className="doodle-card p-12 text-center text-slate-650 text-xs">
                No history records match the search keywords or filters.
              </div>
            ) : (
              filteredEvents.map(event => {
                const isTask = event.type === 'task';
                return (
                  <div 
                    key={`${event.type}-${event.id}`}
                    className={`doodle-card p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      isTask 
                        ? 'bg-sky-50/30 border-primary'
                        : 'bg-white'
                    }`}
                  >
                    {/* Left: icon and labels */}
                    <div className="flex items-start gap-4">
                      {isTask ? (
                        <div className={`p-2.5 rounded-xl border-2 border-secondary shrink-0 shadow-[1.5px_1.5px_0px_var(--secondary)] ${
                          event.status === 'completed' ? 'bg-emerald-50 text-success' :
                          event.status === 'missed' ? 'bg-red-50 text-danger' :
                          'bg-blue-50 text-secondary'
                        }`}>
                          <Calendar size={18} />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-secondary text-success shrink-0 shadow-[1.5px_1.5px_0px_var(--secondary)]">
                          <Wallet size={18} />
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-secondary font-sans">{event.title}</h4>
                          
                          {/* Badges for status or category */}
                          {isTask ? (
                            <>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border border-secondary font-mono shadow-[1px_1px_0px_var(--secondary)] capitalize ${
                                event.priority === 'high' ? 'bg-red-100 text-danger' :
                                event.priority === 'medium' ? 'bg-amber-100 text-warning' :
                                'bg-emerald-100 text-success'
                              }`}>
                                {event.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border border-secondary font-mono shadow-[1px_1px_0px_var(--secondary)] capitalize ${
                                event.status === 'completed' ? 'bg-emerald-100 text-success' :
                                event.status === 'missed' ? 'bg-red-100 text-danger' :
                                'bg-blue-100 text-secondary'
                              }`}>
                                {event.status}
                              </span>
                            </>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize bg-slate-100 border border-secondary shadow-[1px_1px_0px_var(--secondary)] text-slate-700 font-mono">
                              {event.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-655 max-w-xl leading-relaxed font-mono">{event.description}</p>
                      </div>
                    </div>

                    {/* Right: Date, Time, Amount values */}
                    <div className="text-left md:text-right shrink-0 border-t-2 md:border-t-0 border-slate-100 pt-3 md:pt-0 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 font-mono">
                      {isTask ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-secondary font-bold">
                            <Clock size={12} className="text-slate-500" />
                            <span>{event.date}</span>
                          </div>
                          {event.time && (
                            <span className="text-[10px] text-slate-500 font-bold">{event.time.slice(0, 5)}</span>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-base font-black text-secondary font-sans">
                            -{currency}{event.amount.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold">
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
