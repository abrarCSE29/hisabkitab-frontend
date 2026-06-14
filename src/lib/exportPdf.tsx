/* Designed PDF report for the Export Data feature. Imported dynamically from the
   export page so @react-pdf/renderer stays out of the SSR/initial bundle.

   Deliberately card/section based — no grid tables — with a brand header,
   summary cards, category bars, and grouped transaction rows. */

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { taka } from "@/lib/format";
import type { ExportMeta, ExportRow } from "@/lib/exportData";

// Hind Siliguri covers Latin, Bengali and the ৳ sign in one family.
Font.register({
  family: "Hind",
  fonts: [
    { src: "/fonts/HindSiliguri-Regular.ttf" },
    { src: "/fonts/HindSiliguri-Bold.ttf", fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]); // don't hyphenate Bengali

const TEAL = "#0d9488";
const RED = "#dc2626";
const GREEN = "#059669";
const INK = "#1c1917";
const MUTE = "#78716c";
const FAINT = "#a8a29e";
const LINE = "#e7e5e4";

const s = StyleSheet.create({
  page: { fontFamily: "Hind", fontSize: 10, color: INK, paddingBottom: 48 },

  header: { backgroundColor: TEAL, paddingHorizontal: 32, paddingTop: 28, paddingBottom: 22 },
  brand: { color: "#ccfbf1", fontSize: 11, fontWeight: 700, letterSpacing: 1 },
  title: { color: "#ffffff", fontSize: 22, fontWeight: 700, marginTop: 2 },
  headerMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  headerLabel: { color: "#a7f3d0", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  headerValue: { color: "#ffffff", fontSize: 11, fontWeight: 700, marginTop: 1 },

  body: { paddingHorizontal: 32, paddingTop: 20 },

  cards: { flexDirection: "row", gap: 10, marginBottom: 24 },
  card: { flex: 1, borderRadius: 10, padding: 12, border: `1pt solid ${LINE}` },
  cardLabel: { fontSize: 8, color: MUTE, textTransform: "uppercase", letterSpacing: 0.5 },
  cardValue: { fontSize: 15, fontWeight: 700, marginTop: 4 },

  section: { fontSize: 12, fontWeight: 700, color: INK, marginBottom: 10 },

  catRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  catLabel: { width: 96, fontSize: 9, color: INK },
  catTrack: { flex: 1, height: 8, backgroundColor: "#f5f5f4", borderRadius: 4, marginHorizontal: 8 },
  catFill: { height: 8, borderRadius: 4 },
  catAmount: { width: 78, textAlign: "right", fontSize: 9, fontWeight: 700 },

  dayLabel: { fontSize: 8, fontWeight: 700, color: FAINT, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  entry: { flexDirection: "row", alignItems: "center", borderRadius: 8, border: `1pt solid ${LINE}`, padding: 9, marginBottom: 6 },
  accent: { width: 4, height: 30, borderRadius: 2, marginRight: 10 },
  entryTitle: { fontSize: 10, fontWeight: 700, color: INK },
  entrySub: { fontSize: 8, color: MUTE, marginTop: 2 },
  entryAmount: { fontSize: 11, fontWeight: 700, marginLeft: 8 },

  empty: { textAlign: "center", color: MUTE, marginTop: 40, fontSize: 11 },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", color: FAINT, fontSize: 8 },
});

function money(value: number): string {
  return value < 0 ? `−${taka(Math.abs(value))}` : taka(value);
}

interface CatBucket {
  label: string;
  total: number;
  color: string;
}

function summarize(rows: ExportRow[]) {
  let spent = 0;
  let earned = 0;
  const cats = new Map<string, CatBucket>();
  for (const r of rows) {
    if (r.type === "expense") {
      spent += r.amount;
      const bucket = cats.get(r.category) ?? { label: r.category, total: 0, color: r.colorHex };
      bucket.total += r.amount;
      cats.set(r.category, bucket);
    } else {
      earned += r.amount;
    }
  }
  const byCategory = [...cats.values()].sort((a, b) => b.total - a.total).slice(0, 8);
  return { spent, earned, net: earned - spent, byCategory };
}

function groupByDay(rows: ExportRow[]): { day: string; entries: ExportRow[] }[] {
  const groups: { day: string; entries: ExportRow[] }[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last.day === r.dateLabel) last.entries.push(r);
    else groups.push({ day: r.dateLabel, entries: [r] });
  }
  return groups;
}

function ReportDocument({ rows, meta }: { rows: ExportRow[]; meta: ExportMeta }) {
  const { spent, earned, net, byCategory } = summarize(rows);
  const maxCat = byCategory[0]?.total || 1;
  const groups = groupByDay(rows);

  return (
    <Document title="HisabKitab Expense Report">
      <Page size="A4" style={s.page}>
        {/* Brand header */}
        <View style={s.header}>
          <Text style={s.brand}>হিসাবকিতাব · HISABKITAB</Text>
          <Text style={s.title}>Expense Report</Text>
          <View style={s.headerMeta}>
            <View>
              <Text style={s.headerLabel}>Workspace</Text>
              <Text style={s.headerValue}>{meta.workspace}</Text>
            </View>
            <View>
              <Text style={s.headerLabel}>Period</Text>
              <Text style={s.headerValue}>
                {meta.start} → {meta.end}
              </Text>
            </View>
            <View>
              <Text style={s.headerLabel}>Entries</Text>
              <Text style={s.headerValue}>{rows.length}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* Summary cards */}
          <View style={s.cards}>
            <View style={s.card}>
              <Text style={s.cardLabel}>Total Expense</Text>
              <Text style={[s.cardValue, { color: RED }]}>{money(spent)}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>Total Income</Text>
              <Text style={[s.cardValue, { color: GREEN }]}>{money(earned)}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>Net</Text>
              <Text style={[s.cardValue, { color: net >= 0 ? TEAL : "#1e3a8a" }]}>{money(net)}</Text>
            </View>
          </View>

          {rows.length === 0 && (
            <Text style={s.empty}>No transactions in this period.</Text>
          )}

          {/* Category breakdown bars */}
          {byCategory.length > 0 && (
            <View>
              <Text style={s.section}>Spending by category</Text>
              {byCategory.map((c) => (
                <View key={c.label} style={s.catRow} wrap={false}>
                  <Text style={s.catLabel}>{c.label}</Text>
                  <View style={s.catTrack}>
                    <View
                      style={[
                        s.catFill,
                        { width: `${Math.max(3, (c.total / maxCat) * 100)}%`, backgroundColor: c.color },
                      ]}
                    />
                  </View>
                  <Text style={s.catAmount}>{taka(c.total)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Transactions, grouped by day */}
          {groups.length > 0 && (
            <View style={{ marginTop: 18 }}>
              <Text style={s.section}>Transactions</Text>
              {groups.map((g) => (
                <View key={g.day} wrap={false}>
                  <Text style={s.dayLabel}>{g.day}</Text>
                  {g.entries.map((e, i) => (
                    <View key={`${g.day}-${i}`} style={s.entry} wrap={false}>
                      <View style={[s.accent, { backgroundColor: e.colorHex }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.entryTitle}>{e.title}</Text>
                        <Text style={s.entrySub}>
                          {e.category}
                          {e.items ? ` · ${e.items}` : ""}
                          {meta.isFamily && e.by ? ` · by ${e.by}` : ""}
                        </Text>
                      </View>
                      <Text style={[s.entryAmount, { color: e.type === "expense" ? RED : GREEN }]}>
                        {e.type === "expense" ? "−" : "+"}
                        {taka(e.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={s.footer} fixed>
          <Text>Generated by HisabKitab · {new Date().toLocaleDateString("en-GB")}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function generatePdfBlob(rows: ExportRow[], meta: ExportMeta): Promise<Blob> {
  return pdf(<ReportDocument rows={rows} meta={meta} />).toBlob();
}
