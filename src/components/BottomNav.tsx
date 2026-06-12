"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-stone-200 bg-white/95 backdrop-blur">
      <div className="grid grid-cols-3 items-end">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
            pathname === "/dashboard" ? "text-teal-700" : "text-stone-500"
          }`}
        >
          <span className="text-lg leading-none">🏠</span>
          Home
        </Link>

        {/* The one big add button — raised into the thumb's resting spot */}
        <div className="flex justify-center">
          <Link
            href="/add"
            aria-label="Add entry"
            className="-mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-4xl font-light text-white shadow-lg shadow-teal-600/40 ring-4 ring-stone-50 active:scale-95"
          >
            +
          </Link>
        </div>

        <button
          onClick={openFilters}
          className="relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-stone-500"
        >
          <span className="text-lg leading-none">🎛️</span>
          Filter
          {activeFilters > 0 && (
            <span className="absolute right-[28%] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
              {activeFilters}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
