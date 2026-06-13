"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/* Landing spot for email-confirmation and OAuth redirects. Supabase sends the
   user here after they click the confirmation link; we finalize the session
   (whichever flow it arrives in) and forward them into the app. */

function Callback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      router.replace("/login");
      return;
    }
    const client = supabase;
    let done = false;
    const goDashboard = () => {
      if (done) return;
      done = true;
      router.replace("/dashboard");
    };

    // Implicit-hash (#access_token=…) and PKCE (?code=…) are auto-detected by
    // the client; this catches the resulting sign-in.
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (session) goDashboard();
    });

    void (async () => {
      const params = new URLSearchParams(window.location.search);

      const errorDesc = params.get("error_description") ?? params.get("error");
      if (errorDesc) {
        setError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
        return;
      }

      // Token-hash email template: ?token_hash=…&type=signup|email|recovery
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      if (tokenHash && type) {
        const { error } = await client.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (error) {
          setError(error.message);
          return;
        }
      }

      const { data } = await client.auth.getSession();
      if (data.session) {
        goDashboard();
        return;
      }

      // Auto-detection may still be in flight; give it a moment, then give up.
      setTimeout(async () => {
        const { data } = await client.auth.getSession();
        if (data.session) goDashboard();
        else if (!done) setError("This confirmation link is invalid or has expired.");
      }, 3000);
    })();

    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gradient-to-br from-teal-600 via-emerald-500 to-teal-700 px-6 text-center">
      {error ? (
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl shadow-teal-900/20">
          <p className="text-base font-bold text-stone-900">Couldn&apos;t confirm</p>
          <p className="mt-1 text-sm text-stone-500">{error}</p>
          <Link
            href="/login"
            className="mt-5 flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-sm font-bold text-white"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
          <p className="text-sm font-medium text-white/90">Confirming your account…</p>
        </>
      )}
    </main>
  );
}

export default Callback;
