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
          colors: ['#49b6e5', '#16a34a', '#263d5b']
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-700 text-sm font-mono">Synchronizing tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary tracking-tight font-sans">
          Task Planner
        </h1>
        <p className="text-sm text-slate-655 mt-1.5 font-mono">
          Schedule tasks, manage priority, and keep track of your daily routine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form Panel */}
        <div className="lg:col-span-4 bg-white border-2 border-secondary p-6 rounded-[20px_10px_220px_12px/14px_200px_12px_250px] shadow-[3px_4px_0px_#263D5B] sticky top-24">
          <div className="flex items-center gap-2 mb-6 border-b-2 border-secondary pb-3">
            <Sparkles size={18} className="text-primary animate-pulse" />
            <h2 className="text-lg font-bold text-secondary font-sans">
              {editingId ? 'Edit Task Details' : 'Create New Task'}
            </h2>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Study science chapters..."
                className="doodle-input w-full shadow-[1.5px_2px_0px_#263D5B]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Read chapter 4 and outline formulas."
                rows="3"
                className="doodle-input w-full resize-none shadow-[1.5px_2px_0px_#263D5B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="doodle-input w-full shadow-[1.5px_2px_0px_#263D5B]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Time (Optional)
                </label>
                <input
                  type="time"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="doodle-input w-full shadow-[1.5px_2px_0px_#263D5B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map((p) => {
                  const activeColor = 
                    p === 'high' ? 'bg-danger text-white border-secondary shadow-[1.5px_2px_0px_#263D5B]' :
                    p === 'medium' ? 'bg-warning text-white border-secondary shadow-[1.5px_2px_0px_#263D5B]' :
                    'bg-success text-white border-secondary shadow-[1.5px_2px_0px_#263D5B]';
                  
                  const inactiveColor = 'bg-white border-2 border-slate-200 text-slate-600 hover:border-secondary hover:bg-slate-50';

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-3 rounded-[12px_4px_12px_4px/4px_12px_4px_12px] text-xs font-bold border-2 capitalize transition-all cursor-pointer ${
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
                  className="flex-1 py-3 px-4 rounded-[120px_10px_100px_10px/10px_100px_10px_120px] border-2 border-secondary bg-white text-slate-800 hover:bg-slate-50 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#263D5B] shadow-[2px_3px_0px_#263D5B] font-bold text-xs transition-all cursor-pointer"
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
            <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border-2 border-secondary w-fit shadow-[2px_3px_0px_#263D5B]">
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

                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-4 rounded-lg text-xs font-bold transition-all border-2 cursor-pointer ${
                      isActive
                        ? 'bg-secondary border-secondary text-white shadow-sm'
                        : 'border-transparent text-slate-600 hover:text-secondary hover:border-secondary hover:bg-slate-50'
                    }`}
                  >
                    <span>{tab.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] border ${
                      isActive ? 'bg-primary text-secondary border-secondary font-bold font-mono' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-700">
                <Search size={14} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="doodle-input pl-9 py-2 w-full text-xs shadow-[2px_3px_0px_#263D5B]"
              />
            </div>
          </div>

          {/* Task List Rendering */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white border-2 border-secondary p-12 text-center shadow-[3.5px_4px_0px_#263D5B] flex flex-col items-center justify-center space-y-4 rounded-xl">
                <div className="p-4 bg-slate-50 border-2 border-secondary rounded-2xl text-slate-700 shadow-[1.5px_2px_0px_#263D5B]">
                  {activeTab === 'completed' ? (
                    <CheckCircle2 size={32} />
                  ) : (
                    <CalendarDays size={32} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary font-sans">No tasks found</h3>
                  <p className="text-slate-655 text-sm mt-1 max-w-sm font-mono">
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
                  task.priority === 'high' ? 'bg-red-50 text-danger border-danger/30' :
                  task.priority === 'medium' ? 'bg-amber-50 text-warning border-warning/30' :
                  'bg-emerald-50 text-success border-success/30';

                return (
                  <div
                    key={task.id}
                    className={`bg-white border-2 border-secondary p-4 flex items-start gap-4 shadow-[2.5px_3.5px_0px_#263D5B] hover:shadow-[4.5px_5.5px_0px_#263D5B] hover:-translate-y-0.5 transition-all rounded-xl ${
                      task.is_completed 
                        ? 'opacity-60 border-slate-350 shadow-[1px_1px_0px_#263D5B] hover:translate-y-0 hover:shadow-[1px_1px_0px_#263D5B]' 
                        : isMissed 
                        ? 'border-danger/60 bg-red-50/50' 
                        : ''
                    }`}
                  >
                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`text-secondary hover:text-primary shrink-0 mt-0.5 transition-colors cursor-pointer`}
                    >
                      {task.is_completed ? (
                        <CheckCircle size={20} className="text-success" />
                      ) : (
                        <Circle size={20} className="hover:scale-110" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-secondary font-mono shadow-[1px_1.5px_0px_#263D5B] ${priorityStyles}`}>
                          {task.priority}
                        </span>
                        {isMissed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-danger border-2 border-secondary shadow-[1px_1.5px_0px_#263D5B] flex items-center gap-1 font-mono">
                            <AlertTriangle size={10} />
                            <span>Missed</span>
                          </span>
                        )}
                        <span className="text-xs text-slate-650 flex items-center gap-1 font-mono font-bold">
                          <Calendar size={12} />
                          <span>{task.task_date}</span>
                        </span>
                        {task.task_time && (
                          <span className="text-xs text-slate-655 flex items-center gap-1 font-mono font-bold">
                            <Clock size={12} />
                            <span>{task.task_time.slice(0, 5)}</span>
                          </span>
                        )}
                      </div>
                      <h4 className={`text-base font-bold text-secondary truncate font-sans ${task.is_completed ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className={`text-sm text-slate-700 mt-1 leading-relaxed font-mono ${task.is_completed ? 'line-through text-slate-450' : ''}`}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      <button
                        onClick={() => handleEditClick(task)}
                        className="p-2 text-slate-600 hover:text-secondary hover:bg-slate-50 hover:border-secondary border border-transparent rounded-lg transition-all cursor-pointer"
                        title="Edit Task"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-2 text-slate-600 hover:text-danger hover:bg-red-50 hover:border-danger border border-transparent rounded-lg transition-all cursor-pointer"
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
