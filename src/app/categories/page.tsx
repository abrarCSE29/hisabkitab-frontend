"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, UserRound, UsersRound } from "lucide-react";
import AppBar, { BackButton } from "@/components/AppBar";
import AuthGate from "@/components/AuthGate";
import { api } from "@/lib/api";
import { categoryTint, COLOR_CHOICES, EMOJI_CHOICES } from "@/lib/categoryMeta";
import type { Category, VoucherType } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

interface Editing {
  id: string | null; // null = creating
  name: string;
  type: VoucherType;
  emoji: string;
  color: string;
}

function CategoriesView() {
  const workspace = useAppStore((s) => s.workspace);
  const familyId = workspace.mode === "family" ? workspace.familyId : undefined;
  const workspaceName = workspace.mode === "family" ? workspace.familyName : "Personal";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await api.categories(undefined, familyId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    // One-shot fetch on mount / workspace change (load is rebuilt when familyId changes).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const custom = categories.filter((c) => c.custom);

  function startCreate() {
    setEditing({ id: null, name: "", type: "expense", emoji: EMOJI_CHOICES[0], color: COLOR_CHOICES[0] });
  }
  function startEdit(c: Category) {
    setEditing({ id: c.id, name: c.name_en, type: c.type, emoji: c.emoji, color: c.color });
  }

  async function save() {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: editing.name.trim(),
        type: editing.type,
        emoji: editing.emoji,
        color: editing.color,
      };
      if (editing.id) await api.updateCategory(editing.id, payload);
      else await api.createCategory(payload, familyId);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save category");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setSaving(true);
    try {
      await api.deleteCategory(id);
      setConfirmId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
      setConfirmId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-stone-100">
      <AppBar
        title="Manage categories"
        leading={<BackButton />}
        trailing={
          <span className="mr-1 flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/30">
            {workspace.mode === "family" ? (
              <UsersRound className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            <span className="max-w-24 truncate">{workspaceName}</span>
          </span>
        }
      />

      <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <button
          onClick={startCreate}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-teal-600/25 active:from-teal-700"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} /> New category
        </button>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5">
          <h2 className="mb-3 text-sm font-bold text-stone-900">
            Your categories {!loading && <span className="text-stone-400">· {custom.length}</span>}
          </h2>
          {loading ? (
            <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
          ) : custom.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-400">
              No custom categories yet. Create one to tailor your {workspaceName.toLowerCase()} entries.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {custom.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl border border-stone-100 p-2.5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={categoryTint(c.color)}
                  >
                    {c.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">{c.name_en}</p>
                    <p className="text-xs text-stone-400">{c.type === "expense" ? "খরচ · Expense" : "আয় · Income"}</p>
                  </div>
                  <button
                    onClick={() => startEdit(c)}
                    aria-label="Edit"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 active:bg-stone-100"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setConfirmId(c.id)}
                    aria-label="Delete"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="px-1 text-xs text-stone-400">
          Built-in categories can&apos;t be edited. Deleting a custom category moves its existing
          entries to the matching “Others” category.
        </p>
      </div>

      {/* Editor sheet */}
      {editing && (
        <>
          <button
            aria-label="Close"
            onClick={() => !saving && setEditing(null)}
            className="fixed inset-0 z-40 cursor-default bg-black/40 backdrop-blur-[2px]"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl bg-white p-4 pb-6 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200" />
            <p className="px-1 pb-3 text-sm font-bold text-stone-900">
              {editing.id ? "Edit category" : "New category"}
            </p>

            <input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Category name"
              maxLength={40}
              className="mb-3 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 text-sm outline-none focus:border-teal-400 focus:bg-white"
            />

            <div className="mb-3 grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-semibold">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setEditing({ ...editing, type: t })}
                  className={`rounded-lg py-1.5 transition-colors ${
                    editing.type === t
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

            <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Icon</p>
            <div className="no-scrollbar mb-3 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
              {EMOJI_CHOICES.map((em) => (
                <button
                  key={em}
                  onClick={() => setEditing({ ...editing, emoji: em })}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                    editing.emoji === em ? "ring-2 ring-teal-500" : "bg-stone-50"
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
                  onClick={() => setEditing({ ...editing, color: col })}
                  aria-label={`Color ${col}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: col }}
                >
                  {editing.color === col && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="h-12 flex-1 rounded-xl bg-stone-100 text-sm font-semibold text-stone-700 active:bg-stone-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void save()}
                disabled={saving || !editing.name.trim()}
                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-sm font-bold text-white shadow-md shadow-teal-600/25 active:from-teal-700 disabled:opacity-40"
              >
                {saving ? "Saving…" : editing.id ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            aria-label="Cancel"
            onClick={() => !saving && setConfirmId(null)}
            className="absolute inset-0 cursor-default bg-stone-900/50 backdrop-blur-[1px]"
          />
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className="text-center text-base font-bold text-stone-900">Delete this category?</p>
            <p className="mt-1 text-center text-sm text-stone-500">
              Existing entries move to “Others”.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setConfirmId(null)}
                disabled={saving}
                className="h-11 flex-1 rounded-xl bg-stone-100 text-sm font-semibold text-stone-700 active:bg-stone-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void remove(confirmId)}
                disabled={saving}
                className="h-11 flex-1 rounded-xl bg-red-500 text-sm font-bold text-white shadow-md shadow-red-500/25 active:bg-red-600 disabled:opacity-50"
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <AuthGate>
      <CategoriesView />
    </AuthGate>
  );
}
