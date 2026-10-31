import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getIndex } from "./data";

const FILE = path.join(process.cwd(), "data", "dividends.json");

export type Dividend = {
  code: string;
  name: string;
  /** KAP bildirimi */
  id: number;
  published: string;
  summary: string | null;
  meeting: string | null;
  /** 1 TL nominal pay başına nakit kâr payı (TL) */
  gross: number | null;
  net: number | null;
  withholding: number | null;
  /** Bedelsiz pay oranı (%) */
  bonusPct: number | null;
  payDate: string | null;
  status: "Teklif" | "Onaylandı" | "Ödendi" | "Dağıtılmayacak";
  price: number | null;
};

/** Son 12 ayda ödenmiş ya da ödenecek nakit kâr payları (temettü geliri hesaplayıcı, verim sıralaması) */
export function dividendPresets(): { code: string; name: string; price: number | null; gross: number; net: number; payDate: string | null }[] {
  const yearAgo = new Date(Date.now() - 365 * 86400_000).toISOString().slice(0, 10);
  return getDividends()
    .items.filter((d) => d.gross && d.gross > 0 && d.status !== "Dağıtılmayacak" && (!d.payDate || d.payDate >= yearAgo))
    .map((d) => ({ code: d.code, name: d.name, price: d.price, gross: d.gross!, net: d.net ?? d.gross!, payDate: d.payDate }))
    .sort((a, b) => a.code.localeCompare(b.code, "tr"));
}

export function getDividends(): { updatedAt: string | null; items: Dividend[] } {
  if (!fs.existsSync(FILE)) return { updatedAt: null, items: [] };
  const raw = JSON.parse(fs.readFileSync(FILE, "utf-8")) as { updatedAt: string; items: Omit<Dividend, "name" | "price">[] };
  const companies = new Map(getIndex().companies.map((c) => [c.code, c]));
  const items = raw.items.flatMap((d) => {
    const c = companies.get(d.code);
    return c ? [{ ...d, name: c.name, price: c.metrics.price }] : [];
  });
  return { updatedAt: raw.updatedAt, items };
}
