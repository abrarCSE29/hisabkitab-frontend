// Shared types + CSV builder for the Export Data feature. The PDF generator
// (lib/exportPdf.tsx) consumes the same ExportRow/ExportMeta shapes.

export interface ExportRow {
  iso: string;
  dateLabel: string; // "12 Jun 2026"
  type: "income" | "expense";
  title: string;
  category: string; // human label
  items: string; // joined item names
  amount: number;
  by: string | null; // creator name (family workspace)
  colorHex: string; // category accent
}

export interface ExportMeta {
  workspace: string;
  isFamily: boolean;
  start: string; // "YYYY-MM-DD"
  end: string;
  generatedBy: string;
}

function esc(value: string | number): string {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rowsToCsv(rows: ExportRow[], meta: ExportMeta): string {
  const headers = ["Date", "Type", "Title", "Category", "Items", "Amount (BDT)"];
  if (meta.isFamily) headers.push("Logged by");

  const lines = [headers.map(esc).join(",")];
  for (const r of rows) {
    const cells: (string | number)[] = [
      r.dateLabel,
      r.type === "expense" ? "Expense" : "Income",
      r.title,
      r.category,
      r.items,
      r.amount.toFixed(2),
    ];
    if (meta.isFamily) cells.push(r.by ?? "");
    lines.push(cells.map(esc).join(","));
  }
  return lines.join("\r\n");
}

// Prefix a BOM so Excel opens UTF-8 (Bengali) correctly.
export function csvBlob(text: string): Blob {
  return new Blob(["﻿", text], { type: "text/csv;charset=utf-8;" });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
