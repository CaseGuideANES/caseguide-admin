'use client';

import { supabase } from '@/src/lib/supabase/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Guide = {
  id: string;
  title: string;
  hospital: string | null;
  summary: string | null;
  created_at: string | null;
};

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Guide | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setIsAdmin(data?.role === 'admin');
  };

  const loadGuides = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('guides')
      .select('id, title, hospital, summary, created_at')
      .order('title', { ascending: true });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setGuides(data ?? []);
  };

  useEffect(() => {
    checkAdmin();
    loadGuides();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    const { error } = await supabase
      .from('guides')
      .delete()
      .eq('id', deleteTarget.id);

    setDeleting(false);

    if (error) {
      alert(error.message);
      return;
    }

    setGuides((current) =>
      current.filter((guide) => guide.id !== deleteTarget.id)
    );

    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Guides</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage hospital-specific anesthesia case guides.
          </p>
        </div>

        <Link
          href="/dashboard/guides/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + New Guide
        </Link>
      </div>

      {!isAdmin && (
        <div className="mb-6 rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm text-yellow-800">
          You are not an admin. Delete access is hidden.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">All Guides</h2>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading guides...</p>
        ) : guides.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">No guides found.</p>
            <Link
              href="/dashboard/guides/new"
              className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create your first guide
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Hospital</th>
                <th className="px-6 py-3 font-medium">Summary</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {guides.map((guide) => (
                <tr key={guide.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {guide.title}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {guide.hospital || '—'}
                  </td>

                  <td className="max-w-md truncate px-6 py-4 text-slate-600">
                    {guide.summary || '—'}
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {guide.created_at
                      ? new Date(guide.created_at).toLocaleDateString()
                      : '—'}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/guides/${guide.id}/edit`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </Link>

                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(guide)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600">
              !
            </div>

            <h2 className="text-xl font-semibold text-slate-900">
              Delete guide?
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">
                {deleteTarget.title}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Guide'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}