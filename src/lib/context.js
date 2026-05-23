'use client';

import { createContext, useContext, useState, useEffect } from 'react';
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
  const [currency, setCurrencyState] = useState('$');

  // Load currency setting from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('savan_currency') || '$';
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (symbol) => {
    setCurrencyState(symbol);
    if (typeof window !== 'undefined') {
      localStorage.setItem('savan_currency', symbol);
    }
  };

  // Fetch user profile details
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Fetch tasks for the current user
  const fetchTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('task_date', { ascending: true })
        .order('task_time', { ascending: true });
        
      if (!error && data) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  // Fetch expenses for the current user
  const fetchExpenses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
        
      if (!error && data) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  // Fetch current week's budget
  const fetchBudget = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

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
  };

  // Refresh all dashboard data
  const refreshAllData = async () => {
    await Promise.all([fetchTasks(), fetchExpenses(), fetchBudget()]);
  };

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
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
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch database entries when user session becomes active
  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user]);

  // Log notification to in-app notification stack
  const addNotification = (message, type = 'info') => {
    const newNotif = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      time: new Date(),
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
    return newNotif;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

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
