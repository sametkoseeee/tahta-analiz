"use client";

import Link from "next/link";
import { num } from "@/lib/format";
import { useLive } from "@/lib/live";
import type { DividendPreset } from "./DividendIncomeCalculator";

const date = (d: string | null) => (d ? d.split("-").reverse().join(".") : "–");

/** Temettü sayfası: son 12 ayın en yüksek temettü verimli hisseleri (güncel fiyatla) */
export default function DividendLeaders({ items }: { items: (DividendPreset & { name: string })[] }) {
  const { quotes } = useLive();
  const top = items
    .map((d) => {
      const price = quotes[d.code]?.p ?? d.price;
      return { ...d, yield: price ? d.gross / price : null };
    })
    .filter((d) => d.yield != null && d.yield < 1) // %100 üstü: veri hatası
    .sort((a, b) => b.yield! - a.yield!)
    .slice(0, 10);
  if (top.length === 0) return null;
  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">En Yüksek Temettü Verimi</h2>
        <Link href="/hesaplama#temettu" className="text-sm text-accent hover:underline">
          Temettü gelirini hesapla →
        </Link>
      </div>
      <ol className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
        {top.map((d, i) => (
          <li key={d.code} className="flex min-w-0 items-baseline gap-3 border-b border-border py-1.5 text-sm last:border-0 md:[&:nth-last-child(2)]:border-0">
            <span className="w-5 shrink-0 text-right text-xs text-muted tabular">{i + 1}</span>
            <Link href={`/sirketler/${d.code}`} className="w-14 shrink-0 font-semibold text-accent hover:underline">
              {d.code}
            </Link>
            <span className="min-w-0 flex-1 truncate text-xs text-muted">
              {num(d.gross, 4)} ₺ brüt · ödeme {date(d.payDate)}
            </span>
            <span className="shrink-0 tabular font-semibold text-up">%{num(d.yield! * 100)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted">
        Son 12 ayda ödenen ya da ödenecek nakit kâr payının (brüt, pay başına) güncel fiyata oranı. Geçmiş temettü gelecekte
        de dağıtılacağı anlamına gelmez; yatırım tavsiyesi değildir.
      </p>
    </section>
  );
}
