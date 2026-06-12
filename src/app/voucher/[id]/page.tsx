"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import VoucherForm from "@/components/VoucherForm";
import { api } from "@/lib/api";
import { taka, voucherDate } from "@/lib/format";
import type { Voucher } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

function ReadOnlyVoucher({ voucher }: { voucher: Voucher }) {
  const categories = useAppStore((s) => s.categories);
  const category = categories.find((c) => c.id === voucher.category_id);
  const expense = voucher.type === "expense";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white p-4 border border-stone-200/80 shadow-sm shadow-stone-300/40">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {category?.label ?? voucher.category_id ?? "Uncategorized"}
          </span>
          <span className={`text-lg font-bold ${expense ? "text-red-600" : "text-emerald-600"}`}>
            {expense ? "−" : "+"}
            {taka(voucher.voucher_total)}
          </span>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          by {voucher.user_name ?? voucher.user_email ?? "family member"} ·{" "}
          {voucherDate(voucher.created_at)}
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-stone-100 pt-3">
          {voucher.items.map((item, index) => (
            <li key={index} className="flex justify-between text-sm">
              <span className="text-stone-600">{item.name || `Item ${index + 1}`}</span>
              <span className="font-medium">{taka(item.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      {voucher.image_url && (
        <a href={voucher.image_url} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={voucher.image_url}
            alt="Receipt attachment"
            className="max-h-72 w-full rounded-2xl object-contain ring-1 ring-stone-200"
          />
        </a>
      )}

      <p className="text-center text-xs text-stone-400">
        Only the person who logged an entry can edit it.
      </p>
    </div>
  );
}

function VoucherDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setCategories = useAppStore((s) => s.setCategories);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .voucher(id)
      .then(setVoucher)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    // For direct navigation, the category labels may not be cached yet.
    if (useAppStore.getState().categories.length === 0) {
      api.categories().then(setCategories).catch(() => {});
    }
  }, [id, setCategories]);

  const isOwner = voucher !== null && voucher.user_id === user?.id;

  return (
    <div className="flex flex-col gap-5 px-4 pb-24 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-stone-200"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold">{isOwner ? "Edit entry" : "Entry details"}</h1>
          {voucher?.updated_at && (
            <p className="text-xs text-stone-400">edited {voucherDate(voucher.updated_at)}</p>
          )}
        </div>
      </header>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!voucher && !error && (
        <div className="animate-pulse rounded-2xl bg-white p-8 text-center text-sm text-stone-400">
          Loading…
        </div>
      )}

      {voucher &&
        (isOwner ? (
          <VoucherForm
            initial={voucher}
            submitLabel="Save changes"
            onSubmit={async (payload) => {
              await api.updateVoucher(voucher._id, payload);
              router.push("/dashboard");
            }}
          />
        ) : (
          <ReadOnlyVoucher voucher={voucher} />
        ))}
    </div>
  );
}

export default function VoucherPage() {
  return (
    <AuthGate>
      <VoucherDetail />
    </AuthGate>
  );
}
