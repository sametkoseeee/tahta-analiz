import "server-only";
import fs from "node:fs";
import path from "node:path";

/** VİOP yaklaşık teminat satırı (scripts/fetch_viop.py) */
export type ViopRow = {
  code: string;
  name: string;
  kind: "Pay" | "Endeks" | "Döviz" | "Emtia";
  /** Dayanak varlığın spot fiyatı (currency cinsinden) */
  spot: number;
  currency: "TRY" | "USD";
  /** Kontrat büyüklüğü (dayanak birimi) */
  size: number;
  unit: string;
  /** Takasbank Fiyat Değişim Aralığı, % */
  psr: number;
  /** TL cinsinden kontrat değeri ve teminat */
  contractValue: number;
  margin: number;
  leverage: number;
};

export function getViop(): { updatedAt: string | null; source: string | null; rows: ViopRow[] } {
  const file = path.join(process.cwd(), "data", "viop.json");
  if (!fs.existsSync(file)) return { updatedAt: null, source: null, rows: [] };
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
