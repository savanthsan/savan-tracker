'use client';

import Link from 'next/link';
import { useApp } from '@/lib/context';
import { 
  CalendarRange, 
  Wallet, 
  Sparkles, 
  Bell, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';
import BorderGlow from '@/components/BorderGlow/BorderGlow';

export default function Home() {
  const { user } = useApp();

  const features = [
    {
      icon: CalendarRange,
      title: "Intelligent Planner",
      description: "Organize your day with flexible task settings, priority tags, and time slots. Filter by Today, Upcoming, Completed, or Missed.",
      color: "from-blue-500/20 to-indigo-500/20",
      iconColor: "text-indigo-400"
    },
    {
      icon: Wallet,
      title: "Expense Companion",
      description: "Track where your money goes with visual categories. Setup expected weekly budgets and see remaining funds instantly.",
      color: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400"
    },
    {
      icon: Sparkles,
      title: "Gemini AI Audits",
      description: "Get weekly reviews combining your task completion rates and spending habits. Receive honest advice to improve your life.",
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Allow browser push alerts or check the in-app notification logs to get notified 15 minutes before tasks begin.",
      color: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400"
    }
  ];

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-hidden py-12 px-4 md:px-8">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <nav className="max-w-6xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            S
          </div>
          <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Savan
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              href="/dashboard" 
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-slate-400 hover:text-white font-semibold transition-colors py-2 px-4"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto w-full text-center mt-20 mb-16 z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
          <Sparkles size={16} className="text-emerald-400 pulse-glow" />
          <span className="text-xs font-semibold text-slate-300">Powered by Google Gemini 2.5 Flash</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl">
          Gain complete clarity over your{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">days</span> and{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">dollars</span>.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Savan is the next-gen companion combining calendar task execution with visual expense metrics. Stay productive, stick to your budget, and receive automated weekly AI reviews.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link 
            href={user ? "/dashboard" : "/signup"} 
            className="glow-btn px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2"
          >
            <span>Start Planning For Free</span>
            <ArrowRight size={18} />
          </Link>
          <Link 
            href="#features" 
            className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-slate-300 hover:text-white transition-all duration-300 flex items-center justify-center"
          >
            Explore Features
          </Link>
        </div>

        {/* Feature Grid */}
        <section id="features" className="w-full pt-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">Core Ecosystem</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Engineered with modern dashboards and responsive screens to keep you organized.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <BorderGlow
                  key={i}
                  edgeSensitivity={40}
                  glowColor="240 80 70"
                  backgroundColor="rgba(15, 23, 42, 0.4)"
                  borderRadius={16}
                  glowRadius={25}
                  glowIntensity={0.8}
                  coneSpread={20}
                  animated={true}
                  colors={['#6366f1', '#10b981', '#a855f7']}
                  className="w-full"
                >
                  <div className="p-6 flex gap-5 items-start">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}>
                      <Icon size={24} className={feature.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </BorderGlow>
              );
            })}
          </div>
        </section>

        {/* Trust Badges */}
        <div className="mt-20 flex flex-wrap justify-center gap-8 text-slate-500 text-sm font-semibold max-w-3xl border-t border-white/5 pt-10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500/80" />
            <span>Secure Supabase Auth</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500/80" />
            <span>Real-time Financial Graphs</span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={18} className="text-purple-500/80" />
            <span>Gemini AI Insights</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 mt-12 border-t border-white/5 pt-6 max-w-6xl mx-auto w-full z-10">
        <p>&copy; {new Date().getFullYear()} Savan AI Companion. No payments, no hassle. Built for high performance.</p>
      </footer>
    </div>
  );
}
