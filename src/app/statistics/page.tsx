"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, TrendingUp, UserRound, UsersRound } from "lucide-react";
import AppBar, { BackButton } from "@/components/AppBar";
import AuthGate from "@/components/AuthGate";
import { api } from "@/lib/api";
import { resolveCategory } from "@/lib/categoryMeta";
import { taka } from "@/lib/format";
import type { CategoryTotal, VoucherStats } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

const TOP_SLICES = 6;
const OTHER_HEX = "#a8a29e";

// Recharts 3 types tooltip values broadly; accept that and coerce to currency.
type ChartValue = string | number | readonly (string | number)[];
const moneyTip = (value: ChartValue | undefined, name?: ChartValue): [string, string] => [
  taka(Number(value)),
  String(name ?? "Spent"),
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-bold text-stone-900">{children}</h2>;
}

// % change with an arrow, coloured by whether the move is *favourable*.
function Delta({ cur, prev, goodWhenUp }: { cur: number; prev: number; goodWhenUp: boolean }) {
  if (prev === 0) {
    return <span className="text-[11px] font-medium text-stone-400">— vs last month</span>;
  }
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  const up = pct >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        good ? "text-emerald-600" : "text-red-500"
      }`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {Math.abs(pct).toFixed(0)}% vs last month
    </span>
  );
}

function StatsView() {
  const workspace = useAppStore((s) => s.workspace);
  const categories = useAppStore((s) => s.categories);
  const setCategories = useAppStore((s) => s.setCategories);
  const [stats, setStats] = useState<VoucherStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const familyId = workspace.mode === "family" ? workspace.familyId : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.stats(familyId);
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    // load() flips `loading` on before awaiting; this runs on mount and when the
    // workspace (and thus `load`) changes — a one-shot fetch, not a render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // Categories scoped to the active workspace so custom labels/colors resolve.
    api.categories(undefined, familyId).then(setCategories).catch(() => {});
  }, [load, familyId, setCategories]);

  const categoryLabel = useCallback(
    (id: string | null) => (id ? resolveCategory(categories, id).nameBn : "Uncategorized"),
    [categories],
  );

  // Donut data: keep the top slices, roll the rest into "Other".
  const donut = useMemo(() => {
    if (!stats) return [] as { id: string | null; label: string; value: number; hex: string }[];
    const top = stats.by_category.slice(0, TOP_SLICES);
    const rest = stats.by_category.slice(TOP_SLICES);
    const slices = top.map((c: CategoryTotal) => ({
      id: c.category_id,
      label: categoryLabel(c.category_id),
      value: c.total,
      hex: resolveCategory(categories, c.category_id).hex,
    }));
    const otherTotal = rest.reduce((sum, c) => sum + c.total, 0);
    if (otherTotal > 0) {
      slices.push({ id: "__other", label: "Other", value: otherTotal, hex: OTHER_HEX });
    }
    return slices;
  }, [stats, categories, categoryLabel]);

  const isEmpty =
    stats !== null &&
    stats.month.spent === 0 &&
    stats.month.earned === 0 &&
    stats.trend.every((t) => t.income === 0 && t.expense === 0);

  return (
    <div className="min-h-dvh bg-stone-100">
      <AppBar
        title="Financial statistics"
        subtitle={stats?.month_label}
        leading={<BackButton />}
        trailing={
          <span className="mr-1 flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/30">
            {workspace.mode === "family" ? (
              <UsersRound className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            <span className="max-w-24 truncate">
              {workspace.mode === "family" ? workspace.familyName : "Personal"}
            </span>
          </span>
        }
      />

      <div className="flex flex-col gap-4 px-4 pb-16 pt-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        )}

        {!loading && stats && isEmpty && (
          <div className="mt-10 flex flex-col items-center gap-3 text-center text-stone-400">
            <TrendingUp className="h-10 w-10" strokeWidth={1.5} />
            <p className="text-sm">
              No data yet for <span className="font-semibold text-stone-600">{stats.month_label}</span>.
              <br />
              Log a few entries and your insights will appear here.
            </p>
          </div>
        )}

        {!loading && stats && !isEmpty && (
          <>
            {/* 1 · Month vs last month */}
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { label: "Spent", value: stats.month.spent, prev: stats.prev_month.spent, color: "text-red-600", goodWhenUp: false },
                  { label: "Earned", value: stats.month.earned, prev: stats.prev_month.earned, color: "text-emerald-600", goodWhenUp: true },
                  { label: "Net", value: stats.month.net, prev: stats.prev_month.net, color: stats.month.net >= 0 ? "text-blue-600" : "text-blue-900", goodWhenUp: true },
                ] as const
              ).map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm shadow-stone-900/5"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    {c.label}
                  </p>
                  <p className={`mt-1 truncate text-lg font-extrabold ${c.color}`}>
                    {c.value < 0 ? `−${taka(Math.abs(c.value))}` : taka(c.value)}
                  </p>
                  <div className="mt-1">
                    <Delta cur={c.value} prev={c.prev} goodWhenUp={c.goodWhenUp} />
                  </div>
                </div>
              ))}
            </div>

            {/* 2 · Category donut */}
            {donut.length > 0 && (
              <Card>
                <SectionTitle>Where it went · {stats.month_label}</SectionTitle>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative mx-auto h-60 w-full max-w-[16rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donut}
                          dataKey="value"
                          nameKey="label"
                          innerRadius="58%"
                          outerRadius="88%"
                          paddingAngle={2}
                          stroke="none"
                        >
                          {donut.map((slice) => (
                            <Cell key={slice.id ?? "x"} fill={slice.hex} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={moneyTip}
                          contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e7e5e4" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[11px] font-medium uppercase text-stone-400">Total</span>
                      <span className="text-lg font-extrabold text-stone-900">
                        {taka(stats.month.spent)}
                      </span>
                    </div>
                  </div>
                  <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
                    {donut.map((slice) => {
                      const pct = stats.month.spent > 0 ? (slice.value / stats.month.spent) * 100 : 0;
                      return (
                        <li key={slice.id ?? "x"} className="flex items-center gap-2 text-xs">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: slice.hex }}
                          />
                          <span className="min-w-0 flex-1 truncate text-stone-600">{slice.label}</span>
                          <span className="shrink-0 font-semibold text-stone-900">{taka(slice.value)}</span>
                          <span className="w-8 shrink-0 text-right text-stone-400">{pct.toFixed(0)}%</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Card>
            )}

            {/* 3 · 6-month income vs expense */}
            <Card>
              <SectionTitle>Last 6 months</SectionTitle>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.trend} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#78716c" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#f5f5f4" }}
                      formatter={moneyTip}
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e7e5e4" }}
                    />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex justify-center gap-4 text-[11px] font-medium text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Income
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Expense
                </span>
              </div>
            </Card>

            {/* 4 · Day-of-week pattern */}
            {stats.by_weekday.some((d) => d.total > 0) && (
              <Card>
                <SectionTitle>Spending by day of week</SectionTitle>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.by_weekday} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#78716c" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f5f5f4" }}
                        formatter={moneyTip}
                        contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e7e5e4" }}
                      />
                      <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* 5 · Spending heatmap (calendar) */}
            {stats.by_day.some((d) => d.total > 0) && (
              <Card>
                <SectionTitle>Daily spending · {stats.month_label}</SectionTitle>
                <Heatmap stats={stats} />
              </Card>
            )}

            {/* 6 · Top 5 expenses */}
            {stats.top_expenses.length > 0 && (
              <Card>
                <SectionTitle>Biggest expenses this month</SectionTitle>
                <ul className="flex flex-col gap-2">
                  {stats.top_expenses.map((e, i) => (
                    <li key={e.id} className="flex items-center gap-3">
                      <span className="w-4 shrink-0 text-center text-xs font-bold text-stone-400">
                        {i + 1}
                      </span>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-lg">
                        {resolveCategory(categories, e.category_id).emoji}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-700">
                        {e.heading?.trim() || categoryLabel(e.category_id)}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-red-600">{taka(e.total)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* 7 · Family member breakdown (family workspace only) */}
            {workspace.mode === "family" && stats.by_member.length > 0 && (
              <Card>
                <SectionTitle>Who spent what · {stats.month_label}</SectionTitle>
                <ul className="flex flex-col gap-2.5">
                  {stats.by_member.map((m) => {
                    const top = stats.by_member[0]?.total || 1;
                    return (
                      <li key={m.user_id} className="flex flex-col gap-1">
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="truncate font-medium text-stone-700">
                            {m.user_name ?? "Member"}
                          </span>
                          <span className="shrink-0 font-bold text-stone-900">{taka(m.total)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                            style={{ width: `${Math.max(4, (m.total / top) * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Five discrete spending levels: 0 = nothing, 1–4 = light→dark teal. Stepped
// (rather than a smooth gradient) so neighbouring days read as clearly different.
const LEVEL_BG = ["#f5f5f4", "#99f6e4", "#2dd4bf", "#0d9488", "#115e59"];
const LEVEL_TEXT = [
  "text-stone-400",
  "text-stone-700",
  "text-stone-800",
  "text-white",
  "text-white",
];

// total === 0 -> level 0; otherwise quartile of the busiest day -> level 1..4.
function spendLevel(total: number, max: number): number {
  if (total <= 0) return 0;
  return 1 + Math.min(3, Math.floor((total / max) * 4));
}

// Calendar heatmap: a 7-col grid (Sat→Fri) where darker = spent more that day.
function Heatmap({ stats }: { stats: VoucherStats }) {
  const now = new Date();
  const firstDow = new Date(now.getFullYear(), now.getMonth(), 1).getDay(); // 0=Sun
  const leadBlanks = (firstDow + 1) % 7; // shift so Saturday is the first column
  const max = Math.max(...stats.by_day.map((d) => d.total), 1);

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-stone-400">
        {["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadBlanks }).map((_, i) => (
          <span key={`b${i}`} />
        ))}
        {stats.by_day.map((d) => {
          const level = spendLevel(d.total, max);
          const isToday = d.day === stats.today;
          return (
            <div
              key={d.day}
              title={d.total > 0 ? `${d.day}: ${taka(d.total)}` : `${d.day}: —`}
              className={`flex aspect-square items-center justify-center rounded-md text-[10px] font-medium ${LEVEL_TEXT[level]} ${
                isToday ? "ring-2 ring-teal-600" : ""
              }`}
              style={{ backgroundColor: LEVEL_BG[level] }}
            >
              {d.day}
            </div>
          );
        })}
      </div>

      {/* Legend so the colour scale is self-explanatory */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-medium text-stone-400">
        <span>Less</span>
        {LEVEL_BG.map((bg) => (
          <span
            key={bg}
            className="h-3 w-3 rounded-sm ring-1 ring-inset ring-stone-200"
            style={{ backgroundColor: bg }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  return (
    <AuthGate>
      <StatsView />
    </AuthGate>
  );
}
