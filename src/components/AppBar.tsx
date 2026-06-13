"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/* One consistent title bar for every screen: a teal→emerald gradient band
   with white content and 44px+ touch targets. Pages stop inventing their own
   headers, and the colour anchors the app's identity at the top of every view. */

interface AppBarProps {
  title: ReactNode;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Center the title between leading/trailing (dashboard style). */
  center?: boolean;
  /** Render the title node directly, without the truncating <h1> — needed for
      interactive titles (e.g. a dropdown) whose popovers must escape the bar. */
  bare?: boolean;
}

export function BackButton({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Back"
      className="flex h-10 w-10 items-center justify-center rounded-full text-white active:bg-white/20"
    >
      <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
    </Link>
  );
}

export default function AppBar({ title, subtitle, leading, trailing, center, bare }: AppBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1 bg-gradient-to-r from-teal-600 to-emerald-500 px-2 text-white shadow-md shadow-teal-900/15">
      {leading}
      {bare ? (
        <div className="flex min-w-0 flex-1 items-center justify-center px-1">{title}</div>
      ) : (
        <div className={`min-w-0 flex-1 px-1 ${center ? "text-center" : ""}`}>
          <h1 className="truncate text-base font-bold leading-tight">{title}</h1>
          {subtitle && (
            <p className="truncate text-[11px] leading-tight text-white/80">{subtitle}</p>
          )}
        </div>
      )}
      {trailing}
    </header>
  );
}
