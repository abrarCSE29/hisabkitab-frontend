"use client";

import Link from "next/link";
import { categoryEmoji } from "@/lib/categoryMeta";
import { taka, voucherDate } from "@/lib/format";
import type { Voucher } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

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

export default function VoucherFeed({ vouchers }: { vouchers: Voucher[] }) {
  const categories = useAppStore((s) => s.categories);
  const user = useAppStore((s) => s.user);
  const workspace = useAppStore((s) => s.workspace);

  if (vouchers.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center text-sm text-stone-400 shadow-sm shadow-stone-300/40">
        No transactions yet — tap <span className="font-semibold text-teal-600">＋ Add</span> to
        log your first one.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {vouchers.map((voucher) => {
        const category = categories.find((c) => c.id === voucher.category_id);
        const expense = voucher.type === "expense";
        return (
          <li key={voucher._id}>
            <Link
              href={`/voucher/${voucher._id}`}
              className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm shadow-stone-300/40 active:bg-stone-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl">
                {categoryEmoji(voucher.category_id)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">
                  {category?.label ?? voucher.category_id ?? "Uncategorized"}
                </span>
                <span className="truncate text-xs text-stone-500">
                  {itemsSummary(voucher)}
                  {workspace.mode === "family" && ` · by ${creatorName(voucher, user?.id)}`}
                  {voucher.image_url && " · 📎"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`font-semibold ${expense ? "text-red-600" : "text-emerald-600"}`}
                >
                  {expense ? "−" : "+"}
                  {taka(voucher.voucher_total)}
                </span>
                <span className="text-xs text-stone-400">{voucherDate(voucher.created_at)}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
