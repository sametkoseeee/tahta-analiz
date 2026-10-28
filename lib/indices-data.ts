import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getIndex } from "./data";

const FILE = path.join(process.cwd(), "data", "indices.json");

export type IndexRow = {
  code: string;
  name: string;
  group: "Ana" | "Katılım" | "Sektör";
  date: string;
  price: number;
  change: number | null;
  ret: Record<"w1" | "m1" | "m3" | "m6" | "ytd" | "y1" | "y3" | "y5", number | null>;
  /** Üyeleri bilinen endekslerde (KAP) şirket sayısı ve toplam piyasa değeri */
  members: number | null;
  marketCap: number | null;
};

export function getIndicesData(): { updatedAt: string | null; rows: IndexRow[] } {
  if (!fs.existsSync(FILE)) return { updatedAt: null, rows: [] };
  const raw = JSON.parse(fs.readFileSync(FILE, "utf-8")) as {
    updatedAt: string;
    rows: Omit<IndexRow, "members" | "marketCap">[];
  };
  const { companies } = getIndex();
  const rows = raw.rows.map((r) => {
    const list = companies.filter((c) => c.indices?.includes(r.code));
    return {
      ...r,
      members: list.length || null,
      marketCap: list.length ? list.reduce((s, c) => s + (c.metrics.marketCap ?? 0), 0) : null,
    };
  });
  return { updatedAt: raw.updatedAt, rows };
}
