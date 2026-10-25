"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COMPARE_COLORS, type Series } from "@/lib/compare";
import { changeClass, num, signedPct } from "@/lib/format";

const RANGES = [
  { label: "1A", months: 1 },
  { label: "3A", months: 3 },
  { label: "6A", months: 6 },
  { label: "1Y", months: 12 },
  { label: "3Y", months: 36 },
  { label: "5Y", months: 60 },
];

const monthFmt = new Intl.DateTimeFormat("tr-TR", { month: "short", year: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });

/**
 * Seçili serileri aynı başlangıca (100) endeksler: farklı fiyat düzeyindeki hisse/fonların
 * dönem içindeki getirisi yan yana okunur.
 */
export default function CompareChart({ series, colors }: { series: Series[]; colors: string[] }) {
  const [range, setRange] = useState("1Y");
  const months = RANGES.find((r) => r.label === range)!.months;

  const { data, returns } = useMemo(() => {
    if (!series.length) return { data: [], returns: {} as Record<string, number | null> };
    const last = series.map((s) => s.prices.at(-1)?.d ?? "").sort().pop()!;
    const start = new Date(last);
    start.setMonth(start.getMonth() - months);
    const from = start.toISOString().slice(0, 10);
    // Tarih → her serinin o günkü değeri; başlangıç: seriye ait aralıktaki ilk fiyat
    const rows = new Map<string, Record<string, number | string>>();
    const returns: Record<string, number | null> = {};
    series.forEach((s) => {
      const pts = s.prices.filter((p) => p.d >= from);
      if (pts.length < 2) {
        returns[s.code] = null;
        return;
      }
      const base = pts[0].c;
      returns[s.code] = pts[pts.length - 1].c / base - 1;
      pts.forEach((p) => {
        const row = rows.get(p.d) ?? { d: p.d };
        row[s.code] = Math.round((p.c / base) * 10000) / 100;
        rows.set(p.d, row);
      });
    });
    return { data: [...rows.values()].sort((a, b) => String(a.d).localeCompare(String(b.d))), returns };
  }, [series, months]);

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted">Başlangıç = 100</div>
        <div className="flex rounded-lg bg-surface-2 p-0.5 text-xs">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`rounded-md px-2.5 py-1 ${range === r.label ? "bg-surface font-semibold shadow-sm" : "text-muted"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {data.length < 2 ? (
        <div className="grid h-72 place-items-center text-sm text-muted">Grafik için seçim yap.</div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="d"
                tickFormatter={(d: string) => monthFmt.format(new Date(d))}
                minTickGap={40}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                orientation="right"
                width={44}
                tickFormatter={(v: number) => num(v, 0)}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(d) => dayFmt.format(new Date(String(d)))}
                formatter={(v, name) => [num(Number(v), 1), String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {series.map((s, i) => (
                <Line
                  key={s.code}
                  type="monotone"
                  dataKey={s.code}
                  stroke={colors[i] ?? COMPARE_COLORS[i]}
                  strokeWidth={1.75}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {series.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {series.map((s, i) => (
            <span key={s.code} className="tabular">
              <span className="font-semibold" style={{ color: colors[i] ?? COMPARE_COLORS[i] }}>
                {s.code}
              </span>{" "}
              <span className={changeClass(returns[s.code])}>{signedPct(returns[s.code])}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
