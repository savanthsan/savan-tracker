'use client';

import { useEffect, useState, useRef } from 'react';
import { useApp } from '@/lib/context';
import { Bell, X, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function NotificationHandler() {
  const { tasks, addNotification, notifications } = useApp();
  const [activeToasts, setActiveToasts] = useState([]);
  const notifiedTasksRef = useRef(new Set());
  const timeoutsRef = useRef(new Map());
  const tasksRef = useRef(tasks);

  // Keep tasksRef synced
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Clean up all toasts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Handle toast timers
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const latest = notifications[0];
    setActiveToasts(prev => {
      if (prev.some(t => t.id === latest.id)) return prev;
      
      const timer = setTimeout(() => {
        setActiveToasts(p => p.filter(t => t.id !== latest.id));
        timeoutsRef.current.delete(latest.id);
      }, 6000);
      timeoutsRef.current.set(latest.id, timer);
      
      return [latest, ...prev].slice(0, 5);
    });
  }, [notifications]);

  // Check upcoming tasks
  useEffect(() => {
    const checkUpcomingTasks = () => {
      const currentTasks = tasksRef.current;
      if (!currentTasks || currentTasks.length === 0) return;

      const now = new Date();
      
      currentTasks.forEach(task => {
        if (task.is_completed) return;
        if (notifiedTasksRef.current.has(task.id)) return;

        // Parse date and time
        // task_date is YYYY-MM-DD
        // task_time is HH:MM:SS
        if (!task.task_date) return;
        
        const [year, month, day] = task.task_date.split('-').map(Number);
        let hour = 9; // default 9 AM
        let minute = 0;
        
        if (task.task_time) {
          const [h, m] = task.task_time.split(':').map(Number);
          hour = h;
          minute = m;
        }

        const taskDateTime = new Date(year, month - 1, day, hour, minute);
        
        // Calculate difference in milliseconds
        const diffMs = taskDateTime - now;
        const diffMins = diffMs / (1000 * 60);

        // If task is in the future, and within 15 minutes
        if (diffMins > 0 && diffMins <= 15) {
          const reminderMsg = `Upcoming task: "${task.title}" at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Mark as notified
          notifiedTasksRef.current.add(task.id);

          // 1. Browser Notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Savan Planner Reminder', {
                body: reminderMsg,
                icon: '/favicon.ico'
              });
            } catch (e) {
              console.error('Failed to trigger browser notification:', e);
            }
          }

          // 2. In-app notification
          addNotification(reminderMsg, 'warning');
        }
      });
    };

    // Check once immediately on load
    checkUpcomingTasks();

    // Check every 30 seconds
    const interval = setInterval(checkUpcomingTasks, 30000);

    return () => clearInterval(interval);
  }, [addNotification]);

  const removeToast = (id) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {activeToasts.map((toast) => {
        let Icon = Info;
        let colorClasses = "bg-slate-900 border-indigo-500/30 text-slate-100";
        let iconColor = "text-indigo-400";

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          colorClasses = "bg-slate-900 border-emerald-500/30 text-slate-100";
          iconColor = "text-emerald-400";
        } else if (toast.type === 'warning') {
          Icon = Bell;
          colorClasses = "bg-slate-900 border-amber-500/30 text-slate-100";
          iconColor = "text-amber-400";
        } else if (toast.type === 'error') {
          Icon = AlertTriangle;
          colorClasses = "bg-slate-900 border-red-500/30 text-slate-100";
          iconColor = "text-red-400";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex gap-3.5 p-4 rounded-xl border backdrop-blur-lg shadow-2xl transition-all duration-300 animate-in slide-in-from-right-10 ${colorClasses}`}
          >
            <div className={`p-1.5 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${iconColor}`}>
              <Icon size={18} />
            </div>
            
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-medium leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-white transition-colors shrink-0 self-start p-0.5 hover:bg-white/5 rounded"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
