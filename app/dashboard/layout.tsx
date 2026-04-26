'use client';

import { supabase } from '@/src/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        router.replace('/');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        router.replace('/');
        return;
      }

      setChecking(false);
    };

    checkAdminAccess();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Checking admin access...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <Link
            href="/dashboard"
            className="mb-8 flex items-center gap-3 rounded-2xl bg-slate-900 px-3 py-3 text-white shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
              <img
                src="/cg-logo.png"
                alt="CaseGuide"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div>
              <h1 className="text-lg font-semibold leading-tight">CaseGuide</h1>
              <p className="text-xs text-slate-300">Admin Portal</p>
            </div>
          </Link>

          <nav className="flex flex-col gap-2 text-sm font-medium">
            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-3 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/guides"
              className="rounded-xl px-4 py-3 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              Guides
            </Link>

            <Link
              href="/dashboard/users"
              className="rounded-xl px-4 py-3 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              Users
            </Link>

            <Link
              href="/dashboard/invites"
              className="rounded-xl px-4 py-3 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              Invites
            </Link>
          </nav>
        </div>

        <div className="mt-auto">
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              CaseGuide Admin
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Manage guides, users, and invite codes.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1">
        <div className="border-b border-slate-200 bg-white px-8 py-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Admin Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            Hospital-specific anesthesia workflow management.
          </p>
        </div>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}