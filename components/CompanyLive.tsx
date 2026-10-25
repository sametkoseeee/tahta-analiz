"use client";

import { changeClass, compact, num, signedPct } from "@/lib/format";
import { useLive, withLive } from "@/lib/live";
import { formatMetric, METRIC_MAP } from "@/lib/metrics";
import type { MetricKey, Metrics } from "@/lib/types";

/** Şirket sayfasının fiyata bağlı bölümleri: seans içi güncel fiyat varsa onunla hesaplanır */
function useCompanyMetrics(code: string, metrics: Metrics) {
  const { quotes } = useLive();
  const q = quotes[code];
  return { m: withLive(metrics, q), updatedAt: q?.t ?? null };
}

const timeFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

export function LivePrice({ code, metrics }: { code: string; metrics: Metrics }) {
  const { m, updatedAt } = useCompanyMetrics(code, metrics);
  return (
    <div className="text-right tabular">
      <div className="text-3xl font-semibold">{num(m.price)} ₺</div>
      <div className={`text-sm font-medium ${changeClass(m.change)}`}>{signedPct(m.change)} bugün</div>
      {updatedAt && (
        <div className="mt-0.5 text-[11px] text-muted" title="Yahoo fiyatları yaklaşık 15 dakika gecikmelidir">
          {timeFmt.format(new Date(updatedAt))} itibarıyla · 15 dk gecikmeli
        </div>
      )}
    </div>
  );
}

export function KeyStats({ code, metrics }: { code: string; metrics: Metrics }) {
  const { m } = useCompanyMetrics(code, metrics);
  const range =
    m.high52 != null && m.low52 != null && m.price != null && m.high52 > m.low52
      ? ((m.price - m.low52) / (m.high52 - m.low52)) * 100
      : null;

  return (
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
  );
}

const GROUPS: { title: string; keys: MetricKey[] }[] = [
  { title: "Değerleme", keys: ["pe", "pb", "evEbitda", "ps", "dividendYield", "fcfYield"] },
  { title: "Kârlılık", keys: ["roe", "roa", "grossMargin", "ebitdaMargin", "operatingMargin", "netMargin"] },
  { title: "Büyüme", keys: ["revenueGrowth", "netIncomeGrowth", "change1y"] },
  { title: "Borçluluk ve Likidite", keys: ["debtToEquity", "netDebtEbitda", "currentRatio", "netDebt"] },
];

export function RatioGroups({ code, metrics }: { code: string; metrics: Metrics }) {
  const { m } = useCompanyMetrics(code, metrics);
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {GROUPS.map((g) => (
        <div key={g.title} className="card p-4">
          <h3 className="mb-3 text-sm font-semibold">{g.title}</h3>
          <dl className="space-y-2 text-sm tabular">
            {g.keys.map((k) => (
              <div key={k} className="flex justify-between gap-2" title={METRIC_MAP[k].hint}>
                <dt className="text-muted">{METRIC_MAP[k].label}</dt>
                <dd className={`font-medium ${METRIC_MAP[k].kind === "change" ? changeClass(m[k]) : ""}`}>
                  {formatMetric(k, m[k])}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}
