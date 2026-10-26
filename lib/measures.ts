import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getIndex } from "./data";

const FILE = path.join(process.cwd(), "data", "measures.json");

export type MeasureKind = "credit" | "gross" | "package" | "single" | "internet";

export const MEASURE_LABELS: Record<MeasureKind, string> = {
  credit: "Kredili alım ve açığa satış yasağı",
  gross: "Brüt takas",
  package: "Emir paketi",
  single: "Tek fiyat",
  internet: "İnternet emir yasağı",
};

/** Bir hissenin tedbirleri: aynı anda süren duyurular birleştirilir */
export type Measure = {
  code: string;
  name: string;
  start: string;
  end: string;
  kinds: MeasureKind[];
  /** En yeni KAP duyurusu */
  id: number;
  text: string;
};

type Raw = { code: string; start: string; end: string; kinds: MeasureKind[]; id: number; text: string };

/** Seans 18:00'de biter; bitiş günü akşamı derlenen sayfada tedbir bitmiş sayılır */
function istanbulToday(): { day: string; afterClose: boolean } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { day: `${get("year")}-${get("month")}-${get("day")}`, afterClose: Number(get("hour")) >= 18 };
}

let cached: { active: Measure[]; ended: Measure[] } | null = null;

export function getMeasures(): { active: Measure[]; ended: Measure[] } {
  if (cached) return cached; // şirket sayfalarının her biri için yeniden okunmasın
  if (!fs.existsSync(FILE)) return { active: [], ended: [] };
  const raw = JSON.parse(fs.readFileSync(FILE, "utf-8")) as { items: Raw[] };
  const names = new Map(getIndex().companies.map((c) => [c.code, c.name]));
  const { day, afterClose } = istanbulToday();
  // Yarın başlayacak (yeni duyurulan) tedbirler de süren listesinde gösterilir
  const isActive = (m: Raw) => m.end > day || (m.end === day && !afterClose);

  const active = new Map<string, Measure>();
  const ended: Measure[] = [];
  for (const m of raw.items) {
    const name = names.get(m.code);
    if (!name) continue;
    if (!isActive(m)) {
      ended.push({ ...m, name });
      continue;
    }
    const cur = active.get(m.code);
    if (!cur) {
      active.set(m.code, { ...m, name, kinds: [...m.kinds] });
      continue;
    }
    cur.start = m.start < cur.start ? m.start : cur.start;
    cur.end = m.end > cur.end ? m.end : cur.end;
    cur.kinds = [...new Set([...cur.kinds, ...m.kinds])];
    if (m.id > cur.id) Object.assign(cur, { id: m.id, text: m.text });
  }
  const byEnd = (a: Measure, b: Measure) => b.end.localeCompare(a.end) || a.code.localeCompare(b.code, "tr");
  cached = { active: [...active.values()].sort(byEnd), ended: ended.sort(byEnd) };
  return cached;
}

/** Şirket sayfasındaki uyarı için */
export function getActiveMeasure(code: string): Measure | null {
  return getMeasures().active.find((m) => m.code === code) ?? null;
}
