"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChartColumn, Download, Home, LogOut, Tags, UsersRound, X } from "lucide-react";
import { logout } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: "/dashboard", icon: Home, label: "Home", desc: "Your dashboard — monthly totals and your latest entries." },
  { href: "/statistics", icon: ChartColumn, label: "Financial statistics", desc: "Charts of where your money goes: trends, categories and more." },
  { href: "/categories", icon: Tags, label: "Manage categories", desc: "Create your own categories with a custom icon and colour." },
  { href: "/export", icon: Download, label: "Export data", desc: "Download your entries for any date range as CSV or a PDF report." },
  { href: "/family", icon: UsersRound, label: "Family space", desc: "Create or join a family to track a shared budget together." },
];

const TOUR_KEY = "hisabkitab-menu-walkthrough";

export default function SideDrawer({ open, onClose }: SideDrawerProps) {
  const user = useAppStore((s) => s.user);
  // null = no walkthrough running; otherwise the current step index.
  const [tourStep, setTourStep] = useState<number | null>(null);
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
  useEffect(() => {
    // One-shot: reset on close, start the tour the first time it's opened.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) {
      setTourStep(null);
      return;
    }
    if (localStorage.getItem(TOUR_KEY) !== "1") {
      setTourStep(0);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  const endTour = () => {
    localStorage.setItem(TOUR_KEY, "1");
    setTourStep(null);
  };

  const nextStep = () => {
    setTourStep((s) => {
      if (s === null) return null;
      if (s >= navLinks.length - 1) {
        localStorage.setItem(TOUR_KEY, "1");
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

        <nav className="mt-3 flex flex-col gap-1 px-3 pt-3">
          {navLinks.map((link, i) => {
            const Icon = link.icon;
            const isActiveStep = touring && i === tourStep;
            return (
              <Link
                key={link.href}
                href={link.href}
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
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {link.label}
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

        {/* Walkthrough callout — explains each item, one step at a time */}
        {current && (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-white p-4 shadow-2xl shadow-stone-900/30 ring-1 ring-stone-200">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                <current.icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-900">{current.label}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-stone-500">{current.desc}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {navLinks.map((l, i) => (
                  <span
                    key={l.href}
                    className={`h-1.5 rounded-full transition-all ${
                      i === tourStep ? "w-4 bg-teal-600" : "w-1.5 bg-stone-300"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={endTour}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-400 active:bg-stone-100"
                >
                  Skip
                </button>
                <button
                  onClick={nextStep}
                  className="rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 px-4 py-1.5 text-xs font-bold text-white active:from-teal-700"
                >
                  {tourStep === navLinks.length - 1 ? "Done" : "Next"}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
