"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Paperclip } from "lucide-react";
import { categoryColor, categoryEmoji } from "@/lib/categoryMeta";
import { parseIso, taka, voucherDate } from "@/lib/format";
import type { Voucher } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

const PAGE_SIZE = 7;

function creatorName(voucher: Voucher, currentUserId: string | undefined): string {
  if (voucher.user_id === currentUserId) return "you";
  if (voucher.user_name) return voucher.user_name.split(" ")[0]; // Google first name
  // "rahima.akter@gmail.com" -> "rahima.akter"; fall back to a short uid.
  return voucher.user_email?.split("@")[0] ?? `user ${voucher.user_id.slice(0, 6)}…`;
}

function itemsSummary(voucher: Voucher): string {
  const named = voucher.items.filter((item) => item.name.trim());
  if (named.length === 0) return `${voucher.items.length} item${voucher.items.length > 1 ? "s" : ""}`;
  const names = named.map((item) => item.name);
  return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ");
}

// "Today" / "Yesterday" / "12 Jun 2026" for the divider above a group.
function dayLabel(iso: string): string {
  const date = parseIso(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function VoucherFeed({ vouchers }: { vouchers: Voucher[] }) {
  const categories = useAppStore((s) => s.categories);
  const user = useAppStore((s) => s.user);
  const workspace = useAppStore((s) => s.workspace);
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(vouchers.length / PAGE_SIZE));
  // A filter change can shrink the list under the stored page — clamp on render
  // rather than in an effect (avoids a cascading re-render).
  const currentPage = Math.min(page, pageCount - 1);

  if (vouchers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-400">
        No transactions yet — tap <span className="font-semibold text-teal-600">＋ Add</span> to
        log your first one.
      </div>
    );
  }

  const start = currentPage * PAGE_SIZE;
  const pageItems = vouchers.slice(start, start + PAGE_SIZE);

  return (
    <div className="flex h-full flex-col">
      <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
        {pageItems.map((voucher, index) => {
          const category = categories.find((c) => c.id === voucher.category_id);
          const expense = voucher.type === "expense";
          const label = dayLabel(voucher.created_at);
          const showDivider =
            index === 0 || dayLabel(pageItems[index - 1].created_at) !== label;
          return (
            <li key={voucher._id}>
              {showDivider && (
                <p className="px-1 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400 first:pt-0">
                  {label}
                </p>
              )}
              <Link
                href={`/voucher/${voucher._id}`}
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 active:bg-stone-50"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${categoryColor(
                    voucher.category_id,
                  )}`}
                >
                  {categoryEmoji(voucher.category_id)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-stone-900">
                    {voucher.heading?.trim() ||
                      category?.label ||
                      voucher.category_id ||
                      "Uncategorized"}
                  </span>
                  <span className="flex items-center gap-1 truncate text-xs text-stone-500">
                    <span className="truncate">{itemsSummary(voucher)}</span>
                    {workspace.mode === "family" && (
                      <span className="shrink-0">· by {creatorName(voucher, user?.id)}</span>
                    )}
                    {voucher.image_url && (
                      <Paperclip className="h-3 w-3 shrink-0 text-stone-400" strokeWidth={2} />
                    )}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={`text-[15px] font-bold ${expense ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {taka(voucher.voucher_total)}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {voucherDate(voucher.created_at)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {pageCount > 1 && (
        <div className="mt-2 flex shrink-0 items-center justify-between border-t border-stone-100 pt-2">
          <button
            onClick={() => setPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 active:bg-stone-100 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === currentPage ? "w-5 bg-teal-600" : "w-2 bg-stone-300"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))}
            disabled={currentPage === pageCount - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 active:bg-stone-100 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
      )}
    </div>
  );
}
