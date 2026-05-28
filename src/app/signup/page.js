'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/context';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const { user } = useApp();
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
            username: username,
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-655 font-mono">
            Join Savan to start organizing tasks and tracking finances
          </p>
        </div>

        {/* Card Form */}
        <div className="doodle-card p-8">
          {success ? (
            <div className="text-center py-4 space-y-4 font-mono">
              <div className="mx-auto w-12 h-12 bg-emerald-50 border-2 border-secondary text-success rounded-[15px_4px_12px_4px/4px_12px_4px_15px] flex items-center justify-center mb-2 shadow-[2px_2px_0px_var(--secondary)]">
                <CheckCircle size={28} className="text-success" />
              </div>
              <h3 className="text-xl font-bold text-secondary font-sans">Registration Successful!</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                We've sent a verification email to <span className="font-bold text-secondary">{email}</span>. 
                Please click the activation link to complete your signup and log in.
              </p>
              <div className="pt-4">
                <Link 
                  href="/login" 
                  className="doodle-btn py-2.5 px-6 font-bold transition-all"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight size={16} className="text-secondary" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {!isEnvConfigured && (
                <div className="mb-6 p-4 bg-amber-50 border-2 border-secondary text-slate-800 text-sm rounded-[15px_4px_12px_4px/4px_12px_4px_15px] flex flex-col gap-2 font-mono shadow-[2px_2px_0px_var(--secondary)]">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs text-warning border-b border-slate-205 pb-1.5 animate-pulse">
                    <AlertCircle size={16} />
                    <span>Configuration Required</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Savan needs your Supabase credentials to manage authentication and user accounts.
                  </p>
                  <p className="text-xs text-slate-505 leading-relaxed font-bold">
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

              <form onSubmit={handleSignup} className="space-y-4 font-mono text-sm">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="doodle-input pl-10 w-full shadow-[1.5px_1.5px_0px_var(--secondary)]"
                      placeholder="John Doe"
                      required
                      disabled={!isEnvConfigured}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="doodle-input pl-10 w-full shadow-[1.5px_1.5px_0px_var(--secondary)]"
                      placeholder="savan123"
                      required
                      disabled={!isEnvConfigured}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
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
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
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
                      placeholder="Min. 6 characters"
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

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="doodle-input pl-10 pr-10 w-full shadow-[1.5px_1.5px_0px_var(--secondary)]"
                      placeholder="Repeat password"
                      required
                      disabled={!isEnvConfigured}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                      <span>Create Account</span>
                      <ArrowRight size={18} className="text-secondary" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t-2 border-slate-150 pt-6">
                <p className="text-sm text-slate-655 font-mono">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:text-primary-hover font-bold transition-colors underline">
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
