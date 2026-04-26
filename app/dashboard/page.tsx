'use client';

import { supabase } from "@/src/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("Loading...");
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadGroup = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setGroupName("No group");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("group_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.group_id) {
        setGroupName("No group");
        return;
      }

      setGroupId(profile.group_id);

      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("name")
        .eq("id", profile.group_id)
        .single();

      if (groupError) {
        setGroupName("Unnamed group");
        return;
      }

      setGroupName(group?.name || "Unnamed group");
      setNewName(group?.name || "");
    };

    loadGroup();
  }, []);

  useEffect(() => {
    if (!groupId) return;

    const channelName = `dashboard_group_${groupId}_${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "groups",
        filter: `id=eq.${groupId}`,
      },
      (payload) => {
        const updatedGroup = payload.new as { name?: string };
        const updatedName = updatedGroup.name || "Unnamed group";

        setGroupName(updatedName);

        if (!editing) {
          setNewName(updatedName);
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, editing]);

  const saveName = async () => {
    const trimmed = newName.trim();

    if (!groupId || !trimmed) return;

    setSaving(true);

    const { error } = await supabase
      .from("groups")
      .update({ name: trimmed })
      .eq("id", groupId);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setGroupName(trimmed);
    setNewName(trimmed);
    setEditing(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
          CaseGuide Admin
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h1>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            {editing ? (
              <>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setEditing(false);
                      setNewName(groupName);
                    }
                  }}
                  className="w-44 rounded-xl border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  autoFocus
                />

                <button
                  onClick={saveName}
                  disabled={saving}
                  className="text-sm font-bold text-blue-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => {
                    setEditing(false);
                    setNewName(groupName);
                  }}
                  disabled={saving}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-slate-700">
                  {groupName}
                </span>

                <button
                  onClick={() => {
                    setNewName(groupName);
                    setEditing(true);
                  }}
                  className="text-slate-400 hover:text-blue-600"
                  title="Edit group name"
                >
                  ✎
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-2 max-w-2xl text-slate-600">
          Manage hospital-specific case guides, invite teammates, and control
          user roles from one secure admin console.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Link
          href="/dashboard/guides"
          className="premium-card block p-6 transition hover:-translate-y-1 hover:shadow-xl"
        >
          <p className="text-sm font-semibold text-slate-500">Guides</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">Manage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create, edit, and review anesthesia workflow guides.
          </p>
        </Link>

        <Link
          href="/dashboard/users"
          className="premium-card block p-6 transition hover:-translate-y-1 hover:shadow-xl"
        >
          <p className="text-sm font-semibold text-slate-500">Users</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">Roles</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Control access levels for admins, editors, and viewers.
          </p>
        </Link>

        <Link
          href="/dashboard/invites"
          className="premium-card block p-6 transition hover:-translate-y-1 hover:shadow-xl"
        >
          <p className="text-sm font-semibold text-slate-500">Invites</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">Codes</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generate invite codes for trusted members of your team.
          </p>
        </Link>
      </div>

      <div className="premium-card p-6">
        <h2 className="text-xl font-bold text-slate-950">
          Admin workspace is live
        </h2>
        <p className="mt-2 text-slate-600">
          Your mobile app and web interface are connected, so changes made here
          can support your production workflow!
        </p>
      </div>
    </div>
  );
}