import { Delius_Swash_Caps, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Navbar from "@/components/Navbar";
import NotificationHandler from "@/components/NotificationHandler";
import { createServerSupabaseClient } from '@/lib/supabase-server';

const delius = Delius_Swash_Caps({
  variable: "--font-delius",
  subsets: ["latin"],
  weight: ["400"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Savan - AI Planner & Expense Tracker (Doodle)",
  description: "Gain complete clarity over your tasks and finances with Savan, a beautiful visual planner and intelligent budget advisor powered by Savan AI.",
};

export default async function RootLayout({ children }) {
  let initialTasks = [];
  let initialExpenses = [];
  let initialWeeklyBudget = null;
  let initialProfile = null;
  let initialUser = null;

  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      initialUser = user;
      const [tasksRes, expensesRes, budgetRes, profileRes] = await Promise.all([
        supabase.from('tasks').select('*').order('task_date', { ascending: true }).order('task_time', { ascending: true }).limit(200),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(200),
        supabase.from('weekly_budgets').select('*').maybeSingle(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      ]);

      initialTasks = tasksRes.data || [];
      initialExpenses = expensesRes.data || [];
      initialWeeklyBudget = budgetRes.data || null;
      initialProfile = profileRes.data || null;
    }
  } catch (error) {
    console.error('Error fetching initial data in RootLayout:', error);
  }

  return (
    <html
      lang="en"
      className={`${delius.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AppProvider
          initialUser={initialUser}
          initialTasks={initialTasks}
          initialExpenses={initialExpenses}
          initialWeeklyBudget={initialWeeklyBudget}
          initialProfile={initialProfile}
        >
          <NotificationHandler />
          <div className="flex flex-col md:flex-row min-h-screen">
            <Navbar />
            <main className="flex-1 w-full p-4 md:p-6 lg:p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}


