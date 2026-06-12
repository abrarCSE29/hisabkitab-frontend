"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logout } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: "/dashboard", icon: "🏠", label: "Home" },
  { href: "/add", icon: "➕", label: "New entry" },
  { href: "/family", icon: "👪", label: "Family space" },
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
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer panel — floats in from the left */}
      <aside
        role="dialog"
        aria-label="Menu"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[82%] flex-col rounded-r-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <span className="text-lg font-bold text-teal-700">হিসাবকিতাব</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 ring-1 ring-stone-200 active:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {/* Workspace switcher */}
        <div className="px-3 pt-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
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
              <span className="text-lg">🙂</span> Personal
              {workspace.mode === "solo" && <span className="ml-auto text-teal-600">✓</span>}
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
                  <span className="text-lg">👪</span>
                  <span className="truncate">{family.name}</span>
                  {active && <span className="ml-auto text-teal-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <nav className="flex flex-col gap-1 border-t border-stone-100 px-3 pt-2 mt-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-stone-700 active:bg-stone-100"
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
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
                className="h-11 w-11 shrink-0 rounded-full ring-2 ring-teal-100"
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
            className="h-11 w-full rounded-xl bg-red-50 text-sm font-semibold text-red-600 active:bg-red-100"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
