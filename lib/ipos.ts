import "server-only";
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "data", "ipos.json");

/** scripts/fetch_ipos.py: KAP halka arz duyuruları ve sonuçları */
export type Ipo = {
  code: string;
  name: string;
  /** Talep toplama (satış) günleri */
  start: string | null;
  end: string | null;
  price: number | null;
  /** Halka arz edilen payların nominal tutarı (TL) ve sermayeye oranı (%) */
  nominal?: number | null;
  ratio?: number | null;
  broker?: string | null;
  market?: string | null;
  method?: string | null;
  shares?: number | null;
  /** Halka arz büyüklüğü (TL) */
  size?: number | null;
  investors?: number | null;
  offerId?: number;
  resultId?: number;
  current: number | null;
  /** Halka arz fiyatından bu yana (bedelsiz / bölünme olduysa hesaplanmaz) */
  return: number | null;
};

export function getIpos(): { updatedAt: string | null; items: Ipo[] } {
  if (!fs.existsSync(FILE)) return { updatedAt: null, items: [] };
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}
