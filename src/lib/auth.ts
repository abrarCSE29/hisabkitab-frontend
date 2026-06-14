import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import type { Session } from "@supabase/supabase-js";

const DEV_TOKEN_KEY = "hisabkitab-dev-token";

function sessionToUser(session: Session) {
  // Google profiles arrive in user_metadata (full_name / avatar_url / picture).
  const metadata = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    role: session.user.role ?? null,
    name: (metadata.full_name as string | undefined) ?? (metadata.name as string | undefined) ?? null,
    avatar_url:
      (metadata.avatar_url as string | undefined) ?? (metadata.picture as string | undefined) ?? null,
  };
}

/** Record the signed-in user in the backend `users` collection. The session
 *  is already set, so api.me() carries the token; failures are non-fatal. */
function syncUserToBackend(): void {
  // The /me response carries the persisted walkthrough flag; fold it into the
  // store so the menu walkthrough is driven by the user record, not the browser.
  void api
    .me()
    .then((profile) => {
      const store = useAppStore.getState();
      store.setWalkthroughSeen(profile.walkthrough_seen ?? false);
      store.setFamilyCoachmarkSeen(profile.family_coachmark_seen ?? false);
    })
    .catch(() => {});
}

/** Resolve the current session once on app start (Supabase or dev token). */
export async function initAuth(): Promise<void> {
  const store = useAppStore.getState();
  if (store.authReady) return;

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      store.setSession(data.session.access_token, sessionToUser(data.session));
      syncUserToBackend();
    } else {
      store.markAuthReady();
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        useAppStore.getState().setSession(session.access_token, sessionToUser(session));
        syncUserToBackend();
      } else {
        useAppStore.getState().clearSession();
        useAppStore.getState().markAuthReady();
      }
    });
    return;
  }

  // Dev mode: validate a pasted JWT against the backend.
  const token = localStorage.getItem(DEV_TOKEN_KEY);
  if (token) {
    try {
      const user = await api.me(token);
      store.setSession(token, user);
      return;
    } catch {
      localStorage.removeItem(DEV_TOKEN_KEY);
    }
  }
  store.markAuthReady();
}

export async function loginWithDevToken(token: string): Promise<void> {
  const user = await api.me(token.trim());
  localStorage.setItem(DEV_TOKEN_KEY, token.trim());
  useAppStore.getState().setSession(token.trim(), user);
}

export async function logout(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(DEV_TOKEN_KEY);
  useAppStore.getState().clearSession();
  useAppStore.getState().markAuthReady();
}
