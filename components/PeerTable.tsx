import Link from "next/link";
import { changeClass } from "@/lib/format";
import { formatMetric, METRIC_MAP } from "@/lib/metrics";
import type { SectorStat } from "@/lib/sectors";
import type { CompanySummary, MetricKey } from "@/lib/types";

const COLS: MetricKey[] = ["marketCap", "pe", "pb", "evEbitda", "roe", "netMargin", "change1y"];

/** Hisse sayfası: aynı sektörden piyasa değeri yakın şirketler ve sektör medyanı */
export default function PeerTable({
  code,
  sector,
  peers,
  median,
}: {
  code: string;
  sector: string;
  peers: CompanySummary[];
  median: SectorStat["median"];
}) {
  return (
    <section className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border p-3">
        <h2 className="font-semibold">Benzer Şirketler</h2>
        <Link href="/piyasa#sektorler" className="text-xs text-accent hover:underline">
          {sector} · sektör ortalamaları →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-medium">Hisse</th>
              {COLS.map((k) => (
                <th key={k} className="whitespace-nowrap px-3 py-2 text-right font-medium" title={METRIC_MAP[k].hint}>
                  {METRIC_MAP[k].short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {peers.map((c) => {
              const self = c.code === code;
              return (
                <tr key={c.code} className={`border-b border-border ${self ? "bg-accent-soft/60" : "hover:bg-surface-2"}`}>
                  <td className={`sticky left-0 z-10 px-3 py-2 ${self ? "bg-accent-soft" : "bg-surface"}`}>
                    {self ? (
                      <span className="font-semibold">{c.code}</span>
                    ) : (
                      <Link href={`/sirketler/${c.code}`} className="font-semibold text-accent hover:underline">
                        {c.code}
                      </Link>
                    )}
                  </td>
                  {COLS.map((k) => (
                    <td key={k} className={`whitespace-nowrap px-3 py-2 text-right ${k === "change1y" ? changeClass(c.metrics[k]) : ""}`}>
                      {formatMetric(k, c.metrics[k])}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="text-muted">
              <td className="sticky left-0 z-10 bg-surface px-3 py-2 text-xs font-medium">Sektör medyanı</td>
              {COLS.map((k) => (
                <td key={k} className="whitespace-nowrap px-3 py-2 text-right text-xs">
                  {k === "marketCap" ? "" : formatMetric(k, (median as Record<string, number | null>)[k] ?? null)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 text-xs text-muted">
        Aynı sektörde piyasa değeri en yakın şirketler. Medyan: sektördeki tüm şirketlerin ortadaki değeri; zarar eden
        şirketlerin F/K&apos;sı hesaba katılmaz.
      </p>
    </section>
  );
}
