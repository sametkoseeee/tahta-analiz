"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compact, num, periodLabel } from "@/lib/format";
import type { Financials, Statement } from "@/lib/types";

const get = (s: Statement, label: string) => s.rows.find((r) => r.label === label)?.values;

const tooltipStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };
const axisTick = { fontSize: 11, fill: "var(--muted)" };

export default function FinancialCharts({ company }: { company: Financials }) {
  const [mode, setMode] = useState<"quarterly" | "annual">("quarterly");
  const inc = company.statements[mode].income;
  const annual = mode === "annual";
  const rev = get(inc, "Hasılat");
  const gross = get(inc, "Brüt Kâr");
  const ebitda = get(inc, "FAVÖK");
  const net = get(inc, "Ana Ortaklık Net Kârı");
  const cur = company.financialCurrency;

  const data = inc.periods.map((p, i) => {
    const r = rev?.[i] ?? null;
    const ratio = (v: number | null | undefined) => (r && v != null ? (v / r) * 100 : null);
    return {
      p: periodLabel(p, annual),
      hasilat: r,
      netKar: net?.[i] ?? null,
      brut: ratio(gross?.[i]),
      favok: ratio(ebitda?.[i]),
      net: ratio(net?.[i]),
    };
  });

  if (data.length === 0) return null;
  const hasRevenue = data.some((d) => d.hasilat != null);

  return (
    <section className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Finansal Görünüm</h2>
        <div className="flex rounded-lg bg-surface-2 p-0.5 text-xs">
          {(["quarterly", "annual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-2.5 py-1 ${mode === m ? "bg-surface font-semibold shadow-sm" : "text-muted"}`}
            >
              {m === "quarterly" ? "Çeyreklik" : "Yıllık"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm text-muted">Hasılat ve net kâr ({cur})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="p" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => compact(v)} width={60} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => compact(Number(v))} cursor={{ fill: "var(--surface-2)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {hasRevenue && <Bar dataKey="hasilat" name="Hasılat" fill="var(--accent)" radius={[3, 3, 0, 0]} />}
                <Bar dataKey="netKar" name="Net Kâr" fill="var(--up)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {hasRevenue && (
          <div>
            <h3 className="mb-2 text-sm text-muted">Kâr marjları (%)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="p" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => `%${num(v, 0)}`} width={44} tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `%${num(Number(v), 1)}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line dataKey="brut" name="Brüt" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line dataKey="favok" name="FAVÖK" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line dataKey="net" name="Net" stroke="var(--up)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
