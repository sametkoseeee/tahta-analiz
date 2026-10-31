import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getFunds, getIndex } from "./data";

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

const TOP = 10;

/** Fonun en büyük hisseleri; rapor henüz okunmadıysa null */
export function getFundHoldings(code: string): FundHoldings | null {
  const h = load().funds[code.toUpperCase()];
  if (!h) return null;
  const names = new Map(getIndex().companies.map((c) => [c.code, c.name]));
  return { ...h, items: h.items.slice(0, TOP).map((i) => ({ ...i, name: names.get(i.code) ?? null })) };
}

export type StockHolder = { code: string; name: string; pct: number; period: string };

let holders: Map<string, StockHolder[]> | null = null;

/** Hisseyi portföyünde tutan hisse senedi fonları, fondaki payına göre büyükten küçüğe */
export function getStockHolders(code: string): StockHolder[] {
  if (!holders) {
    holders = new Map();
    const names = new Map(getFunds().funds.map((f) => [f.code, f.name]));
    for (const [fund, h] of Object.entries(load().funds)) {
      for (const i of h.items) {
        const list = holders.get(i.code) ?? [];
        list.push({ code: fund, name: names.get(fund) ?? fund, pct: i.pct, period: h.period });
        holders.set(i.code, list);
      }
    }
    holders.forEach((list) => list.sort((a, b) => b.pct - a.pct));
  }
  return holders.get(code.toUpperCase()) ?? [];
}
