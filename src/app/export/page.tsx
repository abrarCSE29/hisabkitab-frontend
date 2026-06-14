"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, UserRound, UsersRound } from "lucide-react";
import AppBar, { BackButton } from "@/components/AppBar";
import AuthGate from "@/components/AuthGate";
import { api } from "@/lib/api";
import { categoryHex } from "@/lib/categoryMeta";
import { parseIso, taka } from "@/lib/format";
import {
  csvBlob,
  rowsToCsv,
  triggerDownload,
  type ExportMeta,
  type ExportRow,
} from "@/lib/exportData";
import type { Category, Voucher } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function buildTemplates(): { id: string; label: string; start: string; end: string }[] {
  const today = new Date();
  const end = fmt(today);
  const minus = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return fmt(d);
  };
  const monthsBack = (months: number) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - months);
    return fmt(d);
  };
  return [
    { id: "month", label: "This month", start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), end },
    { id: "week", label: "Last week", start: minus(6), end },
    { id: "30d", label: "Last month", start: minus(29), end },
    { id: "3m", label: "Last 3 months", start: monthsBack(3), end },
  ];
}

function buildRows(vouchers: Voucher[], categories: Category[]): ExportRow[] {
  return vouchers.map((v) => {
    const cat = categories.find((c) => c.id === v.category_id);
    const category = cat?.label ?? v.category_id ?? "Uncategorized";
    const items = v.items
      .filter((i) => i.name.trim())
      .map((i) => i.name)
      .join(", ");
    const d = parseIso(v.created_at);
    return {
      iso: v.created_at,
      dateLabel: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      type: v.type,
      title: v.heading?.trim() || category,
      category,
      items,
      amount: v.voucher_total,
      by: v.user_name ?? v.user_email ?? null,
      colorHex: categoryHex(v.category_id),
    };
  });
}

function ExportView() {
  const workspace = useAppStore((s) => s.workspace);
  const categories = useAppStore((s) => s.categories);
  const setCategories = useAppStore((s) => s.setCategories);
  const user = useAppStore((s) => s.user);

  const templates = useMemo(() => buildTemplates(), []);
  const [start, setStart] = useState(templates[2].start); // default: last month
  const [end, setEnd] = useState(templates[2].end);
  const [rows, setRows] = useState<ExportRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);

  const familyId = workspace.mode === "family" ? workspace.familyId : undefined;
  const workspaceName = workspace.mode === "family" ? workspace.familyName : "Personal";
  const today = fmt(new Date());

  const load = useCallback(async () => {
    if (start > end) {
      setRows([]);
      setError("Start date is after end date.");
      setFetching(false);
      return;
    }
    setFetching(true);
    setError(null);
    try {
      const data = await api.exportVouchers({ familyId, start, end });
      setRows(buildRows(data, useAppStore.getState().categories));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setFetching(false);
    }
  }, [familyId, start, end]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    if (categories.length === 0) api.categories().then(setCategories).catch(() => {});
  }, [load, categories.length, setCategories]);

  const totals = useMemo(() => {
    let spent = 0;
    let earned = 0;
    for (const r of rows) {
      if (r.type === "expense") spent += r.amount;
      else earned += r.amount;
    }
    return { spent, earned };
  }, [rows]);

  const meta: ExportMeta = {
    workspace: workspaceName,
    isFamily: workspace.mode === "family",
    start,
    end,
    generatedBy: user?.name ?? user?.email ?? "—",
  };
  const fileBase = `hisabkitab-${workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${start}-to-${end}`;

  function downloadCsv() {
    setBusy("csv");
    try {
      triggerDownload(csvBlob(rowsToCsv(rows, meta)), `${fileBase}.csv`);
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    setBusy("pdf");
    setError(null);
    try {
      const { generatePdfBlob } = await import("@/lib/exportPdf");
      triggerDownload(await generatePdfBlob(rows, meta), `${fileBase}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build PDF");
    } finally {
      setBusy(null);
    }
  }

  const activeTemplate = templates.find((t) => t.start === start && t.end === end)?.id;
  const canExport = !fetching && rows.length > 0 && busy === null;

  return (
    <div className="min-h-dvh bg-stone-100">
      <AppBar title="Export data" leading={<BackButton />} />

      <div className="flex flex-col gap-4 px-4 pb-16 pt-4">
        {/* Active workspace */}
        <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              workspace.mode === "family" ? "bg-teal-50 text-teal-700" : "bg-stone-100 text-stone-600"
            }`}
          >
            {workspace.mode === "family" ? (
              <UsersRound className="h-5 w-5" strokeWidth={2} />
            ) : (
              <UserRound className="h-5 w-5" strokeWidth={2} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">Exporting</p>
            <p className="truncate text-sm font-bold text-stone-900">{workspaceName} workspace</p>
          </div>
        </div>

        {/* Time frame */}
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5">
          <h2 className="mb-3 text-sm font-bold text-stone-900">Time frame</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setStart(t.start);
                  setEnd(t.end);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeTemplate === t.id
                    ? "bg-teal-600 text-white"
                    : "bg-stone-100 text-stone-600 active:bg-stone-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">From</span>
              <input
                type="date"
                value={start}
                max={end || today}
                onChange={(e) => setStart(e.target.value)}
                className="h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-800 outline-none focus:border-teal-400 focus:bg-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">To</span>
              <input
                type="date"
                value={end}
                min={start}
                max={today}
                onChange={(e) => setEnd(e.target.value)}
                className="h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-800 outline-none focus:border-teal-400 focus:bg-white"
              />
            </label>
          </div>
        </section>

        {/* Preview summary */}
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5">
          {fetching ? (
            <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-extrabold text-stone-900">{rows.length}</p>
                <p className="text-xs text-stone-500">entries in range</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold text-red-600">−{taka(totals.spent)}</p>
                <p className="font-semibold text-emerald-600">+{taka(totals.earned)}</p>
              </div>
            </div>
          )}
        </section>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {/* Export actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={downloadCsv}
            disabled={!canExport}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-stone-700 shadow-sm ring-1 ring-stone-200 active:bg-stone-50 disabled:opacity-40"
          >
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" strokeWidth={2} />
            {busy === "csv" ? "Preparing…" : "CSV"}
          </button>
          <button
            onClick={() => void downloadPdf()}
            disabled={!canExport}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-teal-600/25 active:from-teal-700 disabled:opacity-40"
          >
            {busy === "pdf" ? (
              "Building PDF…"
            ) : (
              <>
                <FileText className="h-5 w-5" strokeWidth={2} /> PDF
              </>
            )}
          </button>
        </div>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-stone-400">
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          Downloads {rows.length} entr{rows.length === 1 ? "y" : "ies"} for the selected range
        </p>
      </div>
    </div>
  );
}

export default function ExportPage() {
  return (
    <AuthGate>
      <ExportView />
    </AuthGate>
  );
}
