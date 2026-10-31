import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getIndex } from "./data";

const FILE = path.join(process.cwd(), "data", "insider.json");

/** scripts/fetch_insider.py: KAP "Pay Alım Satım Bildirimi" */
export type InsiderTrade = {
  id: number;
  code: string;
  name: string | null;
  /** İşlemi yapan (kişi ya da kurum); bildirimi şirket yaptıysa şirketin unvanı */
  by: string | null;
  summary: string | null;
  date: string;
  /** Ayrıntı ekteyse null */
  buy: number | null;
  sell: number | null;
  net: number | null;
  before: number | null;
  after: number | null;
  price: number | null;
  value: number | null;
};

/** scripts/fetch_insider.py: KAP "Payların Geri Alınmasına İlişkin Bildirim", gün bazında */
export type Buyback = {
  id: number;
  code: string;
  name: string | null;
  date: string;
  nominal: number;
  ratio: number;
  price: number | null;
  value: number | null;
};

export function getInsider(): { trades: InsiderTrade[]; buybacks: Buyback[] } {
  if (!fs.existsSync(FILE)) return { trades: [], buybacks: [] };
  const raw = JSON.parse(fs.readFileSync(FILE, "utf-8")) as { trades: InsiderTrade[]; buybacks: Buyback[] };
  const names = new Map(getIndex().companies.map((c) => [c.code, c.name]));
  return {
    trades: raw.trades.map((t) => ({ ...t, name: names.get(t.code) ?? null })),
    buybacks: raw.buybacks.map((b) => ({ ...b, name: names.get(b.code) ?? null })),
  };
}
