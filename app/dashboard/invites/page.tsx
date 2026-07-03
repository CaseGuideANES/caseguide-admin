'use client';

import { supabase } from '@/src/lib/supabase/client';
import { useEffect, useState } from 'react';

type InviteCode = {
  id: string;
  code: string;
  group_id: string;
  created_at: string;
  is_active: boolean;
};

export default function InvitesPage() {
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const generateCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase();

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('group_id, role')
      .eq('id', user.id)
      .single();

    setGroupId(data?.group_id ?? null);
    setIsAdmin(data?.role === 'admin' || data?.role === 'super_admin');
  };

  const loadInvites = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single();

    const gid = profileData?.group_id;
    if (!gid) return;

    const { data, error } = await supabase
      .from('invites')
      .select('id, code, group_id, created_at, is_active')
      .eq('group_id', gid)
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setInvites(data ?? []);
  };

  useEffect(() => {
    loadProfile();
    loadInvites();
  }, []);

  const createInvite = async () => {
    if (!isAdmin) {
      alert('Only admins can generate invite codes.');
      return;
    }

    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user || !groupId) {
      setLoading(false);
      alert('Missing user or group.');
      return;
    }

    const { error } = await supabase.from('invites').insert({
      code: generateCode(),
      group_id: groupId,
      created_by: user.id,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    await loadInvites();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Invite Codes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate invite codes for your CaseGuide group.
        </p>
      </div>

      {!isAdmin && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          You are not an admin. Invite code creation is restricted.
        </div>
      )}

      {isAdmin && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <button
            onClick={createInvite}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Invite Code'}
          </button>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Recent Invite Codes</h2>
        </div>

        {invites.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No invite codes yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-mono text-lg font-semibold text-slate-900">
                    {invite.code}
                  </p>

                  <p className="text-sm text-slate-500">
                    Created: {new Date(invite.created_at).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    !invite.is_active
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {invite.is_active ? 'Active' : 'Used'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}