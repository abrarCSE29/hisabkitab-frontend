"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChartColumn, Download, Home, LogOut, Tags, UsersRound, X } from "lucide-react";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: "/dashboard", icon: Home, label: "Home", desc: "Totals and your latest entries." },
  { href: "/statistics", icon: ChartColumn, label: "Financial statistics", desc: "Charts of where your money goes." },
  { href: "/categories", icon: Tags, label: "Manage categories", desc: "Add your own icons & colours." },
  { href: "/export", icon: Download, label: "Export data", desc: "Download a CSV or PDF report." },
  { href: "/family", icon: UsersRound, label: "Family space", desc: "Track a shared budget together." },
];

export default function SideDrawer({ open, onClose }: SideDrawerProps) {
  const user = useAppStore((s) => s.user);
  const setWalkthroughSeen = useAppStore((s) => s.setWalkthroughSeen);
  // null = no walkthrough running; otherwise the current step index.
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [anchorTop, setAnchorTop] = useState(0);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const touring = tourStep !== null;

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

  // First time the menu is opened, run a short guided walkthrough of its items.
  // Gated on the per-user flag from the backend (not localStorage), so it shows
  // once per account regardless of device/browser. `=== false` waits until /me
  // has resolved the flag before deciding.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) {
      setTourStep(null);
      return;
    }
    if (user?.walkthrough_seen === false) {
      setTourStep(0);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, user?.walkthrough_seen]);

  // Align the side callout to the highlighted item's vertical position.
  useEffect(() => {
    if (tourStep === null) return;
    const el = itemRefs.current[tourStep];
    if (el) setAnchorTop(el.getBoundingClientRect().top);
  }, [tourStep, open]);

  // Persist "seen" to the user record (and reflect it locally) so it never
  // shows again, on any device.
  const finishTour = () => {
    setWalkthroughSeen(true);
    void api.markWalkthroughSeen().catch(() => {});
  };

  const endTour = () => {
    setTourStep(null);
    finishTour();
  };

  const nextStep = () => {
    setTourStep((s) => {
      if (s === null) return null;
      if (s >= navLinks.length - 1) {
        finishTour();
        return null;
      }
      return s + 1;
    });
  };

  const current = touring ? navLinks[tourStep] : null;

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

      {/* Drawer panel — floats in from the left. Narrows during the tour so the
          side callout has room to sit beside the highlighted item. */}
      <aside
        role="dialog"
        aria-label="Menu"
        className={`fixed inset-y-0 left-0 z-40 flex max-w-[68%] flex-col bg-white shadow-2xl transition-[transform,width] duration-300 ease-out ${
          touring ? "w-60" : "w-72"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
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

        <nav className="mt-3 flex flex-col gap-1 px-3 pt-3">
          {navLinks.map((link, i) => {
            const Icon = link.icon;
            const isActiveStep = touring && i === tourStep;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={onClose}
                aria-hidden={touring}
                tabIndex={touring ? -1 : undefined}
                className={`flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all ${
                  touring ? "pointer-events-none" : "active:bg-stone-100"
                } ${
                  isActiveStep
                    ? "bg-teal-50 text-teal-800 ring-2 ring-teal-500"
                    : touring
                      ? "text-stone-700 opacity-30"
                      : "text-stone-700"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile + sign out pinned to the bottom (thumb zone) */}
        <div className={`mt-auto border-t border-stone-100 p-4 ${touring ? "opacity-30" : ""}`}>
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
            disabled={touring}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-semibold text-red-600 active:bg-red-100"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.25} /> Sign out
          </button>
        </div>
      </aside>

      {/* Walkthrough callout — sits to the RIGHT of the highlighted item and
          points back at it, so the two read as a pair. */}
      {current && (
        <div
          className="fixed left-60 right-2 z-50 transition-[top] duration-200"
          style={{ top: anchorTop }}
        >
          <div className="relative rounded-2xl bg-white p-3 shadow-2xl shadow-stone-900/40 ring-1 ring-stone-200">
            {/* arrow pointing left at the item */}
            <div className="absolute -left-1.5 top-4 h-3 w-3 rotate-45 rounded-sm bg-white ring-1 ring-stone-200" />
            <div className="relative">
              <p className="text-[13px] font-bold text-stone-900">{current.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{current.desc}</p>

              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {navLinks.map((l, i) => (
                    <span
                      key={l.href}
                      className={`h-1 rounded-full transition-all ${
                        i === tourStep ? "w-3 bg-teal-600" : "w-1 bg-stone-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={endTour}
                    className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-stone-400 active:bg-stone-100"
                  >
                    Skip
                  </button>
                  <button
                    onClick={nextStep}
                    className="rounded-md bg-gradient-to-r from-teal-600 to-emerald-500 px-3 py-1 text-[11px] font-bold text-white active:from-teal-700"
                  >
                    {tourStep === navLinks.length - 1 ? "Done" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
