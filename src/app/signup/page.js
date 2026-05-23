'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/context';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const { user } = useApp();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        // Check if user session was created immediately (meaning email confirmation is off)
        if (data?.session) {
          router.push('/dashboard');
        } else {
          setSuccess(true);
        }
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Join Savan to start organizing tasks and tracking finances
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-card p-8 border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-2">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-white">Registration Successful!</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We've sent a verification email to <span className="font-semibold text-slate-200">{email}</span>. 
                Please click the activation link to complete your signup and log in.
              </p>
              <div className="pt-4">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-all"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {!isEnvConfigured && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs text-amber-400">
                    <AlertCircle size={16} />
                    <span>Configuration Required</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Savan needs your Supabase credentials to manage authentication and user accounts.
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

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="glass-input pl-10 w-full"
                      placeholder="John Doe"
                      required
                      disabled={!isEnvConfigured}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
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
                      placeholder="Min. 6 characters"
                      required
                      disabled={!isEnvConfigured}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass-input pl-10 w-full"
                      placeholder="Repeat password"
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
                      <span>Create Account</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-white/5 pt-6">
                <p className="text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
