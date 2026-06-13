"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, RefreshCw } from "lucide-react";
import AppBar from "@/components/AppBar";
import AuthGate from "@/components/AuthGate";
import BottomNav from "@/components/BottomNav";
import FilterSheet from "@/components/FilterSheet";
import SideDrawer from "@/components/SideDrawer";
import VoucherFeed from "@/components/VoucherFeed";
import { api } from "@/lib/api";
import { applyVoucherFilters, countActiveFilters } from "@/lib/filters";
import { isCurrentMonth, taka } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";

function Dashboard() {
  const user = useAppStore((s) => s.user);
  const workspace = useAppStore((s) => s.workspace);
  const vouchers = useAppStore((s) => s.vouchers);
  const setVouchers = useAppStore((s) => s.setVouchers);
  const setCategories = useAppStore((s) => s.setCategories);
  const setFamilies = useAppStore((s) => s.setFamilies);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const filters = useAppStore((s) => s.filters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Auto-advance the stat cards; manual swipes reset the timer via activeCard.
  useEffect(() => {
    if (carouselPaused) return;
    const timer = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const next = (Math.round((el.scrollLeft / maxScroll) * 2) + 1) % 3;
      el.scrollTo({ left: (next * maxScroll) / 2, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(timer);
  }, [carouselPaused, activeCard]);

  const refresh = useCallback(async () => {
    try {
      const familyId = workspace.mode === "family" ? workspace.familyId : undefined;
      const [categories, families, feed] = await Promise.all([
        api.categories(),
        api.families(),
        api.vouchers(familyId),
      ]);
      setError(null);
      setCategories(categories);
      setFamilies(families);
      setVouchers(feed);
      // The persisted family workspace may no longer exist / be accessible.
      if (familyId && !families.some((f) => f._id === familyId)) {
        setWorkspace({ mode: "solo" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [workspace, setCategories, setFamilies, setVouchers, setWorkspace]);

  useEffect(() => {
    // Async data fetch — state updates happen after await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const visibleVouchers = applyVoucherFilters(vouchers, filters);
  const activeFilterCount = countActiveFilters(filters);

  const monthly = vouchers.filter((v) => isCurrentMonth(v.created_at));
  const spent = monthly
    .filter((v) => v.type === "expense")
    .reduce((sum, v) => sum + v.voucher_total, 0);
  const earned = monthly
    .filter((v) => v.type === "income")
    .reduce((sum, v) => sum + v.voucher_total, 0);
  const net = earned - spent;
  const month = new Date().toLocaleString("en", { month: "long" });

  // Top-to-bottom dark → light gradients per card
  const statCards = [
    {
      label: "Spent (খরচ)",
      value: spent,
      sub: `${monthly.filter((v) => v.type === "expense").length} entries`,
      gradient: "from-rose-800 via-rose-600 to-rose-400 shadow-rose-600/25",
    },
    {
      label: "Earned (আয়)",
      value: earned,
      sub: `${monthly.filter((v) => v.type === "income").length} entries`,
      gradient: "from-emerald-800 via-emerald-600 to-emerald-400 shadow-emerald-600/25",
    },
    {
      label: "Net (জমা)",
      value: net,
      sub: net >= 0 ? "you're saving 🎉" : "spending more than earning",
      gradient:
        net >= 0
          ? "from-blue-800 via-blue-600 to-blue-400 shadow-blue-600/25"
          : "from-blue-950 via-blue-800 to-blue-600 shadow-blue-800/25",
    },
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden pb-20">
      <AppBar
        center
        title={workspace.mode === "family" ? workspace.familyName : "Personal"}
        subtitle={workspace.mode === "family" ? "Family workspace" : "Solo workspace"}
        leading={
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white active:bg-white/20"
          >
            <Menu className="h-5 w-5" strokeWidth={2.25} />
          </button>
        }
        trailing={
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open profile menu"
            className="shrink-0 p-0.5"
          >
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.name ?? "Profile"}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full ring-2 ring-white/60"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-base font-semibold text-white ring-1 ring-white/40">
                {(user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        }
      />

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pt-4">
        {/* Swipeable stat cards: Spent → Earned → Net */}
        <section className="flex shrink-0 flex-col gap-2">
          <div
            ref={carouselRef}
            className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4"
            onTouchStart={() => setCarouselPaused(true)}
            onTouchEnd={() => setCarouselPaused(false)}
            onScroll={(e) => {
              const el = e.currentTarget;
              const maxScroll = el.scrollWidth - el.clientWidth;
              if (maxScroll > 0) {
                setActiveCard(Math.round((el.scrollLeft / maxScroll) * (statCards.length - 1)));
              }
            }}
          >
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`w-[86%] shrink-0 snap-center rounded-2xl bg-gradient-to-b p-5 text-white shadow-lg ${card.gradient}`}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-white/75">
                  {month} · {card.label}
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight">
                  {card.value < 0 ? `−${taka(Math.abs(card.value))}` : taka(card.value)}
                </p>
                <p className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  {card.sub}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5">
            {statCards.map((card, index) => (
              <span
                key={card.label}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeCard ? "w-5 bg-teal-600" : "w-1.5 bg-stone-300"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Entries card — the list scrolls inside, not the page */}
        <section className="mb-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
          <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-2.5">
            <h2 className="flex items-baseline gap-2 text-base font-bold text-stone-900">
              Entries
              {!loading && (
                <span className="text-xs font-medium text-stone-400">
                  {visibleVouchers.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => void refresh()}
              aria-label="Refresh entries"
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 active:bg-stone-100"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {error && (
            <p className="mx-3 mt-2 shrink-0 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {activeFilterCount > 0 && (
            <div className="mx-3 mt-2 flex shrink-0 items-center justify-between rounded-xl bg-teal-50 px-3.5 py-2 text-xs font-medium text-teal-700">
              <span>
                Filtered · showing {visibleVouchers.length} of {vouchers.length}
              </span>
              <button onClick={resetFilters} className="font-bold underline">
                Clear
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden px-3 py-2">
            {loading ? (
              <div className="animate-pulse p-8 text-center text-sm text-stone-400">Loading…</div>
            ) : (
              <VoucherFeed vouchers={visibleVouchers} />
            )}
          </div>
        </section>
      </div>

      <FilterSheet />
      <BottomNav />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
