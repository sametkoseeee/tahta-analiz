import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getIndex } from "./data";

const FILE = path.join(process.cwd(), "data", "holdings.json");

/** scripts/fetch_holdings.py: KAP aylık portföy dağılım raporundan fonun en büyük hisseleri */
type HoldingsFile = {
  updatedAt: string;
  funds: Record<string, { period: string; total: number; count: number; items: { code: string; pct: number }[] }>;
};

export type FundHoldings = {
  /** "2026-09" */
  period: string;
  /** Hisselerin fondaki toplam payı (%) */
  total: number;
  count: number;
  items: { code: string; name: string | null; pct: number }[];
};

let cached: HoldingsFile | null = null;

function load(): HoldingsFile {
  if (!cached) {
    cached = fs.existsSync(FILE) ? (JSON.parse(fs.readFileSync(FILE, "utf-8")) as HoldingsFile) : { updatedAt: "", funds: {} };
  }
  return cached;
}

/** Fonun en büyük hisseleri; rapor henüz okunmadıysa null */
export function getFundHoldings(code: string): FundHoldings | null {
  const h = load().funds[code.toUpperCase()];
  if (!h) return null;
  const names = new Map(getIndex().companies.map((c) => [c.code, c.name]));
  return { ...h, items: h.items.map((i) => ({ ...i, name: names.get(i.code) ?? null })) };
}
