'use client';

import { useEffect, useState } from 'react';

type UserRow = {
  id: string;
  email: string;
  role: string;
  group_id: string | null;
  active: boolean;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setMessage('');

    const res = await fetch('/api/users');
    const data = await res.json();

    if (!res.ok) {
      setMessage(`Error: ${data.error}`);
      return;
    }

    setUsers(data.users || []);
  }

  async function updateUser(userId: string, updates: { role?: string; active?: boolean }) {
    setMessage('');

    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(`Error: ${data.error}`);
      return;
    }

    setMessage('User updated successfully');

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, ...updates } : user
      )
    );
  }

  const activeUsers = users.filter((user) => user.active);
  const deactivatedUsers = users.filter((user) => !user.active);

  function UserTable({ rows }: { rows: UserRow[] }) {
    return (
      <div className="overflow-hidden rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Group ID</th>
              <th className="p-3">Created</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-b last:border-b-0">
                <td className="p-3">{user.email}</td>

                <td className="p-3">
                  <select
                    className="rounded border px-2 py-1"
                    value={user.role}
                    disabled={!user.active}
                    onChange={(e) =>
                      updateUser(user.id, { role: e.target.value })
                    }
                  >
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>

                <td className="p-3 text-gray-600">
                  {user.group_id || 'No group'}
                </td>

                <td className="p-3 text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>

                <td className="p-3">
                  {user.active ? (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700">
                      Deactivated
                    </span>
                  )}
                </td>

                <td className="p-3">
                  {user.active ? (
                    <button
                      onClick={() => updateUser(user.id, { active: false })}
                      className="rounded bg-red-600 px-3 py-1 text-xs text-white"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => updateUser(user.id, { active: true })}
                      className="rounded bg-slate-800 px-3 py-1 text-xs text-white"
                    >
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="p-4 text-sm text-gray-600">No users found.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Users</h1>
      <p className="mb-6 text-sm text-gray-600">
        Manage CaseGuide user roles and activation status.
      </p>

      {message && (
        <div className="mb-4 rounded bg-green-100 p-3 text-green-700">
          {message}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">Active Users</h2>
      <UserTable rows={activeUsers} />

      <div className="my-10 border-t pt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          Deactivated Users
        </h2>
        <UserTable rows={deactivatedUsers} />
      </div>
    </div>
  );
}