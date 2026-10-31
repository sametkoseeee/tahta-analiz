"use client";

import { useState } from "react";
import { changeClass, compact, signedPct } from "@/lib/format";
import { formatMetric, METRIC_MAP } from "@/lib/metrics";
import type { SectorStat } from "@/lib/sectors";
import type { MetricKey } from "@/lib/types";

const COLS: MetricKey[] = ["pe", "pb", "evEbitda", "roe", "netMargin", "dividendYield", "change1y"];
type Key = "sector" | "count" | "marketCap" | "change" | (typeof COLS)[number];

/** Piyasa sayfası: sektörlerin toplam piyasa değeri, günlük değişimi ve oran medyanları */
export default function SectorTable({ stats }: { stats: SectorStat[] }) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "marketCap", dir: -1 });
  const value = (s: SectorStat, k: Key): number | string | null =>
    k === "sector" ? s.sector : k === "count" ? s.count : k === "marketCap" ? s.marketCap : k === "change" ? s.change : (s.median as Record<string, number | null>)[k] ?? null;
  const rows = [...stats].sort((a, b) => {
    const va = value(a, sort.key);
    const vb = value(b, sort.key);
    if (va == null) return 1;
    if (vb == null) return -1;
    return (typeof va === "string" ? va.localeCompare(String(vb), "tr") : va - (vb as number)) * sort.dir;
  });
  const th = (k: Key, label: string, title?: string, left = false) => (
    <th key={k} title={title} className={`whitespace-nowrap px-3 py-2.5 font-medium ${left ? "sticky left-0 z-10 bg-surface text-left" : "text-right"}`}>
      <button
        onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? ((s.dir * -1) as 1 | -1) : k === "sector" ? 1 : -1 }))}
        className={`hover:text-text ${sort.key === k ? "text-text" : ""}`}
      >
        {label}
        {sort.key === k && <span className="ml-1 text-[10px]">{sort.dir === 1 ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
  return (
    <section className="card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              {th("sector", "Sektör", undefined, true)}
              {th("count", "Şirket")}
              {th("marketCap", "Piy. Değ.")}
              {th("change", "Gün %", "Piyasa değeri ağırlıklı günlük değişim")}
              {COLS.map((k) => th(k, METRIC_MAP[k].short, `${METRIC_MAP[k].label} (medyan)`))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.sector} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="sticky left-0 z-10 max-w-48 truncate bg-surface px-3 py-2 font-medium">{s.sector}</td>
                <td className="px-3 py-2 text-right">{s.count}</td>
                <td className="px-3 py-2 text-right">{compact(s.marketCap)}</td>
                <td className={`px-3 py-2 text-right ${changeClass(s.change)}`}>{signedPct(s.change)}</td>
                {COLS.map((k) => {
                  const v = (s.median as Record<string, number | null>)[k] ?? null;
                  return (
                    <td key={k} className={`whitespace-nowrap px-3 py-2 text-right ${k === "change1y" ? changeClass(v) : ""}`}>
                      {formatMetric(k, v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 text-xs text-muted">
        Oranlar sektördeki şirketlerin medyanıdır (ortadaki değer); zarar eden şirketlerin F/K ve FD/FAVÖK&apos;ü hesaba
        katılmaz. Günlük değişim piyasa değeri ağırlıklıdır.
      </p>
    </section>
  );
}
