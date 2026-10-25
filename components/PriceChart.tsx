"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { changeClass, fundPrice, num, signedPct } from "@/lib/format";
import { useLive } from "@/lib/live";
import type { PricePoint } from "@/lib/types";

const RANGES = [
  { label: "1A", days: 21 },
  { label: "3A", days: 63 },
  { label: "6A", days: 126 },
  { label: "1Y", days: 252 },
  { label: "3Y", days: 756 },
  { label: "5Y", days: Infinity },
];

const monthFmt = new Intl.DateTimeFormat("tr-TR", { month: "short", year: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });

export default function PriceChart({
  code,
  prices: base,
  live = true,
  label = "Kapanış",
}: {
  code: string;
  prices: Pick<PricePoint, "d" | "c">[];
  /** Hisseler için seans içi fiyatı ekler; fonlarda kapalı */
  live?: boolean;
  label?: string;
}) {
  const [range, setRange] = useState("1Y");
  const days = RANGES.find((r) => r.label === range)!.days;
  const quote = useLive().quotes[code];
  const q = live ? quote : undefined;
  // Seans içi güncel fiyat: bugünün noktasını ekle ya da güncelle
  const prices = useMemo(() => {
    if (!q || base.length === 0) return base;
    const today = new Date(q.t).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
    const last = base[base.length - 1];
    if (last.d === today) return [...base.slice(0, -1), { ...last, c: q.p }];
    return last.d < today ? [...base, { d: today, c: q.p }] : base;
  }, [base, q]);
  const data = useMemo(() => (days === Infinity ? prices : prices.slice(-days)), [prices, days]);

  if (data.length < 2) return <div className="p-6 text-sm text-muted">Fiyat verisi yok.</div>;

  const first = data[0].c;
  const lastP = data[data.length - 1].c;
  const change = (lastP - first) / first;
  const color = change >= 0 ? "var(--up)" : "var(--down)";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="text-muted">Dönem getirisi </span>
          <span className={`font-semibold ${changeClass(change)}`}>{signedPct(change)}</span>
        </div>
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
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="pfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              width={56}
              tickFormatter={(v: number) => num(v, v < 10 ? 2 : 0)}
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(d) => dayFmt.format(new Date(String(d)))}
              formatter={(v) => [`${fundPrice(Number(v))} ₺`, label]}
            />
            <Area type="monotone" dataKey="c" stroke={color} strokeWidth={1.75} fill="url(#pfill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
