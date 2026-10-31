"use client";

import Link from "next/link";
import { changeClass, num, signedPct } from "@/lib/format";
import { useLiveCompanies } from "@/lib/live";
import type { HeatItem } from "./Heatmap";

/** Zirveye / dibe bu kadar yakın olanlar listelenir */
const NEAR = 0.02;

function List({ title, hint, items, kind }: { title: string; hint: string; items: HeatItem[]; kind: "high" | "low" }) {
  return (
    <section className="card">
      <div className="border-b border-border p-3">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Hisse</th>
              <th className="px-3 py-2 text-right font-medium">Fiyat</th>
              <th className="whitespace-nowrap px-3 py-2 text-right font-medium">{kind === "high" ? "52H zirve" : "52H dip"}</th>
              <th className="px-3 py-2 text-right font-medium">Gün %</th>
              <th className="px-3 py-2 text-right font-medium">1Y %</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.code} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-3 py-2">
                  <Link href={`/sirketler/${c.code}`} className="font-semibold text-accent hover:underline">
                    {c.code}
                  </Link>
                  <div className="max-w-40 truncate text-xs text-muted sm:max-w-60">{c.name}</div>
                </td>
                <td className="px-3 py-2 text-right">{num(c.metrics.price)}</td>
                <td className="px-3 py-2 text-right text-muted">{num(kind === "high" ? c.metrics.high52 : c.metrics.low52)}</td>
                <td className={`px-3 py-2 text-right ${changeClass(c.metrics.change)}`}>{signedPct(c.metrics.change)}</td>
                <td className={`px-3 py-2 text-right ${changeClass(c.metrics.change1y)}`}>{signedPct(c.metrics.change1y)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  Şu an listede hisse yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Piyasa sayfası: 52 haftanın zirvesine / dibine yakın hisseler */
export default function HighLow({ companies: base }: { companies: HeatItem[] }) {
  const companies = useLiveCompanies(base);
  const ok = companies.filter((c) => c.metrics.price && c.metrics.high52 && c.metrics.low52);
  const highs = ok
    .filter((c) => c.metrics.price! >= c.metrics.high52! * (1 - NEAR))
    .sort((a, b) => (b.metrics.change1y ?? -9) - (a.metrics.change1y ?? -9));
  const lows = ok
    .filter((c) => c.metrics.price! <= c.metrics.low52! * (1 + NEAR))
    .sort((a, b) => (a.metrics.change1y ?? 9) - (b.metrics.change1y ?? 9));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <List
        title={`52 Hafta Zirvesinde (${highs.length})`}
        hint="Fiyatı son bir yılın en yüksek seviyesine %2'den yakın hisseler"
        items={highs}
        kind="high"
      />
      <List
        title={`52 Hafta Dibinde (${lows.length})`}
        hint="Fiyatı son bir yılın en düşük seviyesine %2'den yakın hisseler"
        items={lows}
        kind="low"
      />
    </div>
  );
}
