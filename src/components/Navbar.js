'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Wallet, 
  TrendingUp, 
  Sparkles, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  History,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define public pages where we don't display the Navigation Sidebar
  const publicPaths = ['/', '/login', '/signup'];
  if (publicPaths.includes(pathname)) return null;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CalendarRange },
    { name: 'Expenses', href: '/expenses', icon: Wallet },
    { name: 'Weekly Budget', href: '/budget', icon: TrendingUp },
    { name: 'Monthly Hub', href: '/monthly', icon: BarChart3 },
    { name: 'AI Review', href: '/ai-review', icon: Sparkles, highlight: true },
    { name: 'History Log', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      {/* Mobile Top Navbar */}
      <header className="md:hidden w-full flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            S
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Savan
          </span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-300 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bg-slate-950/95 backdrop-blur-lg border-b border-white/5 z-30 flex flex-col p-6 gap-4 animate-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-white font-medium shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                      : item.highlight
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-400' : item.highlight ? 'text-emerald-400' : ''} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t border-white/5 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-indigo-400 text-sm">
                {getInitials()}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-200 truncate max-w-[150px]">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate max-w-[150px]">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-slate-950/70 border-r border-white/5 p-6 justify-between sticky top-0 h-screen">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white shadow-[0_0_20px_rgba(99,102,241,0.6)]">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-none bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                Savan
              </span>
              <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">
                Daily Companion
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                    isActive
                      ? 'bg-indigo-600/10 border-indigo-500/20 text-white font-semibold shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                      : item.highlight
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-500/30'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon 
                    size={18} 
                    className={`transition-transform duration-300 ${
                      isActive 
                        ? 'text-indigo-400 scale-110' 
                        : item.highlight 
                        ? 'text-emerald-400 group-hover:scale-110' 
                        : 'text-slate-500'
                    }`} 
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card / Logout */}
        <div className="glass-card p-4 border border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-red-500/15 border border-white/5 hover:border-red-500/20 text-slate-400 hover:text-red-300 rounded-lg text-xs font-medium transition-all"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
