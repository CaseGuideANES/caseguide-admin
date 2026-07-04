"use client";

import { supabase } from "@/src/lib/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const signIn = async (
    e?: React.FormEvent | React.KeyboardEvent<HTMLInputElement>
  ) => {
    e?.preventDefault();

    if (loading || resetLoading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    router.push("/dashboard");
  };

  const sendPasswordReset = async () => {
    if (loading || resetLoading) return;

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Enter your email first, then click forgot password.");
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined,
    });

    setResetLoading(false);

    if (error) {
      setError("Could not send password reset email. Please try again.");
      return;
    }

    setSuccess("Password reset email sent. Check your inbox.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-5">
      <div className="premium-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 shadow-lg">
            <Image
              src="/cg-logo.png"
              alt="CaseGuide logo"
              width={42}
              height={42}
              className="rounded-2xl"
            />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-950">
            CaseGuide Admin
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your organization.
          </p>
        </div>

        <form onSubmit={signIn} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setSuccess("");
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">
                Password
              </label>

              <button
                type="button"
                onClick={sendPasswordReset}
                disabled={loading || resetLoading}
                className="text-xs font-bold text-blue-600 transition hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
                setSuccess("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  signIn(e);
                }
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || resetLoading}
            className="premium-button w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

<p className="mt-6 text-center text-xs font-medium text-slate-400">
          Admin access only
        </p>
        <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400">
          <a href="/support" className="hover:underline">Support</a>
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <a
          href="/about"
          className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
        >
          About CaseGuide
        </a>
      </div>
    </main>
  );
}