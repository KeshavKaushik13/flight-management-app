'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plane, Mail, Lock, Loader2 } from 'lucide-react';

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('redirect') ?? '/bookings';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sb = createClient();
    const { error: authError } = await sb.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Force a full page navigation instead of client-side push
    // This ensures middleware re-evaluates the session cookie on Vercel
    window.location.href = redirect;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-700 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white text-2xl font-extrabold">
            <Plane className="h-7 w-7" /> BoardPass
          </div>
          <p className="text-blue-200 mt-2">Sign in to manage your bookings</p>
        </div>

        <form onSubmit={handleLogin} className="card shadow-2xl space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Welcome back</h2>

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                className="input pl-9"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                className="input pl-9"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign In'}
          </button>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
