"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Plus, UserRound, UsersRound } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/* The workspace name in the top bar doubles as the switcher: tapping it opens
   a dropdown of the personal space and every family, plus a shortcut to create
   a new one (which jumps to the family management page). `highlighted` lifts it
   above the first-run coachmark backdrop with a pulsing ring. */

interface WorkspaceSwitcherProps {
  highlighted?: boolean;
}

export default function WorkspaceSwitcher({ highlighted = false }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const workspace = useAppStore((s) => s.workspace);
  const families = useAppStore((s) => s.families);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const label = workspace.mode === "family" ? workspace.familyName : "Personal";
  const subtitle = workspace.mode === "family" ? "Family workspace" : "Solo workspace";

  // Close on outside tap / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex flex-col items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch workspace"
        aria-expanded={open}
        className={`flex max-w-[58vw] items-center gap-1.5 rounded-full px-3 py-1 text-white transition ${
          highlighted ? "z-50 bg-white/15 ring-2 ring-white animate-pulse-ring" : "active:bg-white/15"
        }`}
      >
        <span className="min-w-0">
          <span className="block truncate text-base font-bold leading-tight">{label}</span>
          <span className="block truncate text-[11px] leading-tight text-white/80">{subtitle}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 overflow-hidden rounded-2xl bg-white p-1.5 text-stone-800 shadow-2xl shadow-stone-900/30 ring-1 ring-stone-200">
          <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Workspace
          </p>

          <button
            onClick={() => {
              setWorkspace({ mode: "solo" });
              setOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
              workspace.mode === "solo" ? "bg-teal-50 text-teal-700" : "text-stone-700 active:bg-stone-100"
            }`}
          >
            <UserRound className="h-[18px] w-[18px] shrink-0" strokeWidth={2} /> Personal
            {workspace.mode === "solo" && (
              <Check className="ml-auto h-4 w-4 shrink-0 text-teal-600" strokeWidth={2.5} />
            )}
          </button>

          {families.map((family) => {
            const active = workspace.mode === "family" && workspace.familyId === family._id;
            return (
              <button
                key={family._id}
                onClick={() => {
                  setWorkspace({ mode: "family", familyId: family._id, familyName: family.name });
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active ? "bg-teal-50 text-teal-700" : "text-stone-700 active:bg-stone-100"
                }`}
              >
                <UsersRound className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                <span className="truncate">{family.name}</span>
                {active && <Check className="ml-auto h-4 w-4 shrink-0 text-teal-600" strokeWidth={2.5} />}
              </button>
            );
          })}

          <div className="my-1 border-t border-stone-100" />

          <button
            onClick={() => {
              setOpen(false);
              router.push("/family");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-teal-700 active:bg-teal-50"
          >
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-teal-100">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.75} />
            </span>
            Create new family
          </button>
        </div>
      )}
    </div>
  );
}
