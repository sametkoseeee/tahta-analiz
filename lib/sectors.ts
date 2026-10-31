import "server-only";
import { getIndex } from "./data";
import type { CompanySummary, MetricKey, Metrics } from "./types";

/** Sektör karşılaştırmasında kullanılan oranlar */
export const SECTOR_METRICS = ["pe", "pb", "evEbitda", "roe", "netMargin", "change1y", "dividendYield"] as const satisfies readonly MetricKey[];

export type SectorStat = {
  sector: string;
  count: number;
  marketCap: number;
  /** Piyasa değeri ağırlıklı günlük değişim */
  change: number | null;
  /** Medyanlar: uç değerlerden etkilenmesin diye ortalama yerine */
  median: Partial<Record<(typeof SECTOR_METRICS)[number], number | null>>;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Çarpanlar yalnızca pozitifken anlamlı (zarar eden şirketin F/K'sı ortalamayı bozar) */
const valid = (k: MetricKey, v: number | null): v is number =>
  v != null && Number.isFinite(v) && (!["pe", "pb", "evEbitda"].includes(k) || (v > 0 && v < 1000));

export function sectorMedians(list: CompanySummary[]): SectorStat["median"] {
  return Object.fromEntries(
    SECTOR_METRICS.map((k) => [k, median(list.map((c) => c.metrics[k]).filter((v) => valid(k, v)))]),
  );
}

let cached: SectorStat[] | null = null;

export function getSectorStats(): SectorStat[] {
  if (cached) return cached;
  const groups = new Map<string, CompanySummary[]>();
  for (const c of getIndex().companies) {
    if (!c.sector) continue;
    groups.set(c.sector, [...(groups.get(c.sector) ?? []), c]);
  }
  cached = [...groups.entries()]
    .map(([sector, list]) => {
      const cap = list.reduce((s, c) => s + (c.metrics.marketCap ?? 0), 0);
      const weighted = list.filter((c) => c.metrics.change != null && c.metrics.marketCap && Math.abs(c.metrics.change) <= 0.25);
      const wCap = weighted.reduce((s, c) => s + c.metrics.marketCap!, 0);
      return {
        sector,
        count: list.length,
        marketCap: cap,
        change: wCap ? weighted.reduce((s, c) => s + c.metrics.change! * c.metrics.marketCap!, 0) / wCap : null,
        median: sectorMedians(list),
      };
    })
    .sort((a, b) => b.marketCap - a.marketCap);
  return cached;
}

/** Aynı sektörden, piyasa değeri en yakın şirketler (şirketin kendisi dahil, büyükten küçüğe) */
export function getPeers(code: string, limit = 8): { peers: CompanySummary[]; median: SectorStat["median"]; sector: string } | null {
  const all = getIndex().companies;
  const self = all.find((c) => c.code === code);
  if (!self?.sector) return null;
  const same = all.filter((c) => c.sector === self.sector);
  if (same.length < 2) return null;
  const cap = (m: Metrics) => Math.log10(Math.max(m.marketCap ?? 1, 1));
  const peers = same
    .filter((c) => c.code !== code)
    .sort((a, b) => Math.abs(cap(a.metrics) - cap(self.metrics)) - Math.abs(cap(b.metrics) - cap(self.metrics)))
    .slice(0, limit - 1)
    .concat(self)
    .sort((a, b) => (b.metrics.marketCap ?? 0) - (a.metrics.marketCap ?? 0));
  return { peers, median: sectorMedians(same), sector: self.sector };
}
