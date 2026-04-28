"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-5">
      <p className="text-sm font-medium text-slate-500">
        Redirecting to sign in...
      </p>
    </main>
  );
}