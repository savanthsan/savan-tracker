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
  const [username, setUsername] = useState('');
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
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    } else if (profile?.full_name) {
      setFullName(profile.full_name);
    }
    
    if (user?.user_metadata?.username) {
      setUsername(user.user_metadata.username);
    }

    // Check browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [user, profile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      addNotification('Name cannot be empty.', 'error');
      return;
    }

    setUpdatingProfile(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName.trim(),
          username: username.trim()
        }
      });

      if (error) throw error;

      // Force session refresh to get new metadata
      await supabase.auth.refreshSession();
      
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-700 text-sm font-mono">Opening settings module...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary tracking-tight font-sans">
          Account Settings
        </h1>
        <p className="text-sm text-slate-655 mt-1.5 font-mono">
          Configure profile settings, adjust notifications, and manage account data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Profile & Notifications */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Profile Card */}
          <div className="doodle-card p-6">
            <div className="flex items-center gap-2.5 text-primary mb-6 border-b-2 border-secondary pb-2">
              <User size={18} className="text-secondary" />
              <h2 className="text-lg font-bold text-secondary font-sans">Profile Details</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4 font-mono text-sm">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="doodle-input w-full shadow-[1.5px_1.5px_0px_var(--secondary)] mb-4"
                  placeholder="savan123"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="doodle-input w-full shadow-[1.5px_1.5px_0px_var(--secondary)]"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  className="doodle-input w-full opacity-50 cursor-not-allowed bg-slate-50"
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
                className="doodle-btn py-3 px-5 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {updatingProfile ? (
                  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Update Profile'
                )}
              </button>
            </form>
          </div>

          {/* Web Notifications Config */}
          <div className="doodle-card p-6">
            <div className="flex items-center gap-2.5 text-primary mb-4 border-b-2 border-secondary pb-2">
              <Bell size={18} className="text-secondary" />
              <h2 className="text-lg font-bold text-secondary font-sans">Reminders & Notifications</h2>
            </div>

            <p className="text-slate-655 text-sm leading-relaxed mb-6 font-mono">
              Savan prompts browser alert reminders 15 minutes before tasks. Grant notification access below. If denied, the app will fallback to displaying visual in-app alerts.
            </p>

            <div className="flex items-center justify-between p-4 bg-slate-50 border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] mb-4 font-mono shadow-[2px_2px_0px_var(--secondary)]">
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Permission Status</span>
                <span className={`text-xs font-bold capitalize ${
                  notificationPermission === 'granted' ? 'text-success' :
                  notificationPermission === 'denied' ? 'text-danger' : 'text-primary'
                }`}>
                  {notificationPermission === 'default' ? 'Not Requested' : notificationPermission}
                </span>
              </div>

              <button
                onClick={requestNotificationPermission}
                className="doodle-btn doodle-btn-secondary py-2.5 px-4 text-xs font-bold transition-all cursor-pointer font-sans"
              >
                Request Access
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: API Info & Safety Zone */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* System API Information */}
          <div className="doodle-card p-6">
            <div className="flex items-center gap-2.5 text-primary mb-4 border-b-2 border-secondary pb-2">
              <Sparkles size={18} className="text-secondary" />
              <h2 className="text-lg font-bold text-secondary font-sans">System Integration</h2>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-mono">
              <p>
                Savan connects with <span className="font-bold text-secondary">Supabase</span> for database storage and secure session tokens, and maps planner details using <span className="font-bold text-secondary">AI Coach API</span> keys.
              </p>
              
              <div className="p-4 bg-blue-50 border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] space-y-2 shadow-[2px_2px_0px_var(--secondary)]">
                <span className="flex items-center gap-2 text-primary font-bold uppercase tracking-wide">
                  <Info size={14} className="text-secondary" />
                  <span className="text-secondary">Developer Sandbox</span>
                </span>
                <p className="text-slate-850">
                  To change your API settings or load your own private models, modify the parameters inside the root configurations file <span className="font-bold text-secondary">.env.local</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border-2 border-danger p-6 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] shadow-[3px_4px_0px_var(--danger)] transition-all hover:shadow-[5px_6px_0px_var(--danger)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2.5 text-danger mb-4 border-b-2 border-red-200 pb-2">
              <ShieldAlert size={18} />
              <h2 className="text-lg font-bold text-danger font-sans">Danger Zone</h2>
            </div>

            <p className="text-slate-750 text-sm leading-relaxed mb-6 font-mono">
              Need to clear your dashboard and start fresh? You can wipe all recorded data. This will immediately purge all logged tasks, expenses, historical budgets, and AI records.
            </p>

            <button
              onClick={handleWipeData}
              disabled={wipingData}
              className="bg-white hover:bg-red-500 hover:text-white border-2 border-danger text-danger rounded-[120px_15px_100px_15px/15px_100px_15px_120px] py-3 px-5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_var(--danger)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_var(--danger)] font-mono uppercase"
            >
              {wipingData ? (
                <div className="w-4 h-4 border-2 border-danger border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Wipe All Data</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Settings Gear Floating background detail or similar icon overlay */}
      </div>
    </div>
  );
}
