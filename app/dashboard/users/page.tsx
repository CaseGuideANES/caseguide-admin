'use client';

import { supabase } from '@/src/lib/supabase/client';
import { useEffect, useState } from 'react';

type Role = 'viewer' | 'editor' | 'admin';

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  active: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, first_name, last_name, role, active');

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const sorted = (data ?? []).sort((a: any, b: any) =>
      getSortName(a).toLowerCase().localeCompare(getSortName(b).toLowerCase())
    );

    setUsers(sorted);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (id: string, role: Role) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    loadUsers();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('profiles').update({ active }).eq('id', id);
    loadUsers();
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Manage Users</h1>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-slate-800 p-4 rounded-xl border border-slate-700"
            >
              <div className="text-lg font-semibold">
                {getDisplayName(user)}
              </div>

              <div className="text-sm text-gray-400">
                {user.email}
              </div>

              <div className="text-sm mt-2">
                Role: <span className="font-bold">{user.role}</span>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => updateRole(user.id, 'viewer')}
                  className="px-3 py-1 bg-slate-700 rounded"
                >
                  Viewer
                </button>

                <button
                  onClick={() => updateRole(user.id, 'editor')}
                  className="px-3 py-1 bg-blue-600 rounded"
                >
                  Editor
                </button>

                <button
                  onClick={() => updateRole(user.id, 'admin')}
                  className="px-3 py-1 bg-purple-600 rounded"
                >
                  Admin
                </button>

                <button
                  onClick={() => toggleActive(user.id, !user.active)}
                  className="px-3 py-1 bg-red-700 rounded"
                >
                  {user.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}