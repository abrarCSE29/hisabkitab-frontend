"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { House, Plus, SlidersHorizontal } from "lucide-react";
import { countActiveFilters } from "@/lib/filters";
import { useAppStore } from "@/store/useAppStore";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const setFilterOpen = useAppStore((s) => s.setFilterOpen);
  const activeFilters = useAppStore((s) => countActiveFilters(s.filters));

  function openFilters() {
    setFilterOpen(true);
    if (pathname !== "/dashboard") router.push("/dashboard");
  }

  const onHome = pathname === "/dashboard";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-stone-200 bg-white shadow-[0_-1px_12px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-3 items-end pb-[env(safe-area-inset-bottom)]">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
            onHome ? "text-teal-700" : "text-stone-400"
          }`}
        >
          <House className="h-[22px] w-[22px]" strokeWidth={onHome ? 2.4 : 2} />
          Home
        </Link>

        {/* The one big add button — raised into the thumb's resting spot */}
        <div className="flex justify-center">
          <Link
            href="/add"
            aria-label="Add entry"
            className="-mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-600/40 ring-4 ring-white active:scale-95"
          >
            <Plus className="h-8 w-8" strokeWidth={2.5} />
          </Link>
        </div>

        <button
          onClick={openFilters}
          className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-stone-400"
        >
          <SlidersHorizontal className="h-[22px] w-[22px]" strokeWidth={2} />
          Filter
          {activeFilters > 0 && (
            <span className="absolute right-[26%] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
              {activeFilters}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
