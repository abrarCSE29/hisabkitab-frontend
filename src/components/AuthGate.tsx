"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initAuth } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";

/** Wraps private pages: resolves the session once, redirects to /login if none. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authReady = useAppStore((s) => s.authReady);
  const accessToken = useAppStore((s) => s.accessToken);

  useEffect(() => {
    void initAuth();
  }, []);

  useEffect(() => {
    if (authReady && !accessToken) router.replace("/login");
  }, [authReady, accessToken, router]);

  if (!authReady || !accessToken) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-2xl font-semibold text-teal-700">হিসাবকিতাব</p>
      </div>
    );
  }
  return <>{children}</>;
}
