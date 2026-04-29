"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: "admin" | "editor" | "viewer";
  is_active: boolean;
};

function getSortName(user: User) {
  if (user.last_name?.trim()) {
    return user.last_name.trim().toLowerCase();
  }

  if (user.first_name?.trim()) {
    return user.first_name.trim().toLowerCase();
  }

  const namePart = user.email.split("@")[0];
  const parts = namePart.split(/[._-]/).filter(Boolean);

  return parts.length >= 2
    ? parts[parts.length - 1].toLowerCase()
    : namePart.toLowerCase();
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");

  const activeUsers = useMemo(() => {
    return users
      .filter((u) => u.is_active)
      .sort((a, b) => getSortName(a).localeCompare(getSortName(b)));
  }, [users]);

  const inactiveUsers = useMemo(() => {
    return users
      .filter((u) => !u.is_active)
      .sort((a, b) => getSortName(a).localeCompare(getSortName(b)));
  }, [users]);

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();

    if (!res.ok) {
      setError(data?.error || "Could not load users.");
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers(Array.isArray(data) ? data : data.users ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (id: string, role: User["role"]) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });

    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !is_active }),
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: !is_active } : u))
    );
  };

  const updateName = async (user: User) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        first_name: firstNameInput,
        last_name: lastNameInput,
      }),
    });

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? { ...u, first_name: firstNameInput, last_name: lastNameInput }
          : u
      )
    );

    setEditingUserId(null);
  };

  const permanentlyDeleteUser = async (user: User) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.email}?`
    );
    if (!confirmed) return;

    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id }),
    });

    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  };

  const renderUserRow = (user: User, index: number, inactive = false) => {
    const isEditing = editingUserId === user.id;

    return (
      <tr key={user.id} className="border-t border-slate-200/70 hover:bg-slate-50">
        <td className="px-6 py-4 font-semibold text-slate-500">{index + 1}</td>

        <td className="px-10 py-6">
  {isEditing ? (
    <div className="flex gap-2">
      <input
        value={firstNameInput}
        onChange={(e) => setFirstNameInput(e.target.value)}
        placeholder="First"
        className="border px-2 py-1 rounded"
      />
      <input
        value={lastNameInput}
        onChange={(e) => setLastNameInput(e.target.value)}
        placeholder="Last"
        className="border px-2 py-1 rounded"
      />
      <button
        onClick={() => updateName(user)}
        className="premium-button"
      >
        Save
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-0.5">
      {user.last_name || user.first_name ? (
        <>
          <span className="font-semibold text-slate-900">
            {`${user.last_name || ''}${user.last_name ? ', ' : ''}${user.first_name || ''}`}
          </span>
          <span className="text-sm text-slate-500">
            {user.email}
          </span>
        </>
      ) : (
        <span className="font-medium text-slate-900">
          {user.email}
        </span>
      )}
    </div>
  )}
</td>

        <td className="px-6 py-4">
          <select
            value={user.role}
            onChange={(e) => updateRole(user.id, e.target.value as User["role"])}
            className="rounded-full border px-3 py-1 text-sm font-semibold"
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

        <td className="px-6 py-4 flex gap-2">
          <button
            onClick={() => toggleActive(user.id, user.is_active)}
            className={user.is_active ? "danger-button" : "premium-button"}
          >
            {user.is_active ? "Deactivate" : "Activate"}
          </button>

          {!isEditing && (
            <button
              onClick={() => {
                setEditingUserId(user.id);
                setFirstNameInput(user.first_name || "");
                setLastNameInput(user.last_name || "");
              }}
              className="premium-button"
            >
              Edit Name
            </button>
          )}

          {inactive && (
            <button
              onClick={() => permanentlyDeleteUser(user)}
              className="bg-red-700 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Users</h1>

      <div className="premium-card overflow-hidden">
        {loading ? (
          <p className="p-6">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100/80 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
  <tr className="border-b border-slate-200">
    <th className="w-20 px-10 py-5">#</th>
    <th className="px-10 py-5">Name / Email</th>
    <th className="px-10 py-5">Role</th>
    <th className="px-10 py-5">Status</th>
    <th className="px-10 py-5">Actions</th>
  </tr>
</thead>

            <tbody>
              {activeUsers.map((u, i) => renderUserRow(u, i))}

              {inactiveUsers.length > 0 && (
                <tr>
                  <td colSpan={5} className="text-xs text-slate-500 px-6 py-2">
                    Inactive Users
                  </td>
                </tr>
              )}

              {inactiveUsers.map((u, i) =>
                renderUserRow(u, activeUsers.length + i, true)
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}