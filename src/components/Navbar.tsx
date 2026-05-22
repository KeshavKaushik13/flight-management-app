'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Plane, Menu, X, LogOut, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/flightStore';
import { useUserStore } from '@/store/userStore';

export function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen]     = useState(false);
  const [user, setUser]     = useState<{ email?: string } | null>(null);
  const resetAll   = useFlightStore((s) => s.resetAll);
  const resetUser  = useUserStore((s) => s.resetUser);
  const setSession = useUserStore((s) => s.setSession);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setSession(session);   // keep userStore in sync for offline access
    });
    return () => subscription.unsubscribe();
  }, [setSession]);

  const handleLogout = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    resetAll();
    resetUser();
    router.push('/auth/login');
  };

  const navLinks = [
    { href: '/', label: 'Search' },
    { href: '/bookings', label: 'My Bookings' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
          <Plane className="h-5 w-5" />
          <span className="text-lg">BoardPass</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 sm:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition ${
                pathname === l.href
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 max-w-[140px] truncate">{user.email}</span>
              <button onClick={handleLogout} className="btn-secondary py-1.5 px-3 text-xs">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="btn-primary py-1.5 px-4 text-xs">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="sm:hidden p-2" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 sm:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 py-3 text-sm font-medium text-slate-700"
            >
              <BookOpen className="h-4 w-4" /> {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="btn-danger w-full mt-2 text-xs">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          ) : (
            <Link href="/auth/login" onClick={() => setOpen(false)} className="btn-primary w-full mt-2 text-xs">
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
