"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/* Landing spot for the email confirmation link. We finalize the email
   verification, then deliberately sign the user out and send them to the
   sign-in page so they log in with their email and password. */

function ConfirmEmail() {
  const router = useRouter();

  useEffect(() => {
    if (!supabase) {
      router.replace("/login");
      return;
    }
    const client = supabase;

    void (async () => {
      const params = new URLSearchParams(window.location.search);

      const errorDesc = params.get("error_description") ?? params.get("error");
      if (errorDesc) {
        router.replace(`/login?error=${encodeURIComponent(errorDesc.replace(/\+/g, " "))}`);
        return;
      }

      // Token-hash email template: ?token_hash=…&type=signup|email
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      if (tokenHash && type) {
        const { error } = await client.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      }

      // The link may have auto-created a session (implicit flow). Discard it so
      // the user signs in manually, as requested.
      await client.auth.signOut();
      router.replace("/login?confirmed=1");
    })();
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gradient-to-br from-teal-600 via-emerald-500 to-teal-700 px-6 text-center">
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
      <p className="text-sm font-medium text-white/90">Confirming your email…</p>
    </main>
  );
}

export default ConfirmEmail;
