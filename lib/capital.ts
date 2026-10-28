import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getIndex } from "./data";

const FILE = path.join(process.cwd(), "data", "capital.json");

export type CapitalStatus =
  | "Karar"
  | "SPK başvurusu"
  | "SPK onaylı"
  | "Tarih belli"
  | "Rüçhan süreci"
  | "Tamamlandı"
  | "İptal";

type Part = { amount: number | null; pct: number | null };

export type CapitalIncrease = {
  code: string;
  name: string;
  /** KAP bildirimi */
  id: number;
  published: string;
  summary: string | null;
  decision: string | null;
  current: number | null;
  target: number | null;
  rights: (Part & { price: number | null; start: string | null; end: string | null }) | null;
  bonus: (Part & { start: string | null }) | null;
  allocated: Part | null;
  reduction: Part | null;
  spkApplied: string | null;
  spkApproved: string | null;
  registered: string | null;
  status: CapitalStatus;
};

let cached: { updatedAt: string | null; items: CapitalIncrease[] } | null = null;

export function getCapital(): { updatedAt: string | null; items: CapitalIncrease[] } {
  if (cached) return cached; // şirket sayfalarının her biri için yeniden okunmasın
  if (!fs.existsSync(FILE)) return { updatedAt: null, items: [] };
  const raw = JSON.parse(fs.readFileSync(FILE, "utf-8")) as { updatedAt: string; items: Omit<CapitalIncrease, "name">[] };
  const names = new Map(getIndex().companies.map((c) => [c.code, c.name]));
  const items = raw.items.flatMap((d) => {
    const name = names.get(d.code);
    return name ? [{ ...d, name }] : [];
  });
  cached = { updatedAt: raw.updatedAt, items };
  return cached;
}

/** Şirket sayfasındaki uyarı: yalnızca süren (tamamlanmamış, iptal edilmemiş) artırımlar */
export function getOpenCapital(code: string): CapitalIncrease | null {
  const d = getCapital().items.find((x) => x.code === code);
  return d && d.status !== "Tamamlandı" && d.status !== "İptal" ? d : null;
}

/** "Bedelli %100 · Bedelsiz %200" gibi kısa özet */
export function capitalSummary(d: CapitalIncrease): string {
  const fmt = (v: number) => `%${v.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
  const parts = [];
  if (d.rights?.pct) parts.push(`Bedelli ${fmt(d.rights.pct)}`);
  if (d.bonus?.pct) parts.push(`Bedelsiz ${fmt(d.bonus.pct)}`);
  if (d.allocated) parts.push("Tahsisli");
  if (d.reduction) parts.push("Sermaye azaltımı");
  return parts.join(" · ") || "Sermaye artırımı";
}
