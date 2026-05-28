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
    try {
      await signOut();
    } catch (err) {
      console.error('Error in handleLogout:', err);
    } finally {
      if (typeof document !== 'undefined') {
        document.cookie = 'savan-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      }
      window.location.href = '/';
    }
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
      <header className="md:hidden w-full flex items-center justify-between px-6 py-4 bg-white border-b-2 border-secondary sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px_3px_8px_3px/3px_8px_3px_8px] bg-secondary flex items-center justify-center font-bold text-white shadow-[1px_2px_0px_rgba(0,0,0,15)]">
            S
          </div>
          <span className="font-bold text-xl text-secondary font-sans tracking-wide">
            Savan
          </span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bg-white border-b-2 border-secondary z-30 flex flex-col p-6 gap-4 animate-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col gap-2 font-sans">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-2 border-transparent ${
                    isActive
                      ? 'bg-primary text-secondary border-secondary shadow-[2px_2px_0px_#263d5b] font-bold'
                      : item.highlight
                      ? 'bg-secondary text-white border-secondary shadow-[2px_2px_0px_#263d5b]'
                      : 'text-slate-700 hover:text-secondary hover:bg-slate-50 hover:border-secondary'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-secondary' : item.highlight ? 'text-white' : 'text-slate-500'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t-2 border-secondary pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary border-2 border-secondary flex items-center justify-center font-bold text-secondary text-sm">
                {getInitials()}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-secondary truncate max-w-[150px]">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate max-w-[150px] font-mono">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="p-2 text-slate-600 hover:text-danger hover:bg-red-55 border border-transparent hover:border-secondary rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r-2 border-secondary p-6 justify-between sticky top-0 h-screen">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-[10px_4px_10px_4px/4px_10px_4px_10px] bg-secondary flex items-center justify-center font-extrabold text-white shadow-[2px_3px_0px_rgba(0,0,0,0.25)]">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-none text-secondary font-sans tracking-wide">
                Savan
              </span>
              <span className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-wider font-mono font-bold">
                Daily Companion
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="flex flex-col gap-2 font-sans">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[120px_10px_100px_10px/10px_100px_10px_120px] transition-all border-2 ${
                    isActive
                      ? 'bg-primary border-secondary text-secondary font-bold shadow-[2px_3px_0px_#263d5b]'
                      : item.highlight
                      ? 'bg-secondary border-secondary text-white hover:bg-secondary/95 hover:shadow-[2px_3px_0px_#263d5b] shadow-[1px_2px_0px_#263d5b]'
                      : 'text-slate-600 border-transparent hover:text-secondary hover:border-secondary hover:bg-slate-50'
                  }`}
                >
                  <Icon 
                    size={18} 
                    className={`transition-transform duration-300 ${
                      isActive 
                        ? 'text-secondary scale-110' 
                        : item.highlight 
                        ? 'text-white group-hover:scale-110' 
                        : 'text-slate-550'
                    }`} 
                  />
                  <span className="text-sm tracking-wide font-bold">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card / Logout */}
        <div className="bg-white border-2 border-secondary p-4 rounded-[20px_6px_220px_10px/12px_200px_10px_240px] shadow-[3px_4px_0px_#263d5b] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px_3px_10px_3px/3px_10px_3px_10px] bg-primary border-2 border-secondary flex items-center justify-center font-bold text-secondary text-sm shadow-[1.5px_2px_0px_rgba(0,0,0,0.15)]">
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-secondary truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate font-mono">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-red-500 hover:text-white border-2 border-secondary text-slate-700 rounded-lg text-xs font-bold transition-all shadow-[2px_2.5px_0px_#263d5b] cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
