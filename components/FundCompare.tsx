"use client";

import Link from "next/link";
import { useMemo } from "react";
import { COMPARE_COLORS, useSelectedCodes, useSeries } from "@/lib/compare";
import { changeClass, compact, fundPrice, num, signedPct } from "@/lib/format";
import type { FundSummary } from "@/lib/types";
import CompareChart from "./CompareChart";
import ComparePicker from "./ComparePicker";

export type FundLite = Omit<FundSummary, "spark"> & { spark?: undefined };

const ROWS: { label: string; get: (f: FundLite) => string; cls?: (f: FundLite) => string }[] = [
  { label: "Fon türü", get: (f) => f.umbrella?.replace(/\s*Şemsiye Fonu$/i, "") ?? "–" },
  { label: "Portföy şirketi", get: (f) => f.founder ?? "–" },
  { label: "Fiyat", get: (f) => `${fundPrice(f.price)} ₺` },
  ...(
    [
      ["Günlük", "change"],
      ["1 Ay", "r1m"],
      ["3 Ay", "r3m"],
      ["6 Ay", "r6m"],
      ["Yılbaşından beri", "rytd"],
      ["1 Yıl", "r1y"],
      ["3 Yıl", "r3y"],
      ["5 Yıl", "r5y"],
    ] as const
  ).map(([label, k]) => ({ label, get: (f: FundLite) => signedPct(f[k]), cls: (f: FundLite) => changeClass(f[k]) })),
  { label: "Portföy büyüklüğü", get: (f) => `${compact(f.size)} ₺` },
  { label: "Yatırımcı sayısı", get: (f) => num(f.investors, 0) },
  { label: "Risk değeri", get: (f) => (f.risk ? `${f.risk} / 7` : "–") },
];

export default function FundCompare({ funds }: { funds: FundLite[] }) {
  const byCode = useMemo(() => new Map(funds.map((f) => [f.code, f])), [funds]);
  const { codes, add, remove } = useSelectedCodes(useMemo(() => new Set(byCode.keys()), [byCode]));
  const { series } = useSeries("fon", codes);
  const selected = codes.map((c) => byCode.get(c)!);

  return (
    <div className="space-y-4">
      <ComparePicker items={funds} selected={codes} onAdd={add} onRemove={remove} placeholder="Fon ekle (kod ya da ad)" />
      <CompareChart series={series} colors={series.map((s) => COMPARE_COLORS[codes.indexOf(s.code)])} />
      {selected.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left font-medium" />
                {selected.map((f, i) => (
                  <th key={f.code} className="min-w-24 px-2 py-2.5 text-right font-medium sm:min-w-32 sm:px-3">
                    <Link href={`/fonlar/${f.code}`} className="font-semibold" style={{ color: COMPARE_COLORS[i] }}>
                      {f.code}
                    </Link>
                    <div className="ml-auto max-w-24 truncate font-normal sm:max-w-40" title={f.name}>
                      {f.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="group border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="sticky left-0 z-10 min-w-24 max-w-28 bg-surface px-3 py-2 leading-snug text-muted group-hover:bg-surface-2 sm:max-w-none sm:whitespace-nowrap">
                    {r.label}
                  </td>
                  {selected.map((f) => (
                    <td key={f.code} className={`px-2 py-2 text-right sm:px-3 ${r.cls?.(f) ?? ""}`}>
                      {r.get(f)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
