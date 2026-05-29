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
  
  // Validation Error States
  const [amountError, setAmountError] = useState('');
  const [expenseDateError, setExpenseDateError] = useState('');
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setExpenseDate(today);
  }, []);

  const categories = [
    { id: 'food', name: 'Food & Drinks', color: 'bg-orange-105 text-orange-700 border-orange-350', fill: '#f97316' },
    { id: 'travel', name: 'Travel & Transport', color: 'bg-blue-105 text-blue-800 border-blue-350', fill: '#3b82f6' },
    { id: 'shopping', name: 'Shopping', color: 'bg-pink-105 text-pink-750 border-pink-350', fill: '#ec4899' },
    { id: 'study', name: 'Study & Books', color: 'bg-emerald-105 text-emerald-705 border-emerald-350', fill: '#16a34a' },
    { id: 'bills', name: 'Bills & Utilities', color: 'bg-red-105 text-danger border-red-350', fill: '#dc2626' },
    { id: 'entertainment', name: 'Entertainment', color: 'bg-purple-105 text-purple-750 border-purple-350', fill: '#8b5cf6' },
    { id: 'other', name: 'Other', color: 'bg-slate-105 text-slate-700 border-slate-350', fill: '#4b5563' }
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

    setAmountError('');
    setExpenseDateError('');
    let hasError = false;

    if (!amount || Number(amount) <= 0) {
      setAmountError('This field is required.');
      hasError = true;
    }
    if (!expenseDate) {
      setExpenseDateError('This field is required.');
      hasError = true;
    }

    if (hasError) return;

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
    setAmountError('');
    setExpenseDateError('');
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-700 text-sm font-mono">Loading financial balances...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary tracking-tight font-sans">
            Expense Tracker
          </h1>
          <p className="text-sm text-slate-655 mt-1.5 font-mono">
            Log your daily spending, audit weekly budgets, and view category analytics.
          </p>
        </div>
        <Link 
          href="/budget"
          className="doodle-btn py-2.5 px-4 text-xs font-bold transition-all shadow-[2px_3px_0px_#263D5B] flex items-center gap-2 cursor-pointer"
        >
          <span>Manage Weekly Budget</span>
          <LinkIcon size={12} />
        </Link>
      </div>

      {/* Grid: Financial Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Budget */}
        <div className="bg-white border-2 border-secondary p-6 rounded-[20px_10px_220px_12px/14px_200px_12px_250px] shadow-[3px_4px_0px_#263D5B] hover:shadow-[5px_6px_0px_#263D5B] hover:-translate-y-0.5 transition-all flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Weekly Budget</div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-secondary font-sans">
              {currency}{budgetAmount.toFixed(2)}
            </span>
            <span className="text-slate-500 text-xs font-mono">/ week</span>
          </div>
          <div className="mt-4 text-xs text-slate-600 font-mono">
            {weeklyBudget ? (
              <span>Active starting: <span className="text-slate-900 font-bold">{weeklyBudget.week_start_date}</span></span>
            ) : (
              <span className="text-warning font-bold">No budget set for this week.</span>
            )}
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white border-2 border-secondary p-6 rounded-[20px_10px_220px_12px/14px_200px_12px_250px] shadow-[3px_4px_0px_#263D5B] hover:shadow-[5px_6px_0px_#263D5B] hover:-translate-y-0.5 transition-all flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Spent This Week</div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-secondary font-sans">
              {currency}{totalSpentThisWeek.toFixed(2)}
            </span>
          </div>
          {budgetAmount > 0 ? (
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1 font-mono">
                <span>Budget Progress</span>
                <span className={budgetPercentage > 100 ? 'text-danger font-bold' : 'text-slate-900'}>
                  {budgetPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 border-2 border-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercentage > 100 ? 'bg-danger' :
                    budgetPercentage > 85 ? 'bg-warning' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs text-slate-500 font-mono">
              Set a budget to monitor your percentage progress.
            </div>
          )}
        </div>

        {/* Remaining Money */}
        <div className="bg-white border-2 border-secondary p-6 rounded-[20px_10px_220px_12px/14px_200px_12px_250px] shadow-[3px_4px_0px_#263D5B] hover:shadow-[5px_6px_0px_#263D5B] hover:-translate-y-0.5 transition-all flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Remaining Balance</div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className={`text-3xl font-extrabold font-sans ${remainingBudget < 0 ? 'text-danger' : 'text-success'}`}>
              {currency}{remainingBudget.toFixed(2)}
            </span>
            {remainingBudget < 0 && (
              <AlertTriangle size={24} className="text-danger animate-bounce" />
            )}
          </div>
          <div className="mt-4 text-xs text-slate-600 font-mono">
            {remainingBudget < 0 ? (
              <span className="text-danger font-bold">You are over budget! Avoid shopping.</span>
            ) : (
              <span>Keep it up! You have active surplus savings.</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, Stats Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Logger Form */}
        <div className="lg:col-span-4 bg-white border-2 border-secondary p-6 rounded-[20px_10px_220px_12px/14px_200px_12px_250px] shadow-[3px_4px_0px_#263D5B] sticky top-24">
          <div className="flex items-center gap-2 mb-6 border-b-2 border-secondary pb-3">
            <Sparkles size={18} className="text-primary animate-pulse" />
            <h2 className="text-lg font-bold text-secondary font-sans">
              {editingId ? 'Edit Expense Log' : 'Log New Expense'}
            </h2>
          </div>

          <form onSubmit={handleFormSubmit} noValidate className="space-y-4 font-mono text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Amount ({currency}) <span className="text-danger ml-1">*</span>
              </label>
              {amountError && (
                <span className="text-[11px] text-danger font-bold block mb-1.5">{amountError}</span>
              )}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-705">
                  <DollarSign size={16} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (amountError) setAmountError('');
                  }}
                  placeholder="24.50"
                  className={`doodle-input pl-9 w-full shadow-[1.5px_2px_0px_#263D5B] ${amountError ? '!border-danger !shadow-[1.5px_1.5px_0px_var(--danger)] text-danger' : ''}`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="doodle-input w-full bg-white text-secondary shadow-[1.5px_2px_0px_#263D5B]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-white text-secondary font-mono">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Note / Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 text-slate-700">
                  <FileText size={16} />
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Grocery trip, books, Uber ride..."
                  className="doodle-input pl-9 w-full shadow-[1.5px_2px_0px_#263D5B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Expense Date <span className="text-danger ml-1">*</span>
              </label>
              {expenseDateError && (
                <span className="text-[11px] text-danger font-bold block mb-1.5">{expenseDateError}</span>
              )}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-700">
                  <Calendar size={16} />
                </div>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => {
                    setExpenseDate(e.target.value);
                    if (expenseDateError) setExpenseDateError('');
                  }}
                  className={`doodle-input pl-9 w-full shadow-[1.5px_2px_0px_#263D5B] ${expenseDateError ? '!border-danger !shadow-[1.5px_1.5px_0px_var(--danger)] text-danger' : ''}`}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 px-4 rounded-[120px_10px_100px_10px/10px_100px_10px_120px] border-2 border-secondary bg-white text-slate-850 hover:bg-slate-50 hover:translate-y-0.5 hover:shadow-[1px_1.5px_0px_#263D5B] shadow-[2px_3px_0px_#263D5B] font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={formLoading}
                className="flex-2 flex items-center justify-center gap-2 py-3 px-4 rounded-[120px_10px_100px_10px/10px_100px_10px_120px] bg-primary hover:bg-primary-hover border-2 border-secondary text-secondary font-bold text-xs transition-all shadow-[2px_3px_0px_#263D5B] hover:translate-y-0.5 hover:shadow-[1px_1.5px_0px_#263D5B] disabled:opacity-50 cursor-pointer"
              >
                {formLoading ? (
                  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
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
          <div className="bg-white border-2 border-secondary p-6 rounded-2xl shadow-[4px_4px_0px_#263D5B]">
            <h3 className="text-lg font-bold text-secondary mb-6 font-sans border-b-2 border-secondary pb-2">Category Breakdown</h3>
            {categoryTotals.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4 font-mono">No categories recorded. Log an expense above!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono">
                {categoryTotals.map((cat) => {
                  const totalAll = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
                  const sharePercentage = totalAll > 0 ? (cat.total / totalAll) * 100 : 0;
                  
                  return (
                    <div key={cat.id} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border border-secondary" style={{ backgroundColor: cat.fill }} />
                          {cat.name}
                        </span>
                        <span className="text-secondary">
                          {currency}{cat.total.toFixed(2)}{' '}
                          <span className="text-[10px] text-slate-505 font-normal">({sharePercentage.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-50 border-2 border-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full border-r-2 border-secondary"
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
            <h3 className="text-lg font-bold text-secondary font-sans border-b-2 border-secondary pb-2">Expense Log History</h3>
            
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <div className="bg-white border-2 border-secondary p-12 shadow-[4px_4px_0px_#263D5B] flex flex-col items-center justify-center space-y-4 rounded-xl">
                  <div className="p-4 bg-slate-50 border-2 border-secondary rounded-2xl text-slate-700 shadow-[1.5px_2px_0px_#263D5B]">
                    <FolderOpen size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary font-sans">No expenses logged yet</h3>
                    <p className="text-slate-655 text-sm mt-1 max-w-sm font-mono">
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
                      className="bg-white border-2 border-secondary p-4 flex items-center justify-between gap-4 shadow-[2.5px_3.5px_0px_#263D5B] hover:shadow-[4.5px_5.5px_0px_#263D5B] hover:-translate-y-0.5 transition-all rounded-xl"
                    >
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border-2 border-secondary font-mono shadow-[1px_1.5px_0px_#263D5B] ${cat.color}`}>
                              {cat.name}
                            </span>
                            <span className="text-xs text-slate-650 flex items-center gap-1 font-mono font-bold">
                              <Calendar size={12} />
                              <span>{expense.expense_date}</span>
                            </span>
                            {isThisWeek && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-primary border-2 border-secondary text-secondary font-bold rounded shadow-[1px_1.5px_0px_#263D5B] font-mono uppercase">
                                This Week
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-secondary truncate font-mono">
                            {expense.note || <span className="text-slate-400 italic">No description</span>}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-bold text-secondary font-sans">
                            -{currency}{Number(expense.amount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-4 border-l-2 border-secondary pl-4">
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="p-2 text-slate-600 hover:text-secondary hover:bg-slate-50 hover:border-secondary border border-transparent rounded-lg transition-all cursor-pointer"
                          title="Edit Entry"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id, expense.amount)}
                          className="p-2 text-slate-600 hover:text-danger hover:bg-red-50 hover:border-danger border border-transparent rounded-lg transition-all cursor-pointer"
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
