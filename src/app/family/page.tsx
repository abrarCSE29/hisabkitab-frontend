"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import AppBar, { BackButton } from "@/components/AppBar";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";
import type { Family, FamilyMember } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100";
const primaryButton =
  "flex h-12 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white active:bg-teal-700 disabled:opacity-50";

function memberName(member: FamilyMember, currentUserId: string | undefined): string {
  if (member.user_id === currentUserId) return "You";
  return member.name ?? member.email ?? `Member ${member.user_id.slice(0, 6)}`;
}

function MessageBanner({ message }: { message: { kind: "ok" | "error"; text: string } | null }) {
  if (!message) return null;
  return (
    <p
      className={`mb-4 rounded-xl px-4 py-3 text-sm ${
        message.kind === "ok" ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-700"
      }`}
    >
      {message.text}
    </p>
  );
}

function MemberRow({
  member,
  currentUserId,
}: {
  member: FamilyMember;
  currentUserId: string | undefined;
}) {
  const name = memberName(member, currentUserId);
  const isAdmin = member.role === "admin";
  return (
    <li className="flex items-center gap-3 py-2.5">
      {member.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatar_url}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-10 w-10 shrink-0 rounded-full ring-2 ring-teal-100"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-base font-semibold text-teal-700">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-900">{name}</p>
        <p className="truncate text-xs text-stone-400">
          {member.email ?? `ID ${member.user_id.slice(0, 8)}…`}
        </p>
      </div>
      <span
        className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          isAdmin ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
        }`}
      >
        {isAdmin ? (
          <ShieldCheck className="h-3 w-3" strokeWidth={2.25} />
        ) : (
          <UserRound className="h-3 w-3" strokeWidth={2.25} />
        )}
        {isAdmin ? "Admin" : "Member"}
      </span>
    </li>
  );
}

function FamilyScreen() {
  const user = useAppStore((s) => s.user);
  const families = useAppStore((s) => s.families);
  const setFamilies = useAppStore((s) => s.setFamilies);
  const workspace = useAppStore((s) => s.workspace);
  const setWorkspace = useAppStore((s) => s.setWorkspace);

  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2000);
  };

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

  async function run(action: () => Promise<string>): Promise<boolean> {
    setBusy(true);
    setMessage(null);
    try {
      const text = await action();
      setMessage({ kind: "ok", text });
      await refresh();
      return true;
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed" });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const createFamily = async () => {
    const ok = await run(async () => {
      const created = await api.createFamily(newName.trim());
      setNewName("");
      setWorkspace({ mode: "family", familyId: created.family_id, familyName: created.name });
      return `Family “${created.name}” created — it's now your active workspace.`;
    });
    if (ok) setCreateOpen(false);
  };

  const join = async () => {
    const ok = await run(async () => {
      const joined = await api.joinFamily(joinCode.trim());
      setJoinCode("");
      setWorkspace({ mode: "family", familyId: joined.family_id, familyName: joined.name });
      return `Welcome to “${joined.name}”!`;
    });
    if (ok) setJoinOpen(false);
  };

  const openDetail = (id: string) => {
    setMessage(null);
    setShareCode(null);
    setCopied(false);
    setDetailId(id);
    // Pre-fetch the shareable code if the viewer administers this family.
    const fam = families.find((f) => f._id === id);
    const role = fam?.members.find((m) => m.user_id === user?.id)?.role;
    if (role === "admin") {
      api
        .familyShareCode(id)
        .then((r) => setShareCode(r.code))
        .catch(() => {});
    }
  };

  const copyCode = async () => {
    if (!shareCode) return;
    if (await copyToClipboard(shareCode)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Code copied");
    } else {
      showToast("Couldn't copy — long-press the code");
    }
  };

  const shareCodeOut = async () => {
    if (!shareCode || !detailFamily) return;
    const text = `Join our family "${detailFamily.name}" on HisabKitab with code: ${shareCode}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "HisabKitab family invite", text });
      } catch {
        // user dismissed the share sheet
      }
    } else {
      void copyCode();
    }
  };

  const regenerateCode = async () => {
    if (!detailId) return;
    try {
      const r = await api.rotateFamilyShareCode(detailId);
      setShareCode(r.code);
      setCopied(false);
    } catch {
      setMessage({ kind: "error", text: "Could not regenerate the code" });
    }
  };

  const detailFamily: Family | undefined = families.find((f) => f._id === detailId);
  const myRole = detailFamily?.members.find((m) => m.user_id === user?.id)?.role;
  const isActive =
    detailFamily && workspace.mode === "family" && workspace.familyId === detailFamily._id;

  return (
    <div className="min-h-dvh pb-24">
      <AppBar
        title="Family space"
        subtitle="Shared khata with your household"
        leading={<BackButton />}
      />

      <div className="flex flex-col gap-6 px-4 pt-5">
        {message && !detailId && !createOpen && !joinOpen && <MessageBanner message={message} />}

        {/* Family list */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <UsersRound className="h-4 w-4" strokeWidth={2} />
            </span>
            <h2 className="text-base font-bold text-stone-900">My families</h2>
            {families.length > 0 && (
              <span className="ml-auto rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-500">
                {families.length}
              </span>
            )}
          </div>

          {families.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-6 text-center text-sm text-stone-400">
              You&apos;re tracking solo. Create a family or join one with a code below.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {families.map((family) => {
                const active =
                  workspace.mode === "family" && workspace.familyId === family._id;
                return (
                  <li key={family._id}>
                    <button
                      onClick={() => openDetail(family._id)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 text-left active:bg-stone-50"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                        <UsersRound className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold text-stone-900">
                          <span className="truncate">{family.name}</span>
                          {active && (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Active
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {family.members.length} member{family.members.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-stone-300" strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Symmetric action cards */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setMessage(null);
              setNewName("");
              setCreateOpen(true);
            }}
            className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-5 text-center active:bg-stone-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <Plus className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="text-sm font-semibold text-stone-900">Create family</span>
            <span className="text-xs text-stone-400">Start a new khata</span>
          </button>
          <button
            onClick={() => {
              setMessage(null);
              setJoinCode("");
              setJoinOpen(true);
            }}
            className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-5 text-center active:bg-stone-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <KeyRound className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="text-sm font-semibold text-stone-900">Join family</span>
            <span className="text-xs text-stone-400">Use an invite code</span>
          </button>
        </section>
      </div>

      {/* Family detail modal */}
      <Modal
        open={detailFamily != null}
        onClose={() => setDetailId(null)}
        title={detailFamily?.name ?? ""}
        subtitle={
          detailFamily
            ? `${detailFamily.members.length} member${
                detailFamily.members.length > 1 ? "s" : ""
              }${myRole ? ` · you are ${myRole}` : ""}`
            : undefined
        }
      >
        {detailFamily && (
          <div className="flex flex-col gap-4">
            <MessageBanner message={message} />

            <ul className="flex flex-col divide-y divide-stone-100">
              {detailFamily.members.map((member) => (
                <MemberRow key={member.user_id} member={member} currentUserId={user?.id} />
              ))}
            </ul>

            {myRole === "admin" && shareCode && (
              <div className="flex flex-col gap-3 rounded-2xl bg-stone-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                    Share code
                  </span>
                  <button
                    onClick={() => void regenerateCode()}
                    className="flex items-center gap-1 text-xs font-semibold text-teal-700 active:text-teal-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} /> New code
                  </button>
                </div>
                <button
                  onClick={() => void copyCode()}
                  aria-label="Copy share code"
                  className="w-full rounded-xl bg-white py-2.5 text-center font-mono text-2xl font-bold tracking-[0.35em] text-stone-900 ring-1 ring-stone-200 active:bg-stone-100"
                >
                  {shareCode}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => void copyCode()}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-semibold text-stone-700 ring-1 ring-stone-200 active:bg-stone-100"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-teal-600" strokeWidth={2.5} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" strokeWidth={2} /> Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => void shareCodeOut()}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 text-sm font-semibold text-white active:bg-teal-700"
                  >
                    <Share2 className="h-4 w-4" strokeWidth={2} /> Share
                  </button>
                </div>
                <p className="text-center text-[11px] text-stone-400">
                  Anyone with this code can join. Tap “New code” to revoke it.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setWorkspace({
                  mode: "family",
                  familyId: detailFamily._id,
                  familyName: detailFamily.name,
                });
                setDetailId(null);
              }}
              disabled={isActive}
              className="h-12 rounded-xl bg-stone-100 text-sm font-semibold text-stone-700 active:bg-stone-200 disabled:opacity-50"
            >
              {isActive ? "Already your active workspace" : "Switch to this workspace"}
            </button>
          </div>
        )}
      </Modal>

      {/* Create family modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a family"
        subtitle="You'll be the admin"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void createFamily();
          }}
        >
          <MessageBanner message={message} />
          <input
            required
            autoFocus
            placeholder="e.g. Amader Songshar"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={inputClass}
          />
          <button type="submit" disabled={busy} className={primaryButton}>
            <Plus className="h-4 w-4" strokeWidth={2.25} /> Create family
          </button>
        </form>
      </Modal>

      {/* Join family modal */}
      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Join a family"
        subtitle="Enter a shared code or one from your invite email"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void join();
          }}
        >
          <MessageBanner message={message} />
          <input
            required
            autoFocus
            placeholder="8-character code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className={`${inputClass} font-mono tracking-widest`}
          />
          <button type="submit" disabled={busy} className={primaryButton}>
            <KeyRound className="h-4 w-4" strokeWidth={2.25} /> Join family
          </button>
        </form>
      </Modal>

      {/* Toast — above the modal layer (z-40) */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 transition-all duration-200 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
          {toast}
        </div>
      </div>

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
