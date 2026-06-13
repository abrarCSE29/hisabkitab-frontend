"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { categoryColor, categoryEmoji } from "@/lib/categoryMeta";
import AppBar, { BackButton } from "@/components/AppBar";
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
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
        <div className="flex items-center gap-3 border-b border-stone-100 p-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${categoryColor(
              voucher.category_id,
            )}`}
          >
            {categoryEmoji(voucher.category_id)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900">
              {category?.label ?? voucher.category_id ?? "Uncategorized"}
            </p>
            <p className="truncate text-xs text-stone-500">
              by {voucher.user_name ?? voucher.user_email ?? "family member"} ·{" "}
              {voucherDate(voucher.created_at)}
            </p>
          </div>
          <span
            className={`shrink-0 text-lg font-bold ${expense ? "text-red-600" : "text-emerald-600"}`}
          >
            {taka(voucher.voucher_total)}
          </span>
        </div>
        <ul className="flex flex-col">
          {voucher.items.map((item, index) => (
            <li
              key={index}
              className="flex justify-between px-4 py-2.5 text-sm not-last:border-b not-last:border-stone-50"
            >
              <span className="text-stone-600">{item.name || `Item ${index + 1}`}</span>
              <span className="font-semibold text-stone-900">{taka(item.amount)}</span>
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
            className="max-h-72 w-full rounded-2xl border border-stone-200 object-contain"
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!voucher) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteVoucher(voucher._id);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <AppBar
        title={isOwner ? "Edit entry" : "Entry details"}
        subtitle={voucher?.updated_at ? `edited ${voucherDate(voucher.updated_at)}` : undefined}
        leading={<BackButton />}
        trailing={
          isOwner ? (
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete entry"
              className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white active:bg-white/20"
            >
              <Trash2 className="h-5 w-5" strokeWidth={2.25} />
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-5 px-4 pb-24 pt-5">
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {!voucher && !error && (
          <div className="animate-pulse rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-400">
            Loading…
          </div>
        )}

        {voucher &&
          (isOwner ? (
            <VoucherForm
              initial={voucher}
              submitLabel="Update"
              onSubmit={async (payload) => {
                await api.updateVoucher(voucher._id, payload);
                router.push("/dashboard");
              }}
            />
          ) : (
            <ReadOnlyVoucher voucher={voucher} />
          ))}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            aria-label="Cancel"
            onClick={() => !deleting && setConfirmDelete(false)}
            className="absolute inset-0 cursor-default bg-stone-900/50 backdrop-blur-[1px]"
          />
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className="text-center text-base font-bold text-stone-900">Delete this entry?</p>
            <p className="mt-1 text-center text-sm text-stone-500">
              This can&apos;t be undone.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="h-11 flex-1 rounded-xl bg-stone-100 text-sm font-semibold text-stone-700 active:bg-stone-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="h-11 flex-1 rounded-xl bg-red-500 text-sm font-bold text-white shadow-md shadow-red-500/25 active:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
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
