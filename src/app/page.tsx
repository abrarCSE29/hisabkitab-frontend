"use client";

import { useEffect } from "react";
import Link from "next/link";
import { initAuth } from "@/lib/auth";
import { useAppStore } from "@/store/useAppStore";

const features = [
  {
    icon: "⚡",
    title: "Quick logging",
    body: "Tap +, type the amount, done. Add itemized rows when you need the detail.",
  },
  {
    icon: "🏷️",
    title: "Bangla categories",
    body: "Bazaar (বাজার), Dining (খাওয়া-দাওয়া), Transport (যাতায়াত) — names that fit Dhaka life.",
  },
  {
    icon: "👪",
    title: "Family space",
    body: "Create a shared khata, invite your family by email, and see everyone's spending together.",
  },
  {
    icon: "✨",
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
    <main className="flex min-h-dvh flex-col">
      {/* Top bar with sign-in */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-stone-50/95 px-4 py-3 backdrop-blur">
        <span className="text-lg font-bold text-teal-700">হিসাবকিতাব</span>
        <Link
          href={cta.href}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white active:bg-teal-700"
        >
          {cta.label}
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center gap-4 px-6 pb-10 pt-14 text-center">
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
          Family Expense Tracker
        </span>
        <h1 className="text-4xl font-extrabold leading-tight">
          আপনার সংসারের <span className="text-teal-600">হিসাবকিতাব</span>,<br />
          এক জায়গায়
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-stone-500">
          HisabKitab digitizes your daily kharcha — from bazaar runs to rickshaw fares. Track
          solo or together as a family, in Bangla and English.
        </p>
        <Link
          href={cta.href}
          className="mt-2 rounded-xl bg-teal-600 px-8 py-3.5 font-semibold text-white shadow-md active:bg-teal-700"
        >
          {accessToken ? "Go to your dashboard" : "Get started — it's free"}
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 gap-3 px-5 pb-12">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-stone-200/80 shadow-sm shadow-stone-300/40"
          >
            <span className="text-2xl">{feature.icon}</span>
            <div>
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-0.5 text-sm leading-relaxed text-stone-500">{feature.body}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-auto border-t border-stone-100 px-6 py-5 text-center text-xs text-stone-400">
        Made for families in Dhaka 🇧🇩 · Sign in with Google or email
      </footer>
    </main>
  );
}
