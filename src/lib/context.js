'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

const AppContext = createContext();

// Utility function to get current week's start date (Monday)
export const getWeekStartDate = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust when day is Sunday (getDay() returns 0)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [weeklyBudget, setWeeklyBudget] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currency, setCurrencyState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('savan_currency') || '$';
    }
    return '$';
  });

  const setCurrency = (symbol) => {
    setCurrencyState(symbol);
    if (typeof window !== 'undefined') {
      localStorage.setItem('savan_currency', symbol);
    }
  };

  // Fetch user profile details
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, [user]);

  // Fetch tasks for the current user
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('task_date', { ascending: true })
        .order('task_time', { ascending: true })
        .limit(200);
        
      if (!error && data) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }, [user]);

  // Fetch expenses for the current user
  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .limit(200);
        
      if (!error && data) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  }, [user]);

  // Fetch current week's budget
  const fetchBudget = useCallback(async () => {
    if (!user) return;
    try {
      const currentWeekStart = getWeekStartDate();
      const { data, error } = await supabase
        .from('weekly_budgets')
        .select('*')
        .eq('week_start_date', currentWeekStart)
        .maybeSingle();
        
      if (!error && data) {
        setWeeklyBudget(data);
      } else {
        setWeeklyBudget(null);
      }
    } catch (err) {
      console.error('Error fetching budget:', err);
    }
  }, [user]);

  // Refresh all dashboard data
  const refreshAllData = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchTasks(), fetchExpenses(), fetchBudget()]);
  }, [fetchProfile, fetchTasks, fetchExpenses, fetchBudget]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isConfigured = 
      supabaseUrl && 
      !supabaseUrl.includes('placeholder-url') && 
      supabaseAnonKey && 
      supabaseAnonKey !== 'placeholder-key';

    if (!isConfigured) {
      console.warn('Supabase is not configured. Skipping session checks.');
      setLoading(false);
      return;
    }

    // checkSession removed: onAuthStateChange fires immediately on mount, preventing double-renders

    // Listen for auth state changes with robust try-catch protection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setUser(session.user);
          if (typeof document !== 'undefined') {
            document.cookie = `savan-session=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          }
        } else {
          setUser(null);
          setProfile(null);
          setTasks([]);
          setExpenses([]);
          setWeeklyBudget(null);
          if (typeof document !== 'undefined') {
            document.cookie = `savan-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
          }
        }
      } catch (err) {
        console.error('Error in onAuthStateChange callback:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user, refreshAllData]);

  // Log notification to in-app notification stack
  const addNotification = useCallback((message, type = 'info') => {
    const newNotif = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      time: new Date(),
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
    return newNotif;
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (typeof document !== 'undefined') {
        document.cookie = 'savan-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      }
      setUser(null);
      setProfile(null);
      setTasks([]);
      setExpenses([]);
      setWeeklyBudget(null);
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out of Supabase:', err);
    }
  }, []);


  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        loading,
        tasks,
        expenses,
        weeklyBudget,
        notifications,
        currency,
        setCurrency,
        fetchTasks,
        fetchExpenses,
        fetchBudget,
        refreshAllData,
        addNotification,
        signOut,
        setWeeklyBudget,
        setProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
