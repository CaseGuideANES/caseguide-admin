'use client';

import { supabase } from '@/src/lib/supabase/client';
import { useEffect, useMemo, useState } from 'react';

type Role = 'viewer' | 'editor' | 'admin' | 'super_admin';

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  active: boolean;
  last_sign_in_at: string | null;
};

function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const MAX_ADMINS = 3;

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);

  const getDisplayName = (user: UserProfile) => {
    if (user.full_name) return user.full_name;

    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }

    if (user.first_name) return user.first_name;

    return user.email ?? 'Unknown User';
  };

  const getSortName = (user: UserProfile) => {
    return (
      user.full_name ||
      [user.first_name, user.last_name].filter(Boolean).join(' ') ||
      user.email ||
      ''
    );
  };

  const sortUsers = (data: UserProfile[]) => {
    return [...data].sort((a, b) =>
      getSortName(a).toLowerCase().localeCompare(getSortName(b).toLowerCase())
    );
  };

  const activeAdminCount = users.filter((u) => u.role === 'admin' && u.active).length;
  const activeSuperAdminCount = users.filter((u) => u.role === 'super_admin' && u.active).length;

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) return users;

    return users.filter((user) => {
      const name = getDisplayName(user).toLowerCase();
      const email = user.email?.toLowerCase() ?? '';
      const role = user.role.toLowerCase();

      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [users, searchQuery]);

  const activeUsers = useMemo(
    () => sortUsers(filteredUsers.filter((u) => u.active)),
    [filteredUsers]
  );

  const deactivatedUsers = useMemo(
    () => sortUsers(filteredUsers.filter((u) => !u.active)),
    [filteredUsers]
  );

  const totalActiveUsers = users.filter((u) => u.active).length;
  const totalDeactivatedUsers = users.filter((u) => !u.active).length;

  const loadUsers = async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('group_id, role')
      .eq('id', user.id)
      .single();

    const gid = profileData?.group_id;
    setCurrentUserRole((profileData?.role as Role) ?? null);

    if (!gid) {
      setLoading(false);
      return;
    }

    // Fetch profiles filtered by group at DB level (guaranteed complete)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, first_name, last_name, role, active')
      .eq('group_id', gid);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch auth data (last_sign_in_at) and merge by id
    const authRes = await fetch('/api/users');
    const authJson = authRes.ok ? await authRes.json() : { users: [] };
    const authMap: Record<string, string | null> = {};
    for (const u of authJson.users ?? []) {
      authMap[u.id] = u.last_sign_in_at ?? null;
    }

    const mapped: UserProfile[] = (data ?? []).map((p) => ({
      id: p.id,
      email: p.email ?? null,
      full_name: p.full_name ?? null,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      role: p.role as Role,
      active: p.active ?? true,
      last_sign_in_at: authMap[p.id] ?? null,
    }));

    setUsers(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (id: string, nextRole: Role) => {
    const targetUser = users.find((u) => u.id === id);

    if (nextRole === 'admin') {
      const wouldCreateNewAdmin = targetUser?.role !== 'admin';

      if (wouldCreateNewAdmin && activeAdminCount >= MAX_ADMINS) {
        alert('Only 3 active admins are allowed per group.');
        return;
      }
    }

    if (nextRole === 'super_admin') {
      const wouldCreateNewSuperAdmin = targetUser?.role !== 'super_admin';

      if (wouldCreateNewSuperAdmin && activeSuperAdminCount >= 1) {
        alert('Only 1 super admin is allowed per group. Demote the current super admin first.');
        return;
      }
    }

    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    loadUsers();
  };

  const toggleActive = async (id: string, nextActive: boolean) => {
    const targetUser = users.find((u) => u.id === id);

    if (nextActive && targetUser?.role === 'admin' && activeAdminCount >= MAX_ADMINS) {
      alert('This user is an admin. Only 3 active admins are allowed per group.');
      return;
    }

    if (nextActive && targetUser?.role === 'super_admin' && activeSuperAdminCount >= 1) {
      alert('This user is a super admin. Only 1 super admin is allowed per group.');
      return;
    }

    const { error } = await supabase.from('profiles').update({ active: nextActive }).eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    loadUsers();
  };

  const UserCard = ({ user }: { user: UserProfile }) => {
    const isSuperAdmin = currentUserRole === 'super_admin';
    const adminButtonDisabled = user.role !== 'admin' && user.role !== 'super_admin' && activeAdminCount >= MAX_ADMINS;
    const superAdminButtonDisabled = user.role !== 'super_admin' && activeSuperAdminCount >= 1;

    const roleLabel =
      user.role === 'super_admin'
        ? 'Super Admin'
        : user.role.charAt(0).toUpperCase() + user.role.slice(1);

    return (
      <div
        className={`rounded-xl border p-4 shadow-sm ${
          user.active ? 'bg-white border-gray-300' : 'bg-red-50 border-red-300'
        }`}
      >
        <div className="text-lg font-semibold text-gray-900">{getDisplayName(user)}</div>

        <div className="text-sm text-gray-500">{user.email}</div>

        <div className="text-sm mt-2 text-gray-700">
          Role:{' '}
          <span
            className={`font-bold ${user.role === 'super_admin' ? 'text-amber-600' : ''}`}
          >
            {roleLabel}
          </span>
          {!user.active ? <span className="font-bold text-red-700"> • DEACTIVATED</span> : null}
        </div>

        <div className="text-xs mt-1 text-gray-400">
          Last active: {formatLastActive(user.last_sign_in_at)}
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => updateRole(user.id, 'viewer')}
            className="px-3 py-1 bg-slate-700 rounded text-white"
          >
            Viewer
          </button>

          <button
            onClick={() => updateRole(user.id, 'editor')}
            className="px-3 py-1 bg-blue-600 rounded text-white"
          >
            Editor
          </button>

          {isSuperAdmin && (
            <button
              disabled={adminButtonDisabled}
              onClick={() => updateRole(user.id, 'admin')}
              className={`px-3 py-1 rounded text-white ${
                adminButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600'
              }`}
            >
              Admin
            </button>
          )}

          {isSuperAdmin && (
            <button
              disabled={superAdminButtonDisabled}
              onClick={() => updateRole(user.id, 'super_admin')}
              className={`px-3 py-1 rounded text-white ${
                superAdminButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-500'
              }`}
              title={superAdminButtonDisabled ? 'Only 1 super admin allowed per group' : 'Promote to Super Admin'}
            >
              Super Admin
            </button>
          )}

          <button
            onClick={() => toggleActive(user.id, !user.active)}
            className={`px-3 py-1 rounded text-white ${
              user.active ? 'bg-red-700' : 'bg-green-700'
            }`}
          >
            {user.active ? 'Deactivate' : 'Reactivate'}
          </button>

          {isSuperAdmin && (
            <button
              onClick={async () => {
                const confirmed = window.confirm(
                  `Permanently delete ${getDisplayName(user)} (${user.email})? This cannot be undone.`
                );
                if (!confirmed) return;
                const res = await fetch('/api/users', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id }),
                });
                if (res.ok) {
                  loadUsers();
                } else {
                  const json = await res.json();
                  alert(json.error ?? 'Failed to delete user.');
                }
              }}
              className="px-3 py-1 rounded bg-black text-red-400 border border-red-800"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-2 text-blue-900">Manage Users</h1>

      <p className="text-blue-800 mb-6">
        Promote, demote, deactivate, or reactivate users.
      </p>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{users.length}</p>
            </div>

            <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Active</p>
              <p className="text-2xl font-bold text-blue-900">{totalActiveUsers}</p>
            </div>

            <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Active Admins</p>
              <p className="text-2xl font-bold text-blue-900">
                {activeAdminCount} / {MAX_ADMINS}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-amber-600 font-medium">Super Admin</p>
              <p className="text-2xl font-bold text-amber-700">
                {activeSuperAdminCount} / 1
              </p>
            </div>

            <div className="bg-red-50 border border-red-300 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-red-600 font-medium">Deactivated</p>
              <p className="text-2xl font-bold text-red-700">{totalDeactivatedUsers}</p>
            </div>
          </div>

          <div className="mb-8">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-blue-900">
              Active Users ({activeUsers.length})
            </h2>

            {activeUsers.length === 0 ? (
              <p className="text-slate-500">No active users match your search.</p>
            ) : (
              <div className="space-y-4">
                {activeUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-red-700">
              Deactivated Users ({deactivatedUsers.length})
            </h2>

            {deactivatedUsers.length === 0 ? (
              <p className="text-slate-500">No deactivated users found.</p>
            ) : (
              <div className="space-y-4">
                {deactivatedUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}