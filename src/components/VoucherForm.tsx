"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { categoryEmoji } from "@/lib/categoryMeta";
import { uploadReceipt } from "@/lib/receipts";
import { supabase } from "@/lib/supabase";
import type { Voucher, VoucherType, VoucherUpdatePayload } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

interface ItemRow {
  name: string;
  amount: string; // keep as text while editing
}

interface VoucherFormProps {
  initial?: Voucher; // when set, the form edits an existing voucher
  submitLabel: string;
  onSubmit: (payload: VoucherUpdatePayload) => Promise<void>;
}

const plainNumberInput =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export default function VoucherForm({ initial, submitLabel, onSubmit }: VoucherFormProps) {
  const user = useAppStore((s) => s.user);
  const categories = useAppStore((s) => s.categories);
  const setCategories = useAppStore((s) => s.setCategories);

  const [type, setType] = useState<VoucherType>(initial?.type ?? "expense");
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null);
  const [items, setItems] = useState<ItemRow[]>(
    initial?.items.map((item) => ({ name: item.name, amount: String(item.amount) })) ?? [
      { name: "", amount: "" },
    ],
  );
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categories.length === 0) {
      api.categories().then(setCategories).catch(() => {});
    }
  }, [categories.length, setCategories]);

  const typeCategories = categories.filter((c) => c.type === type);
  const parsedItems = items
    .map((row) => ({ name: row.name.trim(), amount: parseFloat(row.amount) }))
    .filter((row) => !Number.isNaN(row.amount) && row.amount > 0);
  const total = parsedItems.reduce((sum, row) => sum + row.amount, 0);
  const expense = type === "expense";

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function attachReceipt(file: File) {
    setBusy("Uploading receipt…");
    setError(null);
    try {
      setImageUrl(await uploadReceipt(file, user!.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function runOcr() {
    if (!imageUrl) return;
    setBusy("Reading receipt with AI…");
    setError(null);
    try {
      const result = await api.ocr(imageUrl);
      if (result.items.length === 0) {
        setError("No items found on the receipt");
      } else {
        setItems(result.items.map((i) => ({ name: i.name, amount: String(i.amount) })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (parsedItems.length === 0) {
      setError("Enter an amount first");
      return;
    }
    setBusy("Saving…");
    setError(null);
    try {
      await onSubmit({
        type,
        category_id: categoryId,
        items: parsedItems,
        image_url: imageUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-36">
      {/* Type toggle — compact, out of the way */}
      <div className="mx-auto grid w-60 grid-cols-2 rounded-full bg-stone-200 p-1 text-sm font-semibold">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setCategoryId(null);
            }}
            className={`rounded-full py-1.5 transition-colors ${
              type === t
                ? t === "expense"
                  ? "bg-white text-red-600 shadow-sm"
                  : "bg-white text-emerald-600 shadow-sm"
                : "text-stone-500"
            }`}
          >
            {t === "expense" ? "খরচ" : "আয়"}
          </button>
        ))}
      </div>

      {/* HERO: amount + item name — the two things that matter most */}
      <section className="flex flex-col items-center gap-2">
        <div className="flex w-full items-center justify-center gap-1 px-4">
          <span
            className={`shrink-0 text-3xl font-semibold ${
              expense ? "text-red-300" : "text-emerald-300"
            }`}
          >
            ৳
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            autoFocus={!initial}
            placeholder="0"
            value={items[0]?.amount ?? ""}
            onChange={(e) => updateItem(0, { amount: e.target.value })}
            className={`min-w-0 flex-1 bg-transparent text-center text-6xl font-extrabold tracking-tight outline-none placeholder:text-stone-200 ${
              expense ? "text-red-600 caret-red-400" : "text-emerald-600 caret-emerald-400"
            } ${plainNumberInput}`}
          />
          {/* mirror the ৳ width so the digits stay visually centered */}
          <span className="w-[1ch] shrink-0 text-3xl font-semibold text-transparent">৳</span>
        </div>
        <input
          placeholder="কীসের জন্য? (optional)"
          value={items[0]?.name ?? ""}
          onChange={(e) => updateItem(0, { name: e.target.value })}
          className="h-10 w-64 rounded-full bg-white px-4 text-center text-sm text-stone-700 outline-none ring-1 ring-stone-200 placeholder:text-stone-400 focus:ring-teal-400"
        />
      </section>

      {/* Extra item rows — tucked away until needed */}
      <section className="flex flex-col gap-2">
        {items.slice(1).map((row, sliceIndex) => {
          const index = sliceIndex + 1;
          return (
            <div key={index} className="flex items-center gap-2">
              <input
                placeholder={`Item ${index + 1}`}
                value={row.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                className="h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3.5 text-sm"
              />
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="৳ 0"
                value={row.amount}
                onChange={(e) => updateItem(index, { amount: e.target.value })}
                className={`h-11 w-24 rounded-xl border border-stone-200 bg-white px-3 text-right text-sm font-semibold ${plainNumberInput}`}
              />
              <button
                onClick={() => setItems((rows) => rows.filter((_, i) => i !== index))}
                className="px-1 text-stone-400"
                aria-label="Remove item"
              >
                ✕
              </button>
            </div>
          );
        })}
        <button
          onClick={() => setItems((rows) => [...rows, { name: "", amount: "" }])}
          className="mx-auto rounded-full bg-white px-4 py-1.5 text-sm font-medium text-teal-700 ring-1 ring-stone-200 active:bg-stone-50"
        >
          ＋ আরো item যোগ করুন
        </button>
      </section>

      {/* Category — one swipeable row, emoji-first */}
      <section className="flex flex-col gap-2">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
          {typeCategories.map((category) => {
            const active = categoryId === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setCategoryId(active ? null : category.id)}
                className={`flex min-w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 transition-all ${
                  active
                    ? "scale-105 bg-teal-600 text-white shadow-md shadow-teal-600/30"
                    : "bg-white text-stone-600 ring-1 ring-stone-200"
                }`}
              >
                <span className="text-xl leading-none">{categoryEmoji(category.id)}</span>
                <span className="text-[11px] font-medium leading-none">{category.name_bn}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Receipt — compact row, optional */}
      <section className="flex items-center gap-2">
        {supabase && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void attachReceipt(file);
              }}
            />
            <button
              onClick={() => fileInput.current?.click()}
              disabled={busy !== null}
              className="h-11 flex-1 rounded-xl bg-white text-sm font-medium ring-1 ring-stone-200 active:bg-stone-100 disabled:opacity-50"
            >
              📷 {imageUrl ? "Replace photo" : "Receipt photo"}
            </button>
            <button
              onClick={() => void runOcr()}
              disabled={!imageUrl || busy !== null}
              className="h-11 flex-1 rounded-xl bg-amber-100 text-sm font-medium text-amber-800 active:bg-amber-200 disabled:opacity-40"
            >
              ✨ Auto-fill items
            </button>
          </>
        )}
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Receipt attachment"
              className="h-11 w-11 rounded-xl object-cover ring-1 ring-stone-200"
            />
          </a>
        )}
      </section>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Sticky save — always in the thumb zone */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent px-4 pb-5 pt-8">
        <button
          onClick={() => void save()}
          disabled={busy !== null || parsedItems.length === 0}
          className={`h-14 w-full rounded-2xl text-base font-bold text-white shadow-lg transition-colors disabled:opacity-40 ${
            expense
              ? "bg-red-500 shadow-red-500/25 active:bg-red-600"
              : "bg-emerald-500 shadow-emerald-500/25 active:bg-emerald-600"
          }`}
        >
          {busy ?? `${submitLabel}${total > 0 ? ` · ৳${total.toLocaleString()}` : ""}`}
        </button>
      </div>
    </div>
  );
}
