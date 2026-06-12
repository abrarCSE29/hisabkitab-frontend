"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithDevToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";

export default function LoginPage() {
  const router = useRouter();
  const accessToken = useAppStore((s) => s.accessToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [devToken, setDevToken] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (accessToken) router.replace("/dashboard");
  }, [accessToken, router]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const signInWithGoogle = () =>
    run(async () => {
      const { error } = await supabase!.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    });

  const submitEmailPassword = () =>
    run(async () => {
      if (mode === "signin") {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase!.auth.signUp({ email, password });
        if (error) throw error;
        setNotice("Check your inbox to confirm your email, then sign in.");
      }
    });

  const submitDevToken = () => run(() => loginWithDevToken(devToken));

  return (
    <main className="flex min-h-dvh flex-col justify-center gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-teal-700">হিসাবকিতাব</h1>
        <p className="mt-2 text-sm text-stone-500">
          HisabKitab — track your family&apos;s daily expenses
        </p>
      </header>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-700">{notice}</p>
      )}

      {supabase ? (
        <div className="flex flex-col gap-6">
          <button
            onClick={signInWithGoogle}
            disabled={busy}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white font-medium shadow-sm active:bg-stone-100 disabled:opacity-50"
          >
            <span className="text-lg">G</span> Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span className="h-px flex-1 bg-stone-200" /> or {" "}
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submitEmailPassword();
            }}
          >
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border border-stone-300 bg-white px-4"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border border-stone-300 bg-white px-4"
            />
            <button
              type="submit"
              disabled={busy}
              className="h-12 rounded-xl bg-teal-600 font-semibold text-white active:bg-teal-700 disabled:opacity-50"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-sm text-teal-700"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submitDevToken();
          }}
        >
          <p className="text-sm text-stone-500">
            Supabase isn&apos;t configured (<code>NEXT_PUBLIC_SUPABASE_URL</code>), so paste a
            backend-accepted JWT to test locally:
          </p>
          <textarea
            required
            rows={4}
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            value={devToken}
            onChange={(e) => setDevToken(e.target.value)}
            className="rounded-xl border border-stone-300 bg-white p-3 font-mono text-xs"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-12 rounded-xl bg-teal-600 font-semibold text-white active:bg-teal-700 disabled:opacity-50"
          >
            Use dev token
          </button>
        </form>
      )}
    </main>
  );
}
