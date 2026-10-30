import type { FundSummary } from "./types";

/** Fon tablosunun kullandığı alanlar. 1000+ fonun tamamı sayfaya gömüldüğünden geri kalanı gönderilmez. */
export type FundRow = Pick<
  FundSummary,
  | "code"
  | "name"
  | "umbrella"
  | "founder"
  | "risk"
  | "price"
  | "change"
  | "r1m"
  | "r3m"
  | "r6m"
  | "rytd"
  | "r1y"
  | "r3y"
  | "size"
  | "investors"
  | "spark"
>;

/** 80 piksellik küçük grafik için yeterli: 63 yerine 30 nokta, 5 anlamlı basamak (sayfa verisi ~yarıya iner) */
const SPARK_POINTS = 30;

function thin(values: number[]): number[] {
  const n = values.length;
  const pick = n <= SPARK_POINTS ? values : Array.from({ length: SPARK_POINTS }, (_, k) => values[Math.round((k * (n - 1)) / (SPARK_POINTS - 1))]);
  return pick.map((v) => Number(v.toPrecision(5)));
}

export function toFundRow(f: FundSummary): FundRow {
  return {
    code: f.code,
    name: f.name,
    umbrella: f.umbrella,
    founder: f.founder,
    risk: f.risk,
    price: f.price,
    change: f.change,
    r1m: f.r1m,
    r3m: f.r3m,
    r6m: f.r6m,
    rytd: f.rytd,
    r1y: f.r1y,
    r3y: f.r3y,
    size: f.size,
    investors: f.investors,
    spark: thin(f.spark),
  };
}
