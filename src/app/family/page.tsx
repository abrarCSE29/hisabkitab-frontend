"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

function FamilyScreen() {
  const user = useAppStore((s) => s.user);
  const families = useAppStore((s) => s.families);
  const setFamilies = useAppStore((s) => s.setFamilies);
  const setWorkspace = useAppStore((s) => s.setWorkspace);

  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      setFamilies(await api.families());
    } catch {
      // surfaced via individual actions
    }
  }, [setFamilies]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setMessage(null);
    try {
      const text = await action();
      setMessage({ kind: "ok", text });
      await refresh();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  const createFamily = () =>
    run(async () => {
      const created = await api.createFamily(newName.trim());
      setNewName("");
      setWorkspace({ mode: "family", familyId: created.family_id, familyName: created.name });
      return `Family “${created.name}” created — it's now your active workspace.`;
    });

  const invite = (familyId: string) =>
    run(async () => {
      const email = (inviteEmail[familyId] ?? "").trim();
      await api.inviteMember(email, familyId);
      setInviteEmail((m) => ({ ...m, [familyId]: "" }));
      return `Invite sent to ${email}. They can join with the emailed code.`;
    });

  const join = () =>
    run(async () => {
      const joined = await api.joinFamily(joinCode.trim());
      setJoinCode("");
      setWorkspace({ mode: "family", familyId: joined.family_id, familyName: joined.name });
      return `Welcome to “${joined.name}”!`;
    });

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold">Family space</h1>

      {message && (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            message.kind === "ok" ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* My families */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-600">My families</h2>
        {families.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-stone-400 border border-stone-200/80 shadow-sm shadow-stone-300/40">
            You&apos;re tracking solo. Create a family below or join one with a code.
          </p>
        )}
        {families.map((family) => {
          const myRole = family.members.find((m) => m.user_id === user?.id)?.role;
          return (
            <div key={family._id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-stone-200/80 shadow-sm shadow-stone-300/40">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">👪 {family.name}</p>
                  <p className="text-xs text-stone-500">
                    {family.members.length} member{family.members.length > 1 && "s"} · you are{" "}
                    {myRole}
                  </p>
                  <p className="mt-1 truncate text-xs text-stone-400">
                    {family.members
                      .map((m) =>
                        m.user_id === user?.id
                          ? "You"
                          : (m.name ?? m.email ?? `user ${m.user_id.slice(0, 6)}…`),
                      )
                      .join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setWorkspace({ mode: "family", familyId: family._id, familyName: family.name })
                  }
                  className="rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 active:bg-teal-100"
                >
                  Open
                </button>
              </div>
              {myRole === "admin" && (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void invite(family._id);
                  }}
                >
                  <input
                    type="email"
                    required
                    placeholder="Invite by email"
                    value={inviteEmail[family._id] ?? ""}
                    onChange={(e) =>
                      setInviteEmail((m) => ({ ...m, [family._id]: e.target.value }))
                    }
                    className="h-11 min-w-0 flex-1 rounded-xl border border-stone-300 px-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Invite
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </section>

      {/* Create */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-stone-600">Create a family</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void createFamily();
          }}
        >
          <input
            required
            placeholder="e.g. Amader Songshar"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-12 min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-teal-600 px-4 font-semibold text-white disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </section>

      {/* Join */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-stone-600">Join with a code</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void join();
          }}
        >
          <input
            required
            placeholder="8-character code from your invite email"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="h-12 min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 font-mono"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-teal-600 px-4 font-semibold text-white disabled:opacity-50"
          >
            Join
          </button>
        </form>
      </section>

      <BottomNav />
    </div>
  );
}

export default function FamilyPage() {
  return (
    <AuthGate>
      <FamilyScreen />
    </AuthGate>
  );
}
