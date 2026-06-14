"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Camera, Check, ImagePlus, Plus, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { api } from "@/lib/api";
import { categoryTint, COLOR_CHOICES, EMOJI_CHOICES } from "@/lib/categoryMeta";
import { dateInputValue } from "@/lib/format";
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
  // Workspace the entry is filed under — scopes which custom categories show
  // and where a newly created one is saved. Undefined = personal.
  familyId?: string;
}

const plainNumberInput =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export default function VoucherForm({ initial, submitLabel, onSubmit, familyId }: VoucherFormProps) {
  const user = useAppStore((s) => s.user);
  const categories = useAppStore((s) => s.categories);
  const setCategories = useAppStore((s) => s.setCategories);

  const [type, setType] = useState<VoucherType>(initial?.type ?? "expense");
  const [heading, setHeading] = useState(initial?.heading ?? "");
  // Defaults to the existing entry's date when editing, otherwise today.
  const [entryDate, setEntryDate] = useState(() => dateInputValue(initial?.created_at));
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null);
  const [items, setItems] = useState<ItemRow[]>(
    initial?.items.map((item) => ({ name: item.name, amount: String(item.amount) })) ?? [
      { name: "", amount: "" },
    ],
  );
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  // OCR feedback: shown once an auto-fill completes; `ocrRating` records the choice.
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrRating, setOcrRating] = useState<"up" | "down" | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  // New-category sheet
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState(EMOJI_CHOICES[0]);
  const [newColor, setNewColor] = useState(COLOR_CHOICES[0]);
  const [creatingCat, setCreatingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    // Load categories for this workspace so its custom ones appear in the picker.
    api.categories(undefined, familyId).then(setCategories).catch(() => {});
  }, [familyId, setCategories]);

  async function createCategory() {
    const name = newName.trim();
    if (!name) {
      setCatError("Enter a name");
      return;
    }
    setCreatingCat(true);
    setCatError(null);
    try {
      const created = await api.createCategory(
        { name, type, emoji: newEmoji, color: newColor },
        familyId,
      );
      setCategories([...categories, created]);
      setCategoryId(created.id);
      setCatSheetOpen(false);
      setNewName("");
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Could not create category");
    } finally {
      setCreatingCat(false);
    }
  }

  // Selected category floats to the front so it's always visible without scrolling.
  const typeCategories = categories
    .filter((c) => c.type === type)
    .sort((a, b) => (a.id === categoryId ? -1 : b.id === categoryId ? 1 : 0));
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
    setScanning(true);
    setError(null);
    try {
      const result = await api.ocr(imageUrl);
      if (result.items.length === 0) {
        setError("No items found on the receipt");
      } else {
        setItems(result.items.map((i) => ({ name: i.name, amount: String(i.amount) })));
        setOcrRating(null);
        setOcrDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setBusy(null);
      setScanning(false);
    }
  }

  function submitOcrFeedback(rating: "up" | "down") {
    setOcrRating(rating); // optimistic; the rating itself isn't critical to the user
    void api.ocrFeedback(rating, imageUrl, parsedItems.length).catch(() => {});
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
        heading: heading.trim() || null,
        entry_date: entryDate || null,
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
      {/* OCR scanning overlay — shown while the receipt is being read */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl">
            <div className="relative mx-auto h-44 w-36 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-stone-300">
                  <Sparkles className="h-10 w-10" strokeWidth={1.75} />
                </div>
              )}
              {/* sweeping beam + bright scan line */}
              <div className="pointer-events-none absolute inset-x-0 h-12 animate-scan border-b-2 border-teal-300 bg-gradient-to-b from-transparent to-teal-400/40 shadow-[0_2px_12px_rgba(45,212,191,0.7)]" />
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-base font-bold text-stone-900">
              <Sparkles className="h-4 w-4 text-amber-500" strokeWidth={2} />
              Getting your items
            </p>
            <p className="mt-0.5 text-sm text-stone-500">Hang tight…</p>
          </div>
        </div>
      )}

      {/* Heading — optional title; the feed falls back to the category name */}
      <input
        value={heading}
        onChange={(e) => setHeading(e.target.value)}
        placeholder="Title (optional)"
        maxLength={200}
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-center text-base font-semibold text-stone-900 outline-none placeholder:font-normal placeholder:text-stone-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
      />

      {/* Date — defaults to today; tap to back-date the entry */}
      <label className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5">
        <CalendarDays className="h-4 w-4 shrink-0 text-stone-400" strokeWidth={2} />
        <span className="text-sm font-medium text-stone-500">Date</span>
        <input
          type="date"
          value={entryDate}
          max={dateInputValue()}
          onChange={(e) => setEntryDate(e.target.value)}
          className="ml-auto bg-transparent text-sm font-semibold text-stone-800 outline-none"
        />
      </label>

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

      {/* OCR feedback — sits above the items so it's seen right after auto-fill */}
      {ocrDone && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 ring-1 ring-amber-100">
          {ocrRating ? (
            <p className="text-sm font-medium text-amber-800">Thanks for the feedback</p>
          ) : (
            <>
              <p className="text-sm font-medium text-amber-800">Did the auto-fill look right?</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => submitOcrFeedback("up")}
                  aria-label="Auto-fill was accurate"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 ring-1 ring-amber-200 active:bg-emerald-50"
                >
                  <ThumbsUp className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => submitOcrFeedback("down")}
                  aria-label="Auto-fill was inaccurate"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 ring-1 ring-amber-200 active:bg-red-50"
                >
                  <ThumbsDown className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {items.length === 1 ? (
        /* HERO: single quick entry — the amount is the stage */
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
        </section>
      ) : (
        /* LIST: multiple items — the big view collapses into uniform rows */
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between px-1">
            <span className="text-sm font-semibold text-stone-600">
              Items ({items.length})
            </span>
            <span
              className={`text-lg font-bold ${expense ? "text-red-600" : "text-emerald-600"}`}
            >
              ৳{total.toLocaleString()}
            </span>
          </div>
          {items.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                placeholder={`Item ${index + 1}`}
                autoFocus={index === items.length - 1 && row.name === "" && row.amount === ""}
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
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 active:bg-stone-100"
                aria-label="Remove item"
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>
          ))}
        </section>
      )}

      <button
        onClick={() => setItems((rows) => [...rows, { name: "", amount: "" }])}
        className="mx-auto flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-stone-200 active:bg-stone-50"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} /> আরো item যোগ করুন
      </button>

      {/* Category — one swipeable row, emoji-first */}
      <section className="flex flex-col gap-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Category
        </p>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
          {typeCategories.map((category) => {
            const active = categoryId === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setCategoryId(active ? null : category.id)}
                className={`flex min-w-[4.5rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 transition-all ${
                  active
                    ? "scale-105 bg-teal-600 text-white shadow-md shadow-teal-600/30"
                    : "bg-white text-stone-600 ring-1 ring-stone-200"
                }`}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none"
                  style={active ? { backgroundColor: "rgba(255,255,255,0.2)" } : categoryTint(category.color)}
                >
                  {category.emoji}
                </span>
                <span className="max-w-[4.5rem] truncate text-[11px] font-medium leading-none">
                  {category.name_bn}
                </span>
              </button>
            );
          })}
          {/* Quick add */}
          <button
            type="button"
            onClick={() => {
              setCatError(null);
              setCatSheetOpen(true);
            }}
            className="flex min-w-[4.5rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-dashed border-stone-300 px-2 py-2.5 text-teal-700 active:bg-stone-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <Plus className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="text-[11px] font-medium leading-none">New</span>
          </button>
        </div>
      </section>

      {/* Receipt — compact row, optional */}
      <section className="flex items-center gap-2">
        {supabase && (
          <>
            {/* Camera capture and gallery upload need separate inputs:
                `capture` forces the camera, omitting it opens the picker. */}
            <input
              ref={cameraInput}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void attachReceipt(file);
                e.target.value = "";
              }}
            />
            <input
              ref={galleryInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void attachReceipt(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => setPhotoMenuOpen(true)}
              disabled={busy !== null}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-medium text-stone-700 ring-1 ring-stone-200 active:bg-stone-100 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" strokeWidth={2} />
              {imageUrl ? "Replace photo" : "Receipt photo"}
            </button>
            <button
              onClick={() => void runOcr()}
              disabled={!imageUrl || busy !== null}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-100 text-sm font-medium text-amber-800 active:bg-amber-200 disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2} /> Auto-fill items
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

      {/* Photo source chooser — small action sheet */}
      <div
        onClick={() => setPhotoMenuOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          photoMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-label="Add receipt photo"
        className={`fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md rounded-t-3xl bg-white p-4 pb-6 shadow-2xl transition-transform duration-300 ease-out ${
          photoMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200" />
        <p className="px-1 pb-2 text-sm font-bold text-stone-900">Add receipt photo</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setPhotoMenuOpen(false);
              cameraInput.current?.click();
            }}
            className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3.5 text-sm font-semibold active:bg-stone-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <Camera className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            Take photo
          </button>
          <button
            onClick={() => {
              setPhotoMenuOpen(false);
              galleryInput.current?.click();
            }}
            className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3.5 text-sm font-semibold active:bg-stone-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <ImagePlus className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            Upload from gallery
          </button>
          <button
            onClick={() => setPhotoMenuOpen(false)}
            className="h-11 rounded-xl text-sm font-medium text-stone-500 active:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* New category sheet */}
      <div
        onClick={() => !creatingCat && setCatSheetOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          catSheetOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-label="New category"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl bg-white p-4 pb-6 shadow-2xl transition-transform duration-300 ease-out ${
          catSheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200" />
        <p className="px-1 pb-1 text-sm font-bold text-stone-900">
          New {expense ? "expense" : "income"} category
        </p>
        <p className="px-1 pb-3 text-xs text-stone-400">
          {familyId ? "Shared with your family" : "For your personal space"}
        </p>

        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name"
          maxLength={40}
          className="mb-3 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 text-sm outline-none focus:border-teal-400 focus:bg-white"
        />

        <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Icon</p>
        <div className="no-scrollbar mb-3 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
          {EMOJI_CHOICES.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setNewEmoji(em)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                newEmoji === em ? "ring-2 ring-teal-500" : "bg-stone-50"
              }`}
            >
              {em}
            </button>
          ))}
        </div>

        <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Color</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {COLOR_CHOICES.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => setNewColor(col)}
              aria-label={`Color ${col}`}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: col }}
            >
              {newColor === col && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>

        {catError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{catError}</p>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={() => setCatSheetOpen(false)}
            disabled={creatingCat}
            className="h-12 flex-1 rounded-xl bg-stone-100 text-sm font-semibold text-stone-700 active:bg-stone-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void createCategory()}
            disabled={creatingCat || !newName.trim()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-sm font-bold text-white shadow-md shadow-teal-600/25 active:from-teal-700 disabled:opacity-40"
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-sm"
              style={categoryTint(newColor)}
            >
              {newEmoji}
            </span>
            {creatingCat ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {/* Sticky save — always in the thumb zone */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md bg-gradient-to-t from-stone-100 via-stone-100/95 to-transparent px-4 pb-5 pt-8">
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
