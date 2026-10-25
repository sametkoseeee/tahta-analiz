"use client";

import Link from "next/link";
import { changeClass, compact, num, signedPct } from "@/lib/format";
import { useLiveCompanies } from "@/lib/live";
import type { CompanySummary } from "@/lib/types";
import HomeList from "./HomeList";

function Movers({ title, list }: { title: string; list: CompanySummary[] }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-semibold text-muted">{title}</h3>
      <ul className="space-y-2 text-sm tabular">
        {list.map((c) => (
          <li key={c.code}>
            <Link href={`/sirketler/${c.code}`} className="flex items-center justify-between gap-2 hover:opacity-80">
              <span className="font-semibold">{c.code}</span>
              <span className="ml-auto text-muted">{num(c.metrics.price)}</span>
              <span className={`w-20 text-right font-medium ${changeClass(c.metrics.change)}`}>{signedPct(c.metrics.change)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ana sayfa: piyasa özeti, günün hareketlileri ve hisse listesi (güncel fiyatlarla) */
export default function MarketOverview({ companies: base }: { companies: CompanySummary[] }) {
  const companies = useLiveCompanies(base);
  const withChange = companies.filter((c) => c.metrics.change != null);
  const byChange = [...withChange].sort((a, b) => b.metrics.change! - a.metrics.change!);
  const gainers = byChange.slice(0, 5);
  const losers = byChange.slice(-5).reverse();
  const biggest = [...companies].sort((a, b) => (b.metrics.marketCap ?? 0) - (a.metrics.marketCap ?? 0)).slice(0, 5);

  const totalCap = companies.reduce((s, c) => s + (c.metrics.marketCap ?? 0), 0);
  const up = withChange.filter((c) => c.metrics.change! > 0).length;
  const down = withChange.filter((c) => c.metrics.change! < 0).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hisse Analizleri</h1>
          <p className="mt-1 text-sm text-muted">
            {companies.length} BIST şirketinin mali tabloları, oranları ve fiyat geçmişi.
          </p>
        </div>
        <div className="flex gap-6 text-sm tabular">
          <div>
            <div className="text-xs text-muted">Toplam piyasa değeri</div>
            <div className="font-semibold">{compact(totalCap)} ₺</div>
          </div>
          <div>
            <div className="text-xs text-muted">Yükselen / düşen</div>
            <div className="font-semibold">
              <span className="text-up">{up}</span> / <span className="text-down">{down}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Movers title="Günün en çok yükselenleri" list={gainers} />
        <Movers title="Günün en çok düşenleri" list={losers} />
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-muted">En büyük piyasa değerleri</h3>
          <ul className="space-y-2 text-sm tabular">
            {biggest.map((c) => (
              <li key={c.code}>
                <Link href={`/sirketler/${c.code}`} className="flex items-center justify-between hover:opacity-80">
                  <span className="font-semibold">{c.code}</span>
                  <span className="text-muted">{compact(c.metrics.marketCap)} ₺</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HomeList companies={base} />
    </div>
  );
}
