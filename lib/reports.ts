import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getCompany, getIndex } from "./data";
import type { Metrics } from "./types";

const FILE = path.join(process.cwd(), "data", "reports.json");

type RawFile = {
  updatedAt: string | null;
  recent: { code: string; at: string; period: string; id: number }[];
  upcoming: { code: string; date: string; periodEnd: string | null; id: number }[];
};

export type RecentReport = {
  code: string;
  name: string;
  /** KAP'ta açıklanma zamanı (yerel saat, ISO) */
  at: string;
  /** "2026-09" */
  period: string;
  id: number;
  metrics: Metrics;
  /** Yılbaşından açıklanan döneme kadar ana ortaklık net kârı */
  netProfit: number | null;
  /** Geçen yılın aynı dönemine göre; zarar varsa hesaplanmaz */
  netProfitYoY: number | null;
};

export type UpcomingReport = { code: string; name: string; date: string; periodEnd: string | null; id: number };

function load(): RawFile {
  if (!fs.existsSync(FILE)) return { updatedAt: null, recent: [], upcoming: [] };
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

const PROFIT_LABELS = ["Ana Ortaklık Net Kârı", "Dönem Net Kârı"];

/** Çeyreklik tablodan yılbaşından itibaren toplam (ör. 2026-09 → 2026-03 + 2026-06 + 2026-09) */
function cumulative(periods: string[], values: (number | null)[], period: string): number | null {
  const [y, m] = period.split("-").map(Number);
  let sum = 0;
  for (let month = 3; month <= m; month += 3) {
    const i = periods.indexOf(`${y}-${String(month).padStart(2, "0")}`);
    const v = i >= 0 ? values[i] : null;
    if (v == null) return null;
    sum += v;
  }
  return sum;
}

function netProfit(code: string, period: string): { now: number | null; yoy: number | null } {
  const income = getCompany(code)?.statements.quarterly.income;
  const row = income && PROFIT_LABELS.map((l) => income.rows.find((r) => r.label === l)).find(Boolean);
  if (!income || !row) return { now: null, yoy: null };
  const now = cumulative(income.periods, row.values, period);
  const [y, m] = period.split("-");
  const prev = cumulative(income.periods, row.values, `${Number(y) - 1}-${m}`);
  return { now, yoy: now != null && prev != null && now > 0 && prev > 0 ? now / prev - 1 : null };
}

export function getReports(): { updatedAt: string | null; recent: RecentReport[]; upcoming: UpcomingReport[] } {
  const raw = load();
  const companies = new Map(getIndex().companies.map((c) => [c.code, c]));
  const recent = raw.recent.flatMap((r) => {
    const c = companies.get(r.code);
    if (!c) return [];
    const p = netProfit(r.code, r.period);
    return [{ ...r, name: c.name, metrics: c.metrics, netProfit: p.now, netProfitYoY: p.yoy }];
  });
  const upcoming = raw.upcoming.flatMap((u) => {
    const c = companies.get(u.code);
    return c ? [{ ...u, name: c.name }] : [];
  });
  return { updatedAt: raw.updatedAt, recent, upcoming };
}
