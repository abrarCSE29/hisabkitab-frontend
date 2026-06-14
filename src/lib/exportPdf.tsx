/* Designed PDF report for the Export Data feature. Imported dynamically from the
   export page so @react-pdf/renderer stays out of the SSR/initial bundle.

   Light header (no filled banner), a graphical overview, then the transactions
   as a horizontal-lines-only table mirroring the CSV columns. */

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
const RULE = "#44403c";

const s = StyleSheet.create({
  page: { fontFamily: "Hind", fontSize: 10, color: INK, paddingHorizontal: 32, paddingTop: 28, paddingBottom: 48 },

  // Header (no filled background — a thin teal accent rule instead)
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandTick: { width: 4, height: 14, backgroundColor: TEAL, borderRadius: 2 },
  brand: { fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: 700, color: INK, marginTop: 4 },
  accentRule: { height: 2, backgroundColor: TEAL, marginTop: 8, marginBottom: 12, width: 54 },

  metaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  headerDivider: { height: 1, backgroundColor: LINE, marginBottom: 18 },
  metaItem: { width: "50%", marginBottom: 8 },
  metaLabel: { fontSize: 8, color: FAINT, textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 10, fontWeight: 700, color: INK, marginTop: 1 },

  // Overview visuals
  overview: { flexDirection: "row", gap: 18, marginBottom: 16 },
  figure: { flex: 1 },
  figLabel: { fontSize: 8, color: MUTE, textTransform: "uppercase", letterSpacing: 0.5 },
  figValue: { fontSize: 15, fontWeight: 700, marginTop: 2 },

  splitTrack: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: "#f5f5f4", marginBottom: 6 },
  legendRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 8, color: MUTE },

  section: { fontSize: 12, fontWeight: 700, color: INK, marginBottom: 10, marginTop: 4 },

  catRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  catLabel: { width: 110, fontSize: 9, color: INK },
  catTrack: { flex: 1, height: 8, backgroundColor: "#f5f5f4", borderRadius: 4, marginHorizontal: 8 },
  catFill: { height: 8, borderRadius: 4 },
  catAmount: { width: 80, textAlign: "right", fontSize: 9, fontWeight: 700 },

  // Transactions table — horizontal lines only
  tHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: RULE, paddingBottom: 5 },
  th: { fontSize: 8, fontWeight: 700, color: "#57534e", textTransform: "uppercase", letterSpacing: 0.3 },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 6 },
  td: { fontSize: 8.5, color: INK },
  tdMute: { fontSize: 8.5, color: MUTE },

  cDate: { width: 54, paddingRight: 4 },
  cType: { width: 42, paddingRight: 4 },
  cTitle: { flexGrow: 1.3, flexBasis: 0, paddingRight: 6 },
  cCat: { width: 70, paddingRight: 6 },
  cItems: { flexGrow: 1, flexBasis: 0, paddingRight: 6 },
  cBy: { width: 52, paddingRight: 4 },
  cAmt: { width: 64, textAlign: "right" },

  empty: { fontSize: 10, color: MUTE, marginTop: 4 },
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

