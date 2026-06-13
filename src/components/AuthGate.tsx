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
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  useEffect(() => {
    void initAuth();
  }, []);

  useEffect(() => {
    if (authReady && !accessToken) router.replace("/login");
  }, [authReady, accessToken, router]);

  // Wait for the persisted workspace to be read back before rendering pages —
  // otherwise the default (solo) shows briefly and an entry could be filed
  // against the wrong workspace if the user acts during that window.
  if (!hasHydrated || !authReady || !accessToken) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-2xl font-semibold text-teal-700">হিসাবকিতাব</p>
      </div>
    );
  }
  return <>{children}</>;
}
