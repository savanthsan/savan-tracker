'use client';

import Link from 'next/link';
import { useApp } from '@/lib/context';
import Footer from '@/components/Footer';
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
      color: "bg-blue-50 border-blue-300",
      iconColor: "text-primary"
    },
    {
      icon: Wallet,
      title: "Expense Companion",
      description: "Track where your money goes with visual categories. Setup expected weekly budgets and see remaining funds instantly.",
      color: "bg-emerald-50 border-emerald-300",
      iconColor: "text-success"
    },
    {
      icon: Sparkles,
      title: "Intelligent AI Audits",
      description: "Get weekly reviews combining your task completion rates and spending habits. Receive honest advice to improve your life.",
      color: "bg-purple-50 border-purple-300",
      iconColor: "text-secondary"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Allow browser push alerts or check the in-app notification logs to get notified 15 minutes before tasks begin.",
      color: "bg-amber-50 border-amber-300",
      iconColor: "text-warning"
    }
  ];

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-hidden py-12 px-4 md:px-8 bg-background">
      {/* Header */}
      <nav className="max-w-6xl mx-auto w-full flex items-center justify-between z-10 bg-white border-2 border-secondary p-4 rounded-[20px_10px_220px_12px/14px_200px_12px_250px] shadow-[3px_4px_0px_#263D5B]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px_4px_10px_4px/4px_10px_4px_10px] bg-secondary flex items-center justify-center font-extrabold text-white shadow-[1px_2px_0px_rgba(0,0,0,0.2)]">
            S
          </div>
          <span className="font-bold text-2xl text-secondary font-sans tracking-wide">
            Savan
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              href="/dashboard" 
              className="px-5 py-2.5 rounded-[120px_15px_100px_15px/15px_100px_15px_120px] bg-primary hover:bg-primary-hover border-2 border-secondary font-bold text-secondary transition-all duration-300 shadow-[2px_3px_0px_#263D5B] hover:translate-y-0.5 hover:shadow-[1px_1.5px_0px_#263D5B] flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-slate-700 hover:text-secondary font-bold transition-colors py-2 px-4 font-mono text-sm"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-5 py-2.5 rounded-[120px_15px_100px_15px/15px_100px_15px_120px] bg-primary hover:bg-primary-hover border-2 border-secondary font-bold text-secondary transition-all duration-300 shadow-[2px_3px_0px_#263D5B] hover:translate-y-0.5 hover:shadow-[1px_1.5px_0px_#263D5B]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto w-full text-center mt-20 mb-16 z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[120px_100px_110px_90px_/_45px_55px_40px_50px] bg-white border-2 border-secondary mb-6 shadow-[2.5px_3px_0px_var(--secondary)]">
          <Sparkles size={16} className="text-success animate-pulse" />
          <span className="text-xs font-bold text-secondary font-mono">Powered by Savan Intelligent AI</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-secondary mb-6 leading-tight max-w-4xl font-sans">
          Gain complete clarity over your{' '}
          <span className="text-primary underline decoration-wavy decoration-secondary">days</span> and{' '}
          <span className="text-success underline decoration-wavy decoration-secondary">dollars</span>.
        </h1>
        
        <p className="text-base md:text-lg text-slate-750 mb-10 max-w-2xl leading-relaxed font-mono">
          Savan is the next-gen companion combining calendar task execution with visual expense metrics. Stay productive, stick to your budget, and receive automated weekly AI reviews.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 font-sans">
          <Link 
            href={user ? "/dashboard" : "/signup"} 
            className="px-8 py-4 rounded-[120px_15px_100px_15px/15px_100px_15px_120px] bg-primary hover:bg-primary-hover border-2 border-secondary font-bold text-secondary transition-all duration-300 shadow-[3px_4px_0px_#263D5B] hover:translate-y-0.5 hover:shadow-[1px_1.5px_0px_#263D5B] flex items-center justify-center gap-2"
          >
            <span>Start Planning For Free</span>
            <ArrowRight size={18} />
          </Link>
          <Link 
            href="#features" 
            className="px-8 py-4 rounded-[120px_15px_100px_15px/15px_100px_15px_120px] bg-white hover:bg-slate-50 border-2 border-secondary font-bold text-secondary transition-all duration-300 shadow-[3px_4px_0px_#263D5B] hover:translate-y-0.5 hover:shadow-[1px_1.5px_0px_#263D5B] flex items-center justify-center"
          >
            Explore Features
          </Link>
        </div>

        {/* Feature Grid */}
        <section id="features" className="w-full pt-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4 font-sans">Core Ecosystem</h2>
            <p className="text-slate-650 max-w-md mx-auto font-mono text-sm">
              Engineered with modern dashboards and responsive screens to keep you organized.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-left">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <BorderGlow
                  key={i}
                  edgeSensitivity={40}
                  glowColor="73 182 229"
                  backgroundColor="#ffffff"
                  borderRadius={16}
                  glowRadius={25}
                  glowIntensity={0.8}
                  coneSpread={20}
                  animated={true}
                  colors={['#49b6e5', '#263d5b', '#16a34a']}
                  className="w-full"
                >
                  <div className="p-6 flex gap-5 items-start">
                    <div className={`p-3 rounded-xl border-2 border-secondary ${feature.color} flex items-center justify-center shrink-0 shadow-[1.5px_2px_0px_#263D5B]`}>
                      <Icon size={24} className={feature.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-secondary mb-2 font-sans">{feature.title}</h3>
                      <p className="text-slate-700 text-sm leading-relaxed font-mono">{feature.description}</p>
                    </div>
                  </div>
                </BorderGlow>
              );
            })}
          </div>
        </section>

        {/* Trust Badges */}
        <div className="mt-20 flex flex-wrap justify-center gap-8 text-secondary text-sm font-bold max-w-3xl border-t-2 border-secondary pt-10 font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-secondary rounded-lg shadow-[2px_2px_0px_#263D5B]">
            <ShieldCheck size={18} className="text-success" />
            <span>Secure Supabase Auth</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-secondary rounded-lg shadow-[2px_2px_0px_#263D5B]">
            <TrendingUp size={18} className="text-primary" />
            <span>Real-time Financial Graphs</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-secondary rounded-lg shadow-[2px_2px_0px_#263D5B]">
            <Award size={18} className="text-secondary" />
            <span>Intelligent AI Insights</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
