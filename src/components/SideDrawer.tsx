"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check, House, LogOut, Plus, UserRound, UsersRound, X } from "lucide-react";
import { logout } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: "/dashboard", icon: House, label: "Home" },
  { href: "/add", icon: Plus, label: "New entry" },
  { href: "/family", icon: UsersRound, label: "Family space" },
];

export default function SideDrawer({ open, onClose }: SideDrawerProps) {
  const user = useAppStore((s) => s.user);
  const workspace = useAppStore((s) => s.workspace);
  const families = useAppStore((s) => s.families);
  const setWorkspace = useAppStore((s) => s.setWorkspace);

  // Lock background scroll and allow Esc to close while open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-30 bg-stone-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer panel — floats in from the left */}
      <aside
        role="dialog"
        aria-label="Menu"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[82%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-stone-100 px-4">
          <span className="text-lg font-bold text-teal-700">হিসাবকিতাব</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 active:bg-stone-100"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        {/* Workspace switcher */}
        <div className="px-3 pt-4">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Workspace
          </p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                setWorkspace({ mode: "solo" });
                onClose();
              }}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
                workspace.mode === "solo"
                  ? "bg-teal-50 text-teal-700"
                  : "text-stone-700 active:bg-stone-100"
              }`}
            >
              <UserRound className="h-[18px] w-[18px]" strokeWidth={2} /> Personal
              {workspace.mode === "solo" && (
                <Check className="ml-auto h-4 w-4 text-teal-600" strokeWidth={2.5} />
              )}
            </button>
            {families.map((family) => {
              const active = workspace.mode === "family" && workspace.familyId === family._id;
              return (
                <button
                  key={family._id}
                  onClick={() => {
                    setWorkspace({
                      mode: "family",
                      familyId: family._id,
                      familyName: family.name,
                    });
                    onClose();
                  }}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
                    active ? "bg-teal-50 text-teal-700" : "text-stone-700 active:bg-stone-100"
                  }`}
                >
                  <UsersRound className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                  <span className="truncate">{family.name}</span>
                  {active && (
                    <Check className="ml-auto h-4 w-4 shrink-0 text-teal-600" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <nav className="mt-3 flex flex-col gap-1 border-t border-stone-100 px-3 pt-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-stone-700 active:bg-stone-100"
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile + sign out pinned to the bottom (thumb zone) */}
        <div className="mt-auto border-t border-stone-100 p-4">
          <div className="flex items-center gap-3 px-1 pb-3">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.name ?? "Profile"}
                referrerPolicy="no-referrer"
                className="h-11 w-11 shrink-0 rounded-full ring-2 ring-stone-200"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-lg font-semibold text-white">
                {(user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name ?? "Anonymous"}</p>
              <p className="truncate text-xs text-stone-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => void logout()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-semibold text-red-600 active:bg-red-100"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.25} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