function Header({ meta }: { meta: ExportMeta }) {
  return (
    <View>
      <View style={s.brandRow}>
        <View style={s.brandTick} />
        <Text style={s.brand}>হিসাবকিতাব · HISABKITAB</Text>
      </View>
      <Text style={s.title}>Financial Report</Text>
      <View style={s.accentRule} />
      <View style={s.metaGrid}>
        <View style={s.metaItem}>
          <Text style={s.metaLabel}>Workspace</Text>
          <Text style={s.metaValue}>{meta.workspace}</Text>
        </View>
        <View style={s.metaItem}>
          <Text style={s.metaLabel}>Time frame</Text>
          <Text style={s.metaValue}>
            {meta.start} → {meta.end}
          </Text>
        </View>
        <View style={s.metaItem}>
          <Text style={s.metaLabel}>Generated by</Text>
          <Text style={s.metaValue}>{meta.generatedBy}</Text>
        </View>
        <View style={s.metaItem}>
          <Text style={s.metaLabel}>Generated on</Text>
          <Text style={s.metaValue}>
            {new Date().toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
      <View style={s.headerDivider} />
    </View>
  );
}

function ReportDocument({ rows, meta }: { rows: ExportRow[]; meta: ExportMeta }) {
  const { spent, earned, net, byCategory } = summarize(rows);
  const maxCat = byCategory[0]?.total || 1;
  const flow = spent + earned || 1;

  return (
    <Document title="HisabKitab Financial Report">
      <Page size="A4" style={s.page}>
        <Header meta={meta} />

        {rows.length === 0 ? (
          <Text style={s.empty}>No transactions in this period.</Text>
        ) : (
          <>
            {/* Graphical overview */}
            <View style={s.overview}>
              <View style={s.figure}>
                <Text style={s.figLabel}>Total Expense</Text>
                <Text style={[s.figValue, { color: RED }]}>{money(spent)}</Text>
              </View>
              <View style={s.figure}>
                <Text style={s.figLabel}>Total Income</Text>
                <Text style={[s.figValue, { color: GREEN }]}>{money(earned)}</Text>
              </View>
              <View style={s.figure}>
                <Text style={s.figLabel}>Net</Text>
                <Text style={[s.figValue, { color: net >= 0 ? TEAL : "#1e3a8a" }]}>{money(net)}</Text>
              </View>
            </View>

            {/* Income vs expense proportion bar */}
            <View style={s.splitTrack}>
              <View style={{ width: `${(earned / flow) * 100}%`, backgroundColor: GREEN }} />
              <View style={{ width: `${(spent / flow) * 100}%`, backgroundColor: RED }} />
            </View>
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.dot, { backgroundColor: GREEN }]} />
                <Text style={s.legendText}>Income</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.dot, { backgroundColor: RED }]} />
                <Text style={s.legendText}>Expense</Text>
              </View>
            </View>

            {/* Category breakdown */}
            {byCategory.length > 0 && (
              <View wrap={false}>
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

            {/* Transactions table */}
            <Text style={s.section}>Transactions</Text>
            <View style={s.tHead}>
              <Text style={[s.th, s.cDate]}>Date</Text>
              <Text style={[s.th, s.cType]}>Type</Text>
              <Text style={[s.th, s.cTitle]}>Title</Text>
              <Text style={[s.th, s.cCat]}>Category</Text>
              <Text style={[s.th, s.cItems]}>Items</Text>
              {meta.isFamily && <Text style={[s.th, s.cBy]}>By</Text>}
              <Text style={[s.th, s.cAmt]}>Amount</Text>
            </View>
            {rows.map((r, i) => (
              <View key={i} style={s.tRow} wrap={false}>
                <Text style={[s.td, s.cDate]}>{r.dateLabel}</Text>
                <Text style={[s.td, s.cType, { color: r.type === "expense" ? RED : GREEN }]}>
                  {r.type === "expense" ? "Expense" : "Income"}
                </Text>
                <Text style={[s.td, s.cTitle]}>{r.title}</Text>
                <Text style={[s.tdMute, s.cCat]}>{r.category}</Text>
                <Text style={[s.tdMute, s.cItems]}>{r.items || "—"}</Text>
                {meta.isFamily && <Text style={[s.tdMute, s.cBy]}>{r.by ?? "—"}</Text>}
                <Text style={[s.td, s.cAmt, { fontWeight: 700, color: r.type === "expense" ? RED : GREEN }]}>
                  {r.type === "expense" ? "−" : "+"}
                  {taka(r.amount)}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={s.footer} fixed>
          <Text>HisabKitab · {meta.workspace}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function generatePdfBlob(rows: ExportRow[], meta: ExportMeta): Promise<Blob> {
  return pdf(<ReportDocument rows={rows} meta={meta} />).toBlob();
}
