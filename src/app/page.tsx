"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ScanText, Tags, UsersRound, Zap } from "lucide-react";
import { initAuth } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";

const features = [
  {
    icon: Zap,
    title: "Quick logging",
    body: "Tap +, type the amount, done. Add itemized rows when you need the detail.",
  },
  {
    icon: Tags,
    title: "Bangla categories",
    body: "Bazaar (বাজার), Dining (খাওয়া-দাওয়া), Transport (যাতায়াত) — names that fit Dhaka life.",
  },
  {
    icon: UsersRound,
    title: "Family space",
    body: "Create a shared khata, invite your family by email, and see everyone's spending together.",
  },
  {
    icon: ScanText,
    title: "Receipt OCR",
    body: "Snap a receipt photo and let AI fill in the line items for you.",
  },
];

export default function LandingPage() {
  const accessToken = useAppStore((s) => s.accessToken);

  useEffect(() => {
    void initAuth(); // so a returning user sees "Open app" instead of "Sign in"
  }, []);

  const cta = accessToken
    ? { href: "/dashboard", label: "Open app" }
    : { href: "/login", label: "Sign in" };

  return (
    <main className="flex min-h-dvh flex-col bg-white">
      {/* Top bar with sign-in */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur">
        <span className="text-lg font-bold text-teal-700">হিসাবকিতাব</span>
        <Link
          href={cta.href}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white active:bg-teal-700"
        >
          {cta.label}
        </Link>
      </header>

      {/* Hero — sits on a soft teal wash to lift it off the white page */}
      <section className="flex flex-col items-center gap-4 bg-gradient-to-b from-teal-50 to-white px-6 pb-12 pt-14 text-center">
        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
          Family Expense Tracker
        </span>
        <h1 className="text-4xl font-extrabold leading-tight text-stone-900">
          আপনার সংসারের <span className="text-teal-600">হিসাবকিতাব</span>,<br />
          এক জায়গায়
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-stone-500">
          HisabKitab digitizes your daily kharcha — from bazaar runs to rickshaw fares. Track
          solo or together as a family, in Bangla and English.
        </p>
        <Link
          href={cta.href}
          className="mt-2 rounded-xl bg-teal-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-teal-600/25 active:bg-teal-700"
        >
          {accessToken ? "Go to your dashboard" : "Get started — it's free"}
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 gap-3 bg-stone-100 px-5 py-12">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 className="font-semibold text-stone-900">{feature.title}</h2>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-500">{feature.body}</p>
              </div>
            </div>
          );
        })}
      </section>

      <footer className="mt-auto border-t border-stone-200 bg-white px-6 py-5 text-center text-xs text-stone-400">
        Made for families in Dhaka 🇧🇩 · Sign in with Google or email
      </footer>
    </main>
  );
}
