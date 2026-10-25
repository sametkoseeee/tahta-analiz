"use client";

import Link from "next/link";
import { useMemo } from "react";
import { COMPARE_COLORS, useSelectedCodes, useSeries } from "@/lib/compare";
import { changeClass } from "@/lib/format";
import { useLiveCompanies } from "@/lib/live";
import { formatMetric, METRIC_MAP } from "@/lib/metrics";
import type { Metrics, MetricKey } from "@/lib/types";
import CompareChart from "./CompareChart";
import ComparePicker from "./ComparePicker";

export type StockLite = { code: string; name: string; sector: string; metrics: Metrics };

const GROUPS: { title: string; keys: MetricKey[] }[] = [
  { title: "Fiyat", keys: ["price", "change", "change1y", "marketCap"] },
  { title: "Değerleme", keys: ["pe", "pb", "evEbitda", "ps", "dividendYield", "fcfYield"] },
  { title: "Kârlılık", keys: ["roe", "roa", "grossMargin", "ebitdaMargin", "netMargin"] },
  { title: "Büyüme", keys: ["revenueGrowth", "netIncomeGrowth"] },
  { title: "Borçluluk", keys: ["debtToEquity", "netDebtEbitda", "currentRatio"] },
];
const CHANGE_KEYS = new Set<MetricKey>(["change", "change1y", "revenueGrowth", "netIncomeGrowth"]);

export default function StockCompare({ stocks }: { stocks: StockLite[] }) {
  const byCode = useMemo(() => new Map(stocks.map((s) => [s.code, s])), [stocks]);
  const { codes, add, remove } = useSelectedCodes(useMemo(() => new Set(byCode.keys()), [byCode]));
  const { series } = useSeries("hisse", codes);
  // Seans içi güncel fiyatlarla oranlar yeniden hesaplanır
  const selected = useLiveCompanies(useMemo(() => codes.map((c) => byCode.get(c)!), [codes, byCode]));

  return (
    <div className="space-y-4">
      <ComparePicker items={stocks} selected={codes} onAdd={add} onRemove={remove} placeholder="Hisse ekle (kod ya da şirket adı)" />
      <CompareChart series={series} colors={series.map((s) => COMPARE_COLORS[codes.indexOf(s.code)])} />
      {selected.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left font-medium" />
                {selected.map((s, i) => (
                  <th key={s.code} className="min-w-20 px-2 py-2.5 text-right font-medium sm:min-w-28 sm:px-3">
                    <Link href={`/sirketler/${s.code}`} className="font-semibold" style={{ color: COMPARE_COLORS[i] }}>
                      {s.code}
                    </Link>
                    <div className="ml-auto max-w-20 truncate font-normal sm:max-w-36" title={s.name}>
                      {s.sector}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {GROUPS.map((g) => (
              <tbody key={g.title}>
                <tr className="bg-surface-2/60">
                  <td colSpan={selected.length + 1} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                    {g.title}
                  </td>
                </tr>
                {g.keys.map((k) => (
                    <tr key={k} className="group border-b border-border last:border-0 hover:bg-surface-2">
                      <td
                        className="sticky left-0 z-10 min-w-24 max-w-28 bg-surface px-3 py-2 leading-snug text-muted group-hover:bg-surface-2 sm:max-w-none sm:whitespace-nowrap"
                        title={METRIC_MAP[k].hint}
                      >
                        {METRIC_MAP[k].label}
                      </td>
                      {selected.map((s) => (
                        <td
                          key={s.code}
                          className={`whitespace-nowrap px-2 py-2 text-right sm:px-3 ${CHANGE_KEYS.has(k) ? changeClass(s.metrics[k]) : ""}`}
                        >
                          {formatMetric(k, s.metrics[k])}
                        </td>
                      ))}
                    </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  );
}
