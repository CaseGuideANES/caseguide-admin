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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Guides</h1>
          <p className="mt-2 text-slate-600">
            Manage hospital-specific anesthesia case guides.
          </p>
        </div>

        <Link
          href="/dashboard/guides/new"
          className="premium-button"
        >
          + New Guide
        </Link>
      </div>

      {!isAdmin && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
          You are not an admin. Delete access is hidden.
        </div>
      )}

      {/* Table */}
      <div className="premium-card overflow-hidden">
        <div className="border-b border-slate-200/70 px-6 py-4">
          <h2 className="font-semibold text-slate-900">All Guides</h2>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading guides...</p>
        ) : guides.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">No guides found.</p>
            <Link
              href="/dashboard/guides/new"
              className="premium-button mt-4 inline-block"
            >
              Create your first guide
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Hospital</th>
                <th className="px-6 py-4">Summary</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {guides.map((guide) => (
                <tr
                  key={guide.id}
                  className="border-t border-slate-200/70 hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-semibold text-slate-900">
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
                        className="soft-button text-xs"
                      >
                        Edit
                      </Link>

                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(guide)}
                          className="danger-button text-xs"
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

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
              !
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Delete guide?
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {deleteTarget.title}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="soft-button text-sm"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="danger-button text-sm"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}