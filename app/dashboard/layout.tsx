"use client";

import { supabase } from "@/src/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Guides", href: "/dashboard/guides" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Invites", href: "/dashboard/invites" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSnoozed, setLogoSnoozed] = useState(false);
  const [showLogoMenu, setShowLogoMenu] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/sign-in");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, group_id")
        .eq("id", data.session.user.id)
        .single();

      if (profile) {
        if (profile.role !== "admin" && profile.role !== "super_admin") {
          router.replace("/sign-in");
          return;
        }

        setRole(profile.role);
        setGroupId(profile.group_id);

        if (profile.role === "super_admin" && profile.group_id) {
          const snoozeUntil = localStorage.getItem("cg-logo-snooze-until");
          if (snoozeUntil && Date.now() < parseInt(snoozeUntil)) {
            setLogoSnoozed(true);
          } else {
            const { data: group } = await supabase
              .from("groups")
              .select("logo_path")
              .eq("id", profile.group_id)
              .single();

            if (group?.logo_path) {
              const { data: urlData } = supabase.storage
                .from("group-logos")
                .getPublicUrl(group.logo_path);
              setLogoUrl(urlData.publicUrl);
            }
          }
        }
      }

      setAuthChecked(true);
    });
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const handleSnooze = () => {
    const oneMonth = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem("cg-logo-snooze-until", oneMonth.toString());
    setLogoSnoozed(true);
    setShowLogoMenu(false);
  };

  const handleDeleteLogo = async () => {
    if (!groupId) return;
    if (!confirm("Remove group logo permanently?")) return;

    const { data: group } = await supabase
      .from("groups")
      .select("logo_path")
      .eq("id", groupId)
      .single();

    if (group?.logo_path) {
      await supabase.storage.from("group-logos").remove([group.logo_path]);
    }

    await supabase.from("groups").update({ logo_path: null }).eq("id", groupId);
    setLogoUrl(null);
    setShowLogoMenu(false);
  };

  const handleUploadLogo = async (file: File) => {
    if (!groupId) return;
    setUploadingLogo(true);

    const ext = file.name.split(".").pop();
    const path = `${groupId}/logo.${ext}`;

    const { error } = await supabase.storage
      .from("group-logos")
      .upload(path, file, { upsert: true });

    if (!error) {
      await supabase.from("groups").update({ logo_path: path }).eq("id", groupId);
      const { data: urlData } = supabase.storage
        .from("group-logos")
        .getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
    }

    setUploadingLogo(false);
    setShowLogoMenu(false);
  };

  const showLogoWidget = role === "super_admin" && !logoSnoozed;

  const LogoWidget = () => (
    <div className="relative mb-8">
      <div className="relative">
        <div
          onClick={() => setShowLogoMenu((prev) => !prev)}
          className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-300 hover:bg-amber-50/40"
          style={{ height: 180 }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Group logo"
              className="absolute inset-0 h-full w-full rounded-2xl object-contain p-6"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10">
              <span className="text-3xl font-bold text-slate-300 transition group-hover:text-amber-400">
                {uploadingLogo ? "Uploading…" : "Your Logo Here"}
              </span>
              <span className="text-xs text-slate-400 group-hover:text-amber-400">
                Click to upload
              </span>
            </div>
          )}
        </div>

        {showLogoMenu && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {logoUrl ? "Change Logo" : "Upload Logo"}
            </button>
            {logoUrl && (
              <button
                onClick={handleDeleteLogo}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Remove Logo
              </button>
            )}
            <button
              onClick={handleSnooze}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-500 hover:bg-slate-50"
            >
              Snooze for 1 month
            </button>
            <button
              onClick={() => setShowLogoMenu(false)}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-400 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadLogo(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-slate-200/80 bg-white/80 px-5 py-6 shadow-sm backdrop-blur lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950">
              <Image
                src="/cg-logo.png"
                alt="CaseGuide logo"
                width={34}
                height={34}
                className="rounded-xl"
              />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-slate-950">
                CaseGuide
              </p>
              <p className="text-xs font-medium text-slate-500">
                Admin Console
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={signOut}
            className="mt-10 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Sign out
          </button>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950">
                  <Image
                    src="/cg-logo.png"
                    alt="CaseGuide logo"
                    width={30}
                    height={30}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950">CaseGuide</p>
                  <p className="text-xs text-slate-500">Admin Console</p>
                </div>
              </Link>

              <button
                onClick={signOut}
                className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Sign out
              </button>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <section className="mx-auto w-full max-w-6xl px-5 py-8 lg:px-10 lg:py-10">
            {showLogoWidget && <LogoWidget />}
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
