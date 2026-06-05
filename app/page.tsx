'use client';

import { supabase } from '@/src/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError('Invalid email or password');
      return;
    }

    router.replace('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900">
            <img
              src="/cg-logo.png"
              alt="CaseGuide"
              className="h-11 w-11 object-contain"
            />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            CaseGuide Admin
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Sign in to continue
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Admin access only
        </p>
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-6 text-xs text-slate-400">
        <a href="/marketing" className="hover:text-slate-700 transition">About CaseGuide</a>
        <a href="/support" className="hover:text-slate-700 transition">Support</a>
        <a href="/privacy" className="hover:text-slate-700 transition">Privacy Policy</a>
      </div>
    </div>
  );
}