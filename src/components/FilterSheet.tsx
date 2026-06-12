"use client";

import { useEffect } from "react";
import { categoryEmoji } from "@/lib/categoryMeta";
import type { VoucherSort } from "@/lib/filters";
import { useAppStore } from "@/store/useAppStore";

const SORT_OPTIONS: { id: VoucherSort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "amount_desc", label: "৳ High → Low" },
  { id: "amount_asc", label: "৳ Low → High" },
];

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function FilterSheet() {
  const open = useAppStore((s) => s.filterOpen);
  const setOpen = useAppStore((s) => s.setFilterOpen);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const categories = useAppStore((s) => s.categories);
  const families = useAppStore((s) => s.families);
  const workspace = useAppStore((s) => s.workspace);
  const user = useAppStore((s) => s.user);

  const members =
    workspace.mode === "family"
      ? (families.find((f) => f._id === workspace.familyId)?.members ?? [])
      : [];

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Bottom sheet — floats up from the thumb zone */}
      <section
        role="dialog"
        aria-label="Filter entries"
        className={`fixed inset-x-0 bottom-0 z-40 mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-stone-200" />

        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-4 pt-3">
          {/* By family member — only in family workspace */}
          {members.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-stone-600">By member</h3>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => {
                  const active = filters.memberIds.includes(member.user_id);
                  const label =
                    member.user_id === user?.id
                      ? "You"
                      : (member.name ?? member.email ?? `user ${member.user_id.slice(0, 6)}…`);
                  return (
                    <button
                      key={member.user_id}
                      onClick={() =>
                        setFilters({ memberIds: toggle(filters.memberIds, member.user_id) })
                      }
                      className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                        active
                          ? "bg-teal-600 text-white"
                          : "bg-white text-stone-600 ring-1 ring-stone-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* By category */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-stone-600">By category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = filters.categoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() =>
                      setFilters({ categoryIds: toggle(filters.categoryIds, category.id) })
                    }
                    className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium ${
                      active
                        ? "bg-teal-600 text-white"
                        : "bg-white text-stone-600 ring-1 ring-stone-200"
                    }`}
                  >
                    <span>{categoryEmoji(category.id)}</span>
                    {category.name_bn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-stone-600">Sort</h3>
            <div className="grid grid-cols-3 rounded-xl bg-stone-100 p-1 text-xs font-semibold">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFilters({ sort: option.id })}
                  className={`rounded-lg py-2 ${
                    filters.sort === option.id ? "bg-white shadow-sm" : "text-stone-500"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-stone-600">Date range</h3>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateFrom ?? ""}
                onChange={(e) => setFilters({ dateFrom: e.target.value || null })}
                className="h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm"
              />
              <span className="text-stone-400">→</span>
              <input
                type="date"
                value={filters.dateTo ?? ""}
                onChange={(e) => setFilters({ dateTo: e.target.value || null })}
                className="h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Sticky actions */}
        <div className="flex gap-2 border-t border-stone-100 p-4">
          <button
            onClick={resetFilters}
            className="h-12 flex-1 rounded-xl bg-stone-100 text-sm font-semibold text-stone-600 active:bg-stone-200"
          >
            Reset
          </button>
          <button
            onClick={() => setOpen(false)}
            className="h-12 flex-[2] rounded-xl bg-teal-600 text-sm font-bold text-white active:bg-teal-700"
          >
            Done
          </button>
        </div>
      </section>
    </>
  );
}
