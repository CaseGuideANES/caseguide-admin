"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  is_active: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  const updateRole = async (id: string, role: User["role"]) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, role }),
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, is_active: !is_active }),
    });

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, is_active: !is_active } : u
      )
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Users</h1>
        <p className="mt-2 text-slate-600">
          Manage roles and access for your CaseGuide team.
        </p>
      </div>

      <div className="premium-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-slate-200/70 hover:bg-slate-50"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {user.email}
                </td>

                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      updateRole(
                        user.id,
                        e.target.value as User["role"]
                      )
                    }
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`status-pill ${
                      user.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <button
                    onClick={() =>
                      toggleActive(user.id, user.is_active)
                    }
                    className={
                      user.is_active
                        ? "danger-button"
                        : "premium-button"
                    }
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}