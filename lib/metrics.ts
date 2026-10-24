import { compact, num, pct, signedPct } from "./format";
import type { MetricKey } from "./types";

export type MetricKind = "price" | "money" | "multiple" | "percent" | "change";

export type MetricDef = {
  key: MetricKey;
  label: string;
  short: string;
  kind: MetricKind;
  hint: string;
  /** daha düşük değer daha iyi mi (radar sıralama ipucu) */
  lowerIsBetter?: boolean;
};

export const METRICS: MetricDef[] = [
  { key: "price", label: "Fiyat", short: "Fiyat", kind: "price", hint: "Son kapanış fiyatı (TL)" },
  { key: "change", label: "Günlük Değişim", short: "Gün %", kind: "change", hint: "Bir önceki kapanışa göre" },
  { key: "change1y", label: "Yıllık Getiri", short: "1Y %", kind: "change", hint: "Son 252 işlem günü" },
  { key: "marketCap", label: "Piyasa Değeri", short: "Piy. Değ.", kind: "money", hint: "Fiyat × hisse adedi" },
  { key: "ev", label: "Firma Değeri", short: "FD", kind: "money", hint: "Piyasa değeri + net borç" },
  { key: "pe", label: "F/K", short: "F/K", kind: "multiple", hint: "Piyasa değeri / son 12 ay net kâr", lowerIsBetter: true },
  { key: "pb", label: "PD/DD", short: "PD/DD", kind: "multiple", hint: "Piyasa değeri / özkaynak", lowerIsBetter: true },
  { key: "evEbitda", label: "FD/FAVÖK", short: "FD/FAVÖK", kind: "multiple", hint: "Firma değeri / son 12 ay FAVÖK", lowerIsBetter: true },
  { key: "ps", label: "PD/Satışlar", short: "PD/S", kind: "multiple", hint: "Piyasa değeri / son 12 ay hasılat", lowerIsBetter: true },
  { key: "roe", label: "Özkaynak Kârlılığı", short: "ROE", kind: "percent", hint: "Son 12 ay net kâr / özkaynak" },
  { key: "roa", label: "Aktif Kârlılığı", short: "ROA", kind: "percent", hint: "Son 12 ay net kâr / toplam varlıklar" },
  { key: "grossMargin", label: "Brüt Kâr Marjı", short: "Brüt M.", kind: "percent", hint: "Brüt kâr / hasılat (12 ay)" },
  { key: "ebitdaMargin", label: "FAVÖK Marjı", short: "FAVÖK M.", kind: "percent", hint: "FAVÖK / hasılat (12 ay)" },
  { key: "operatingMargin", label: "Faaliyet Kâr Marjı", short: "Faal. M.", kind: "percent", hint: "Esas faaliyet kârı / hasılat (12 ay)" },
  { key: "netMargin", label: "Net Kâr Marjı", short: "Net M.", kind: "percent", hint: "Net kâr / hasılat (12 ay)" },
  { key: "revenueGrowth", label: "Hasılat Büyümesi", short: "Ciro Büy.", kind: "change", hint: "Son çeyrek, geçen yılın aynı çeyreğine göre" },
  { key: "netIncomeGrowth", label: "Net Kâr Büyümesi", short: "Kâr Büy.", kind: "change", hint: "Son çeyrek, geçen yılın aynı çeyreğine göre" },
  { key: "currentRatio", label: "Cari Oran", short: "Cari O.", kind: "multiple", hint: "Dönen varlıklar / kısa vadeli yükümlülükler" },
  { key: "debtToEquity", label: "Borç/Özkaynak", short: "Borç/ÖK", kind: "multiple", hint: "Finansal borçlar / özkaynak", lowerIsBetter: true },
  { key: "netDebtEbitda", label: "Net Borç/FAVÖK", short: "NB/FAVÖK", kind: "multiple", hint: "Net borç / son 12 ay FAVÖK", lowerIsBetter: true },
  { key: "dividendYield", label: "Temettü Verimi", short: "Temettü", kind: "percent", hint: "Son 12 ay temettü / fiyat" },
  { key: "fcfYield", label: "Serbest Nakit Akışı Verimi", short: "SNA V.", kind: "percent", hint: "Son 12 ay serbest nakit akışı / piyasa değeri" },
  { key: "netIncomeTtm", label: "Net Kâr (12 Ay)", short: "Net Kâr", kind: "money", hint: "Ana ortaklık payı, TL" },
  { key: "revenueTtm", label: "Hasılat (12 Ay)", short: "Hasılat", kind: "money", hint: "TL" },
  { key: "netDebt", label: "Net Borç", short: "Net Borç", kind: "money", hint: "Negatifse net nakit" },
];

export const METRIC_MAP = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<MetricKey, MetricDef>;

export function formatMetric(key: MetricKey, v: number | null | undefined): string {
  const def = METRIC_MAP[key];
  switch (def.kind) {
    case "price":
      return num(v, 2);
    case "money":
      return compact(v);
    case "multiple":
      return num(v, 2);
    case "percent":
      return pct(v, 1);
    case "change":
      return signedPct(v, 2);
  }
}

/** Radar'da kullanıcı yüzde alanlarına 25 yazar, biz 0.25 olarak karşılaştırırız. */
export function inputScale(key: MetricKey): number {
  const kind = METRIC_MAP[key].kind;
  if (kind === "percent" || kind === "change") return 0.01;
  if (kind === "money") return 1e9; // milyar TL
  return 1;
}

export function inputUnit(key: MetricKey): string {
  const kind = METRIC_MAP[key].kind;
  if (kind === "percent" || kind === "change") return "%";
  if (kind === "money") return "Mr ₺";
  if (kind === "price") return "₺";
  return "x";
}
