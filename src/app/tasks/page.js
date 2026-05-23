'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '@/lib/audio';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  Circle, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

export default function Tasks() {
  const router = useRouter();
  const { user, loading, tasks, fetchTasks, addNotification } = useApp();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [priority, setPriority] = useState('medium');
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Tab filtering
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'upcoming', 'completed', 'missed'
  const [searchQuery, setSearchQuery] = useState('');

  // Get current local date string (YYYY-MM-DD)
  const getLocalDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getLocalDateString();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title || !taskDate) {
      addNotification('Title and Date are required.', 'error');
      return;
    }

    setFormLoading(true);

    try {
      const taskData = {
        title,
        description,
        task_date: taskDate,
        task_time: taskTime || null,
        priority,
        user_id: user.id
      };

      if (editingId) {
        // Edit Task
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingId);

        if (error) throw error;
        addNotification(`Task "${title}" updated successfully!`, 'success');
        setEditingId(null);
      } else {
        // Add Task
        const { error } = await supabase
          .from('tasks')
          .insert([taskData]);

        if (error) throw error;
        addNotification(`Task "${title}" created successfully!`, 'success');
      }

      // Reset form fields
      setTitle('');
      setDescription('');
      setTaskDate('');
      setTaskTime('');
      setPriority('medium');
      
      // Refresh task list
      await fetchTasks();

    } catch (err) {
      console.error(err);
      addNotification(err.message || 'Error processing task.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleComplete = async (task) => {
    const updatedStatus = !task.is_completed;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: updatedStatus })
        .eq('id', task.id);

      if (error) throw error;

      if (updatedStatus) {
        // Success completion celebration confetti
        playSuccessChime();
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#a855f7']
        });
        addNotification(`Task "${task.title}" completed! Good job.`, 'success');
      }

      await fetchTasks();
    } catch (err) {
      console.error(err);
      addNotification('Failed to update task completion.', 'error');
    }
  };

  const handleEditClick = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setTaskDate(task.task_date);
    setTaskTime(task.task_time || '');
    setPriority(task.priority);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setTaskDate('');
    setTaskTime('');
    setPriority('medium');
  };

  const handleDeleteTask = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      addNotification(`Task "${name}" deleted.`, 'info');
      await fetchTasks();
      if (editingId === id) handleCancelEdit();
    } catch (err) {
      console.error(err);
      addNotification('Failed to delete task.', 'error');
    }
  };

  // Filter tasks based on tabs and query
  const filteredTasks = tasks.filter(task => {
    // Search query matching
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchesSearch) return false;

    if (activeTab === 'completed') {
      return task.is_completed;
    }

    // Active filters apply only to non-completed tasks
    if (task.is_completed) return false;

    if (activeTab === 'today') {
      return task.task_date === todayStr;
    }

    if (activeTab === 'upcoming') {
      return task.task_date > todayStr;
    }

    if (activeTab === 'missed') {
      return task.task_date < todayStr;
    }

    return true;
  });

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Synchronizing tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Task Planner
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Schedule tasks, manage priority, and keep track of your daily routine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form Panel */}
        <div className="lg:col-span-4 glass-card p-6 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl sticky top-24">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={18} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white">
              {editingId ? 'Edit Task Details' : 'Create New Task'}
            </h2>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Study science chapters..."
                className="glass-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Read chapter 4 and outline formulas."
                rows="3"
                className="glass-input w-full resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="glass-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Time (Optional)
                </label>
                <input
                  type="time"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map((p) => {
                  const activeColor = 
                    p === 'high' ? 'bg-red-500/20 border-red-500 text-red-300' :
                    p === 'medium' ? 'bg-amber-500/20 border-amber-500 text-amber-300' :
                    'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                  
                  const inactiveColor = 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10';

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border capitalize transition-all ${
                        priority === p ? activeColor : inactiveColor
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
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
                  'Update Task'
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Add Task</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Tab view and List Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-white/5 w-fit">
              {[
                { id: 'today', name: 'Today' },
                { id: 'upcoming', name: 'Upcoming' },
                { id: 'completed', name: 'Completed' },
                { id: 'missed', name: 'Missed' }
              ].map((tab) => {
                const count = tasks.filter(t => {
                  if (tab.id === 'completed') return t.is_completed;
                  if (t.is_completed) return false;
                  if (tab.id === 'today') return t.task_date === todayStr;
                  if (tab.id === 'upcoming') return t.task_date > todayStr;
                  if (tab.id === 'missed') return t.task_date < todayStr;
                  return false;
                }).length;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{tab.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      activeTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search size={14} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="glass-input pl-9 py-2 w-full text-xs"
              />
            </div>
          </div>

          {/* Task List Rendering */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="glass-card p-12 text-center border border-white/5 flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400">
                  {activeTab === 'completed' ? (
                    <CheckCircle2 size={32} />
                  ) : (
                    <CalendarDays size={32} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">No tasks found</h3>
                  <p className="text-slate-400 text-sm mt-1 max-w-sm">
                    {searchQuery 
                      ? "Try altering your query search keyword." 
                      : activeTab === 'today'
                      ? "Create some tasks for today. Keep organized!"
                      : activeTab === 'upcoming'
                      ? "No upcoming tasks scheduled for the future."
                      : activeTab === 'completed'
                      ? "Complete some tasks to view them here."
                      : "Awesome! You have no missed tasks on record."}
                  </p>
                </div>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isMissed = task.task_date < todayStr && !task.is_completed;
                const priorityStyles = 
                  task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                return (
                  <div
                    key={task.id}
                    className={`glass-card p-4 flex items-start gap-4 border transition-all ${
                      task.is_completed 
                        ? 'opacity-60 bg-slate-900/20 border-white/5' 
                        : isMissed 
                        ? 'border-red-500/20 bg-red-950/5' 
                        : 'border-white/5 bg-slate-900/40'
                    }`}
                  >
                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`text-slate-400 hover:text-white shrink-0 mt-0.5 transition-colors`}
                    >
                      {task.is_completed ? (
                        <CheckCircle size={20} className="text-indigo-400" />
                      ) : (
                        <Circle size={20} className="hover:scale-105" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${priorityStyles}`}>
                          {task.priority}
                        </span>
                        {isMissed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            <span>Missed</span>
                          </span>
                        )}
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{task.task_date}</span>
                        </span>
                        {task.task_time && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            <span>{task.task_time.slice(0, 5)}</span>
                          </span>
                        )}
                      </div>
                      <h4 className={`text-base font-bold text-white truncate ${task.is_completed ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className={`text-sm text-slate-400 mt-1 leading-relaxed ${task.is_completed ? 'line-through text-slate-600' : ''}`}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      <button
                        onClick={() => handleEditClick(task)}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        title="Edit Task"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Task"
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
  );
}
