'use client';

import { supabase } from '@/src/lib/supabase/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setIsAdmin(data?.role === 'admin');
  };

  useEffect(() => {
    checkAdmin();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage CaseGuide content, users, and invite codes.
        </p>
      </div>

      {/* Admin Status Banner */}
      {isAdmin !== null && (
        <div
          className={`mb-6 rounded-2xl p-4 text-sm font-medium ${
            isAdmin
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {isAdmin
            ? 'You are an admin — full access enabled'
            : 'You are not an admin — access may be restricted'}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/dashboard/guides"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
        >
          <p className="text-sm font-medium text-blue-600">Guides</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            Manage Guides
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create, edit, and organize case guides.
          </p>
        </Link>

        <Link
          href="/dashboard/users"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
        >
          <p className="text-sm font-medium text-blue-600">Users</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            Manage Users
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            View members and manage roles.
          </p>
        </Link>

        <Link
          href="/dashboard/invites"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
        >
          <p className="text-sm font-medium text-blue-600">Invites</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            Invite Codes
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Generate invite codes for your group.
          </p>
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">CaseGuide Admin</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Hospital-specific anesthesia workflow management
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Keep guides, users, and onboarding organized in one place.
        </p>
      </div>
    </div>
  );
}