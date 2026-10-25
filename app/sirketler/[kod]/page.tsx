import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KeyStats, LivePrice, RatioGroups } from "@/components/CompanyLive";
import FinancialCharts from "@/components/FinancialCharts";
import NewsList from "@/components/NewsList";
import PriceChart from "@/components/PriceChart";
import Statements from "@/components/Statements";
import WatchButton from "@/components/WatchButton";
import { getCompany, getIndex } from "@/lib/data";
import { num } from "@/lib/format";
import { INDEX_NAMES } from "@/lib/indices";

type Props = { params: Promise<{ kod: string }> };

export function generateStaticParams() {
  return getIndex().companies.map((c) => ({ kod: c.code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  const c = getCompany(kod);
  return { title: c ? `${c.code} · ${c.name}` : "Bulunamadı" };
}

export default async function CompanyPage({ params }: Props) {
  const { kod } = await params;
  const c = getCompany(kod);
  if (!c) notFound();
  const m = c.metrics;
  const fin = { code: c.code, financialCurrency: c.financialCurrency, statements: c.statements };
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
        <LivePrice code={c.code} metrics={m} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <PriceChart code={c.code} prices={c.prices} />
        </div>
        <KeyStats code={c.code} metrics={m} />
      </section>

      <RatioGroups code={c.code} metrics={m} />

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
          <h2 className="mb-2 font-semibold">
            Şirket Hakkında
            {c.summaryLang === "en" && <span className="ml-2 text-xs font-normal text-muted">(henüz çevrilmedi)</span>}
          </h2>
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
