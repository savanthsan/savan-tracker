'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/context';
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { user } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background radial glows */}
      <div className="absolute w-80 h-80 rounded-full bg-indigo-600/10 blur-[100px] top-1/4 left-1/4 pointer-events-none" />
      <div className="absolute w-80 h-80 rounded-full bg-emerald-600/10 blur-[100px] bottom-1/4 right-1/4 pointer-events-none" />

      <div className="max-w-md w-full z-10">
        {/* Head branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              S
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Savan
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to check your tasks and expense budgets
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-card p-8 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl">
          {!isEnvConfigured && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs text-amber-400">
                <AlertCircle size={16} />
                <span>Configuration Required</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Savan needs your Supabase credentials to manage authentication and user logins.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Please copy your URL and Anon Key from your Supabase Settings &gt; API and paste them in <code className="bg-black/30 px-1 py-0.5 rounded text-[11px] text-white font-mono">.env.local</code> inside the project root directory, then restart your dev server.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10 w-full"
                  placeholder="name@example.com"
                  required
                  disabled={!isEnvConfigured}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10 w-full"
                  placeholder="••••••••"
                  required
                  disabled={!isEnvConfigured}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isEnvConfigured}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:hover:bg-indigo-600/40 disabled:cursor-not-allowed font-bold text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-white/5 pt-6">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
