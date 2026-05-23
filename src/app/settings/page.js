'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Trash2, 
  ShieldAlert, 
  CheckCircle, 
  Sparkles,
  Info
} from 'lucide-react';

export default function Settings() {
  const router = useRouter();
  const { user, loading, profile, setProfile, addNotification, refreshAllData } = useApp();

  // Settings states
  const [fullName, setFullName] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [wipingData, setWipingData] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load initial settings
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
    // Check browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [profile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      addNotification('Name cannot be empty.', 'error');
      return;
    }

    setUpdatingProfile(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), updated_at: new Date() })
        .eq('id', user.id);

      if (error) throw error;

      // Update state in context
      setProfile(prev => ({ ...prev, full_name: fullName.trim() }));
      addNotification('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      addNotification(err.message || 'Error updating profile.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      addNotification('Web Notifications are not supported in this browser.', 'error');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        addNotification('Awesome! Browser notifications enabled.', 'success');
        // Trigger a test alert
        new Notification('Savan Notification Enabled', {
          body: 'You will receive reminders 15 minutes before tasks begin.',
        });
      } else {
        addNotification('Notification permission denied or dismissed.', 'warning');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWipeData = async () => {
    const confirmation1 = confirm(
      '⚠️ CRITICAL WARNING: This will permanently DELETE all of your tasks, expenses, weekly budgets, and AI reviews. This action CANNOT be undone. Are you absolutely sure?'
    );
    if (!confirmation1) return;

    const confirmation2 = confirm(
      'To prevent accidental deletions, please confirm once more. Delete all database records?'
    );
    if (!confirmation2) return;

    setWipingData(true);

    try {
      // 1. Delete tasks
      const { error: errTasks } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id);
      if (errTasks) throw errTasks;

      // 2. Delete expenses
      const { error: errExpenses } = await supabase
        .from('expenses')
        .delete()
        .eq('user_id', user.id);
      if (errExpenses) throw errExpenses;

      // 3. Delete budgets
      const { error: errBudgets } = await supabase
        .from('weekly_budgets')
        .delete()
        .eq('user_id', user.id);
      if (errBudgets) throw errBudgets;

      // 4. Delete AI reviews
      const { error: errReviews } = await supabase
        .from('ai_reviews')
        .delete()
        .eq('user_id', user.id);
      if (errReviews) throw errReviews;

      addNotification('All account data has been wiped successfully.', 'info');
      await refreshAllData();
    } catch (err) {
      console.error(err);
      addNotification('Failed to reset account data.', 'error');
    } finally {
      setWipingData(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Opening settings module...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Configure profile settings, adjust notifications, and manage account data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Profile & Notifications */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Profile Card */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
            <div className="flex items-center gap-2.5 text-indigo-400 mb-6">
              <User size={18} />
              <h2 className="text-lg font-bold text-white">Profile Details</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-input w-full"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  className="glass-input w-full opacity-50 cursor-not-allowed bg-slate-950"
                  disabled
                  title="Email cannot be changed."
                />
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  Email changes are managed securely via Supabase Auth settings.
                </span>
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:bg-indigo-600/50 cursor-pointer flex items-center justify-center gap-2"
              >
                {updatingProfile ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Update Profile'
                )}
              </button>
            </form>
          </div>

          {/* Web Notifications Config */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
            <div className="flex items-center gap-2.5 text-indigo-400 mb-4">
              <Bell size={18} />
              <h2 className="text-lg font-bold text-white">Reminders & Notifications</h2>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Savan prompts browser alert reminders 15 minutes before tasks. Grant notification access below. If denied, the app will fallback to displaying visual in-app alerts.
            </p>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl mb-4">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Permission Status</span>
                <span className={`text-xs font-bold capitalize ${
                  notificationPermission === 'granted' ? 'text-emerald-400' :
                  notificationPermission === 'denied' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {notificationPermission === 'default' ? 'Not Requested' : notificationPermission}
                </span>
              </div>

              <button
                onClick={requestNotificationPermission}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-white/5 transition-all"
              >
                Request Access
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: API Info & Safety Zone */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* System API Information */}
          <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
            <div className="flex items-center gap-2.5 text-indigo-400 mb-4">
              <Sparkles size={18} />
              <h2 className="text-lg font-bold text-white">System Integration</h2>
            </div>

            <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
              <p>
                Savan connects with <span className="font-semibold text-slate-200">Supabase</span> for database storage and secure session tokens, and maps planner details using <span className="font-semibold text-slate-200">Google Gemini AI Studio API</span> keys.
              </p>
              
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2">
                <span className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wide">
                  <Info size={14} />
                  <span>Developer Sandbox</span>
                </span>
                <p>
                  To change your API settings or load your own private models, modify the parameters inside the root configurations file <span className="font-semibold text-slate-300">.env.local</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-card p-6 border border-red-500/10 bg-red-950/5">
            <div className="flex items-center gap-2.5 text-red-400 mb-4">
              <ShieldAlert size={18} />
              <h2 className="text-lg font-bold text-white">Danger Zone</h2>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Need to clear your dashboard and start fresh? You can wipe all recorded data. This will immediately purge all logged tasks, expenses, historical budgets, and AI records.
            </p>

            <button
              onClick={handleWipeData}
              disabled={wipingData}
              className="py-3 px-5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-300 hover:text-white font-bold text-xs border border-red-500/20 hover:border-red-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {wipingData ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Wipe All Data</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
