import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FinancialCharts from "@/components/FinancialCharts";
import NewsList from "@/components/NewsList";
import WatchButton from "@/components/WatchButton";
import PriceChart from "@/components/PriceChart";
import Statements from "@/components/Statements";
import { getCompany, getIndex } from "@/lib/data";
import { INDEX_NAMES } from "@/lib/indices";
import { changeClass, compact, num, signedPct } from "@/lib/format";
import { formatMetric, METRIC_MAP } from "@/lib/metrics";
import type { MetricKey } from "@/lib/types";

type Props = { params: Promise<{ kod: string }> };

export function generateStaticParams() {
  return getIndex().companies.map((c) => ({ kod: c.code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  const c = getCompany(kod);
  return { title: c ? `${c.code} · ${c.name} | Borsa Analiz` : "Bulunamadı" };
}

const GROUPS: { title: string; keys: MetricKey[] }[] = [
  { title: "Değerleme", keys: ["pe", "pb", "evEbitda", "ps", "dividendYield", "fcfYield"] },
  { title: "Kârlılık", keys: ["roe", "roa", "grossMargin", "ebitdaMargin", "operatingMargin", "netMargin"] },
  { title: "Büyüme", keys: ["revenueGrowth", "netIncomeGrowth", "change1y"] },
  { title: "Borçluluk ve Likidite", keys: ["debtToEquity", "netDebtEbitda", "currentRatio", "netDebt"] },
];

export default async function CompanyPage({ params }: Props) {
  const { kod } = await params;
  const c = getCompany(kod);
  if (!c) notFound();
  const m = c.metrics;
  const fin = { code: c.code, financialCurrency: c.financialCurrency, statements: c.statements };

  const range = m.high52 != null && m.low52 != null && m.price != null && m.high52 > m.low52
    ? ((m.price - m.low52) / (m.high52 - m.low52)) * 100
    : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{c.code}</h1>
            <WatchButton code={c.code} />
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">{c.sector}</span>
          </div>
          {c.indices && c.indices.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.indices.map((i) => (
                <span key={i} className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted">
                  {INDEX_NAMES[i] ?? i}
                </span>
              ))}
            </div>
          )}
          <p className="mt-1 text-muted">{c.name}</p>
        </div>
        <div className="text-right tabular">
          <div className="text-3xl font-semibold">{num(m.price)} ₺</div>
          <div className={`text-sm font-medium ${changeClass(m.change)}`}>{signedPct(m.change)} bugün</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <PriceChart prices={c.prices} />
        </div>
        <div className="card divide-y divide-border text-sm tabular">
          {[
            ["Piyasa Değeri", `${compact(m.marketCap)} ₺`],
            ["Firma Değeri", `${compact(m.ev)} ₺`],
            ["F/K", formatMetric("pe", m.pe)],
            ["PD/DD", formatMetric("pb", m.pb)],
            ["FD/FAVÖK", formatMetric("evEbitda", m.evEbitda)],
            ["Net Kâr (12 ay)", `${compact(m.netIncomeTtm)} ₺`],
            ["Özkaynaklar", `${compact(m.equity)} ₺`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between px-4 py-2.5">
              <span className="text-muted">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
          <div className="px-4 py-3">
            <div className="mb-1.5 flex justify-between text-xs text-muted">
              <span>52 hafta düşük: {num(m.low52)}</span>
              <span>yüksek: {num(m.high52)}</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-surface-2">
              {range != null && (
                <div className="absolute -top-1 h-3.5 w-1 rounded bg-accent" style={{ left: `calc(${range}% - 2px)` }} />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GROUPS.map((g) => (
          <div key={g.title} className="card p-4">
            <h3 className="mb-3 text-sm font-semibold">{g.title}</h3>
            <dl className="space-y-2 text-sm tabular">
              {g.keys.map((k) => (
                <div key={k} className="flex justify-between gap-2" title={METRIC_MAP[k].hint}>
                  <dt className="text-muted">{METRIC_MAP[k].label}</dt>
                  <dd className={`font-medium ${METRIC_MAP[k].kind === "change" ? changeClass(m[k]) : ""}`}>{formatMetric(k, m[k])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      <FinancialCharts company={fin} />

      <Statements company={fin} />

      <section className="card">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h2 className="font-semibold">KAP Bildirimleri</h2>
          <span className="text-xs text-muted">Son 30 gün</span>
        </div>
        <NewsList codes={[c.code]} days={30} showCompany={false} empty="Son 30 günde KAP bildirimi yok." />
      </section>

      {c.summary && (
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Şirket Hakkında</h2>
          <p className="text-sm leading-relaxed text-muted">{c.summary}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {c.industry && <span><span className="text-muted">Sektör: </span>{c.industry}</span>}
            {c.city && <span><span className="text-muted">Merkez: </span>{c.city}</span>}
            {c.employees && <span><span className="text-muted">Çalışan: </span>{num(c.employees, 0)}</span>}
            {c.website && (
              <a href={c.website} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                {c.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
