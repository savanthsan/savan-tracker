'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, getWeekStartDate } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Trash2, 
  Edit2, 
  Plus, 
  DollarSign, 
  FileText,
  AlertTriangle,
  FolderOpen,
  Calendar,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';

export default function Expenses() {
  const router = useRouter();
  const { user, loading, expenses, weeklyBudget, fetchExpenses, addNotification, currency } = useApp();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setExpenseDate(today);
  }, []);

  const categories = [
    { id: 'food', name: 'Food & Drinks', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', fill: '#f97316' },
    { id: 'travel', name: 'Travel & Transport', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', fill: '#3b82f6' },
    { id: 'shopping', name: 'Shopping', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', fill: '#ec4899' },
    { id: 'study', name: 'Study & Books', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', fill: '#10b981' },
    { id: 'bills', name: 'Bills & Utilities', color: 'bg-red-500/20 text-red-400 border-red-500/30', fill: '#ef4444' },
    { id: 'entertainment', name: 'Entertainment', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', fill: '#a855f7' },
    { id: 'other', name: 'Other', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', fill: '#64748b' }
  ];

  // Helper: Find category metadata
  const getCategoryMeta = (catId) => {
    return categories.find(c => c.id === catId) || categories[6];
  };

  // Filter calculations: This Week's Expenses
  const currentWeekStartStr = getWeekStartDate();
  
  const thisWeeksExpenses = expenses.filter(e => {
    return e.expense_date >= currentWeekStartStr;
  });

  const totalSpentThisWeek = thisWeeksExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const budgetAmount = weeklyBudget ? Number(weeklyBudget.amount) : 0;
  const remainingBudget = budgetAmount - totalSpentThisWeek;
  const budgetPercentage = budgetAmount > 0 ? (totalSpentThisWeek / budgetAmount) * 100 : 0;

  // Category wise calculation for progress bars
  const categoryTotals = categories.map(cat => {
    const total = expenses
      .filter(e => e.category === cat.id)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return { ...cat, total };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !expenseDate) {
      addNotification('Amount (greater than 0) and Date are required.', 'error');
      return;
    }

    setFormLoading(true);

    try {
      const expenseData = {
        amount: Number(amount),
        category,
        note: note.trim() || null,
        expense_date: expenseDate,
        user_id: user.id
      };

      if (editingId) {
        // Update
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingId);

        if (error) throw error;
        addNotification('Expense updated successfully!', 'success');
        setEditingId(null);
      } else {
        // Insert
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData]);

        if (error) throw error;
        addNotification('Expense logged successfully!', 'success');
      }

      // Reset
      setAmount('');
      setCategory('food');
      setNote('');
      const today = new Date().toISOString().split('T')[0];
      setExpenseDate(today);

      await fetchExpenses();
    } catch (err) {
      console.error(err);
      addNotification(err.message || 'Error saving expense.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (expense) => {
    setEditingId(expense.id);
    setAmount(expense.amount);
    setCategory(expense.category);
    setNote(expense.note || '');
    setExpenseDate(expense.expense_date);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setCategory('food');
    setNote('');
    const today = new Date().toISOString().split('T')[0];
    setExpenseDate(today);
  };

  const handleDeleteExpense = async (id, cost) => {
    if (!confirm(`Delete this expense of ${currency}${cost}?`)) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      addNotification(`Expense of ${currency}${cost} deleted.`, 'info');
      await fetchExpenses();
      if (editingId === id) handleCancelEdit();
    } catch (err) {
      console.error(err);
      addNotification('Failed to delete expense.', 'error');
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading financial balances...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Expense Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Log your daily spending, audit weekly budgets, and view category analytics.
          </p>
        </div>
        <Link 
          href="/budget"
          className="w-fit flex items-center gap-2 py-2 px-4 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-300 rounded-xl text-xs font-bold transition-all"
        >
          <span>Manage Weekly Budget</span>
          <LinkIcon size={12} />
        </Link>
      </div>

      {/* Grid: Financial Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Budget */}
        <div className="glass-card p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly Budget</div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white">
              {currency}{budgetAmount.toFixed(2)}
            </span>
            <span className="text-slate-500 text-xs">/ week</span>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            {weeklyBudget ? (
              <span>Active starting: <span className="text-slate-300 font-semibold">{weeklyBudget.week_start_date}</span></span>
            ) : (
              <span className="text-amber-400/80 font-medium">No budget set for this week.</span>
            )}
          </div>
        </div>

        {/* Total Spent */}
        <div className="glass-card p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Spent This Week</div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-white">
              {currency}{totalSpentThisWeek.toFixed(2)}
            </span>
          </div>
          {budgetAmount > 0 ? (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                <span>Budget Progress</span>
                <span className={budgetPercentage > 100 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                  {budgetPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercentage > 100 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                    budgetPercentage > 85 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs text-slate-500">
              Set a budget to monitor your percentage progress.
            </div>
          )}
        </div>

        {/* Remaining Money */}
        <div className="glass-card p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Balance</div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className={`text-3xl font-extrabold ${remainingBudget < 0 ? 'text-red-400 text-neon-red' : 'text-emerald-400 text-neon-emerald'}`}>
              {currency}{remainingBudget.toFixed(2)}
            </span>
            {remainingBudget < 0 && (
              <AlertTriangle size={24} className="text-red-400 animate-bounce" />
            )}
          </div>
          <div className="mt-4 text-xs text-slate-400">
            {remainingBudget < 0 ? (
              <span className="text-red-400/80 font-bold">You are over budget! Avoid shopping.</span>
            ) : (
              <span>Keep it up! You have active surplus savings.</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, Stats Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Logger Form */}
        <div className="lg:col-span-4 glass-card p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl sticky top-24">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={18} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white">
              {editingId ? 'Edit Expense Log' : 'Log New Expense'}
            </h2>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Amount ({currency}) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <DollarSign size={16} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="24.50"
                  className="glass-input pl-9 w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="glass-input w-full bg-slate-950 text-slate-200"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-950 text-slate-200">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Note / Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 text-slate-500">
                  <FileText size={16} />
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Grocery trip, books, Uber ride..."
                  className="glass-input pl-9 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Expense Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar size={16} />
                </div>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="glass-input pl-9 w-full"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={formLoading}
                className="flex-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:bg-indigo-600/50 cursor-pointer"
              >
                {formLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : editingId ? (
                  'Update Entry'
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Log Expense</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Lists & Categories */}
        <div className="lg:col-span-8 space-y-8">
          {/* Category Breakdown list */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Category Breakdown</h3>
            {categoryTotals.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No categories recorded. Log an expense above!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {categoryTotals.map((cat) => {
                  const totalAll = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
                  const sharePercentage = totalAll > 0 ? (cat.total / totalAll) * 100 : 0;
                  
                  return (
                    <div key={cat.id} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-300 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                          {cat.name}
                        </span>
                        <span className="text-white">
                          {currency}{cat.total.toFixed(2)}{' '}
                          <span className="text-[10px] text-slate-500">({sharePercentage.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${sharePercentage}%`,
                            backgroundColor: cat.fill 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Log History */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Expense Log History</h3>
            
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <div className="glass-card p-12 text-center border border-white/5 flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400">
                    <FolderOpen size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">No expenses logged yet</h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm">
                      Log your first financial expense on the left panel to begin.
                    </p>
                  </div>
                </div>
              ) : (
                expenses.map((expense) => {
                  const cat = getCategoryMeta(expense.category);
                  const isThisWeek = expense.expense_date >= currentWeekStartStr;

                  return (
                    <div
                      key={expense.id}
                      className="glass-card p-4 flex items-center justify-between gap-4 border border-white/5 bg-slate-900/40 hover:bg-slate-900/60"
                    >
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${cat.color}`}>
                              {cat.name}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar size={12} />
                              <span>{expense.expense_date}</span>
                            </span>
                            {isThisWeek && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded">
                                This Week
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-300 truncate">
                            {expense.note || <span className="text-slate-600 italic">No description</span>}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-bold text-white">
                            -{currency}{Number(expense.amount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-4 border-l border-white/5 pl-4">
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          title="Edit Entry"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id, expense.amount)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
