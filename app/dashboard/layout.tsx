"use client";

import { supabase } from "@/src/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

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
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}