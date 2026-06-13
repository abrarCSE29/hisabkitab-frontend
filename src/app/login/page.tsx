"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginWithDevToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";

const fieldClass =
  "h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100";

export default function LoginPage() {
  const router = useRouter();
  const accessToken = useAppStore((s) => s.accessToken);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        // Validate locally before hitting the backend.
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        // Capture the display name so it lands in user_metadata.full_name,
        // which the backend reads on sign-in to populate the user profile.
        const { error } = await supabase!.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
            // Return the confirmation link to the live app's callback route.
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setNotice("Check your inbox and tap the confirmation link to finish signing up.");
      }
    });

  const submitDevToken = () => run(() => loginWithDevToken(devToken));

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-gradient-to-br from-teal-600 via-emerald-500 to-teal-700 px-5 py-10">
      {/* Brand */}
      <header className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold text-white ring-1 ring-white/30 backdrop-blur">
          ৳
        </span>
        <h1 className="text-3xl font-bold text-white">হিসাবকিতাব</h1>
        <p className="mt-1 text-sm text-white/80">Track your family&apos;s daily expenses</p>
      </header>

      {/* Auth card */}
      <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-teal-900/20">
        {supabase ? (
          <div className="flex flex-col gap-5">
            {/* Sign in / Sign up segmented toggle */}
            <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-semibold">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setNotice(null);
                    setConfirmPassword("");
                    setShowPassword(false);
                  }}
                  className={`rounded-lg py-2 transition-colors ${
                    mode === m ? "bg-white text-teal-700 shadow-sm" : "text-stone-500"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
            {notice && (
              <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">{notice}</p>
            )}

            <button
              onClick={signInWithGoogle}
              disabled={busy}
              className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-700 shadow-sm active:bg-stone-50 disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
              </svg>
              Continue with Google
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
              {mode === "signup" && (
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                />
              )}
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${fieldClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-400 active:text-stone-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" strokeWidth={2} />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={2} />
                  )}
                </button>
              </div>
              {mode === "signup" && (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${fieldClass} pr-11 ${
                      confirmPassword && confirmPassword !== password
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-0 top-0 flex h-12 w-11 items-center justify-center text-stone-400 active:text-stone-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={2} />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={2} />
                    )}
                  </button>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="mt-1 px-1 text-xs text-red-600">Passwords do not match</p>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="mt-1 h-12 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-teal-600/25 active:from-teal-700 active:to-emerald-600 disabled:opacity-50"
              >
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submitDevToken();
            }}
          >
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
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
              className="rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-xs outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
            <button
              type="submit"
              disabled={busy}
              className="h-12 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 font-semibold text-white active:from-teal-700 active:to-emerald-600 disabled:opacity-50"
            >
              Use dev token
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-white/70">Made for families in Dhaka 🇧🇩</p>
    </main>
  );
}
