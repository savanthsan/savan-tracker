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

  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Validation Error States
  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');

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

    setFullNameError('');
    setUsernameError('');
    let hasError = false;

    if (!username.trim()) {
      setUsernameError('This field is required.');
      hasError = true;
    }
    if (!fullName.trim()) {
      setFullNameError('This field is required.');
      hasError = true;
    }

    if (hasError) return;

    setUpdatingProfile(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          full_name: (fullName || '').trim(),
          username: (username || '').trim()
        }
      });

      if (error) throw error;

      // Force session refresh to get new metadata (non-blocking)
      supabase.auth.refreshSession().catch(e => console.error('Session refresh error:', e));
      
      addNotification('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      addNotification(err.message || 'Error updating profile.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmNewPasswordError('');

    let hasError = false;

    if (!currentPassword) {
      setCurrentPasswordError('This field is required.');
      hasError = true;
    }
    if (!newPassword) {
      setNewPasswordError('This field is required.');
      hasError = true;
    } else if (newPassword.length < 6) {
      setNewPasswordError('New password must be at least 6 characters.');
      hasError = true;
    }
    if (!confirmNewPassword) {
      setConfirmNewPasswordError('This field is required.');
      hasError = true;
    } else if (newPassword !== confirmNewPassword) {
      setConfirmNewPasswordError('New passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    if (newPassword.length < 6) {
      addNotification('New password must be at least 6 characters.', 'error');
      return;
    }

    setUpdatingPassword(true);

    try {
      // Re-authenticate to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Incorrect current password.');
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      addNotification('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error(err);
      addNotification(err.message || 'Error updating password.', 'error');
    } finally {
      setUpdatingPassword(false);
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

            <form onSubmit={handleProfileUpdate} noValidate className="space-y-4 font-mono text-sm">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Username <span className="text-danger ml-1">*</span>
                </label>
                {usernameError && (
                  <span className="text-[11px] text-danger font-bold block mb-1.5">{usernameError}</span>
                )}
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError('');
                  }}
                  className={`doodle-input w-full shadow-[1.5px_1.5px_0px_var(--secondary)] mb-4 ${usernameError ? '!border-danger !shadow-[1.5px_1.5px_0px_var(--danger)] text-danger' : ''}`}
                  placeholder="savan123"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Full Name <span className="text-danger ml-1">*</span>
                </label>
                {fullNameError && (
                  <span className="text-[11px] text-danger font-bold block mb-1.5">{fullNameError}</span>
                )}
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fullNameError) setFullNameError('');
                  }}
                  className={`doodle-input w-full shadow-[1.5px_1.5px_0px_var(--secondary)] ${fullNameError ? '!border-danger !shadow-[1.5px_1.5px_0px_var(--danger)] text-danger' : ''}`}
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

          {/* Change Password Card */}
          <div className="doodle-card p-6">
            <div className="flex items-center gap-2.5 text-primary mb-6 border-b-2 border-secondary pb-2">
              <ShieldAlert size={18} className="text-secondary" />
              <h2 className="text-lg font-bold text-secondary font-sans">Security Settings</h2>
            </div>

            <form onSubmit={handlePasswordUpdate} noValidate className="space-y-4 font-mono text-sm">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Current Password <span className="text-danger ml-1">*</span>
                </label>
                {currentPasswordError && (
                  <span className="text-[11px] text-danger font-bold block mb-1.5">{currentPasswordError}</span>
                )}
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (currentPasswordError) setCurrentPasswordError('');
                  }}
                  className={`doodle-input w-full shadow-[1.5px_1.5px_0px_var(--secondary)] mb-4 ${currentPasswordError ? '!border-danger !shadow-[1.5px_1.5px_0px_var(--danger)] text-danger' : ''}`}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  New Password <span className="text-danger ml-1">*</span>
                </label>
                {newPasswordError && (
                  <span className="text-[11px] text-danger font-bold block mb-1.5">{newPasswordError}</span>
                )}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (newPasswordError) setNewPasswordError('');
                  }}
                  className={`doodle-input w-full shadow-[1.5px_1.5px_0px_var(--secondary)] mb-4 ${newPasswordError ? '!border-danger !shadow-[1.5px_1.5px_0px_var(--danger)] text-danger' : ''}`}
                  placeholder="Min. 6 characters"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Confirm New Password <span className="text-danger ml-1">*</span>
                </label>
                {confirmNewPasswordError && (
                  <span className="text-[11px] text-danger font-bold block mb-1.5">{confirmNewPasswordError}</span>
                )}
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    if (confirmNewPasswordError) setConfirmNewPasswordError('');
                  }}
                  onPaste={(e) => e.preventDefault()}
                  className={`doodle-input w-full shadow-[1.5px_1.5px_0px_var(--secondary)] ${confirmNewPasswordError ? '!border-danger !shadow-[1.5px_1.5px_0px_var(--danger)] text-danger' : ''}`}
                  placeholder="Repeat new password"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  Pasting is disabled for security reasons.
                </span>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="doodle-btn py-3 px-5 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {updatingPassword ? (
                  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Change Password'
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
