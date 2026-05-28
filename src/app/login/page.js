'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/context';
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { user } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEnvConfigured, setIsEnvConfigured] = useState(true);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Check if Supabase keys are configured in local environment
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('placeholder-url')) {
      setIsEnvConfigured(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const errMsg = err?.message || err?.toString() || '';
      if (errMsg.includes('Failed to fetch')) {
        setError('Connection Error: Failed to connect to Supabase. Please verify that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly configured in your .env.local file, and restart the development server.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative bg-background">
      <div className="max-w-md w-full z-10">
        {/* Head branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[12px_4px_14px_4px/4px_14px_4px_12px] bg-secondary flex items-center justify-center font-extrabold text-white shadow-[2px_2px_0px_var(--secondary)]">
              S
            </div>
            <span className="font-bold text-2xl text-secondary font-sans">
              Savan
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold text-secondary tracking-tight font-sans">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-655 font-mono">
            Sign in to check your tasks and expense budgets
          </p>
        </div>

        {/* Card Form */}
        <div className="doodle-card p-8">
          {!isEnvConfigured && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-secondary text-slate-800 text-sm rounded-[15px_4px_12px_4px/4px_12px_4px_15px] flex flex-col gap-2 font-mono shadow-[2px_2px_0px_var(--secondary)]">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs text-warning border-b border-slate-200 pb-1.5 animate-pulse">
                <AlertCircle size={16} />
                <span>Configuration Required</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Savan needs your Supabase credentials to manage authentication and user logins.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed font-bold">
                Please copy your URL and Anon Key from your Supabase Settings &gt; API and paste them in <code className="bg-slate-100 border border-secondary px-1 py-0.5 rounded text-[11px] text-secondary font-mono">.env.local</code> inside the project root directory, then restart your dev server.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-secondary text-danger text-sm rounded-[15px_4px_12px_4px/4px_12px_4px_15px] flex items-start gap-2.5 font-mono shadow-[2px_2px_0px_var(--secondary)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 font-mono text-sm">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="doodle-input pl-10 w-full shadow-[1.5px_1.5px_0px_var(--secondary)]"
                  placeholder="name@example.com"
                  required
                  disabled={!isEnvConfigured}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="doodle-input pl-10 pr-10 w-full shadow-[1.5px_1.5px_0px_var(--secondary)]"
                  placeholder="••••••••"
                  required
                  disabled={!isEnvConfigured}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isEnvConfigured}
              className="doodle-btn w-full py-3.5 px-4 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="text-secondary" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t-2 border-slate-150 pt-6">
            <p className="text-sm text-slate-655 font-mono">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primary-hover font-bold transition-colors underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
