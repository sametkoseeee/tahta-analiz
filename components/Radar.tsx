"use client";

import { useMemo, useState } from "react";
import { downloadXlsx } from "@/lib/excel";
import { filterByIndex, INDEX_NAMES, type IndexFilter } from "@/lib/indices";
import { inputScale, inputUnit, METRIC_MAP, METRICS } from "@/lib/metrics";
import type { CompanySummary, MetricKey } from "@/lib/types";
import CompaniesTable, { sortCompanies, type SortState } from "./CompaniesTable";

type Filter = { id: number; key: MetricKey; min: string; max: string };

const PRESETS: { name: string; filters: Omit<Filter, "id">[] }[] = [
  { name: "Ucuz ve kârlı", filters: [{ key: "pe", min: "0", max: "8" }, { key: "roe", min: "20", max: "" }] },
  { name: "Defter değerinin altında", filters: [{ key: "pb", min: "0", max: "1" }] },
  { name: "Hızlı büyüyenler", filters: [{ key: "revenueGrowth", min: "40", max: "" }, { key: "netIncomeGrowth", min: "40", max: "" }] },
  { name: "Net nakit pozisyonu", filters: [{ key: "netDebt", min: "", max: "0" }] },
  { name: "Yüksek marjlı", filters: [{ key: "netMargin", min: "15", max: "" }, { key: "grossMargin", min: "30", max: "" }] },
  { name: "Temettü verenler", filters: [{ key: "dividendYield", min: "3", max: "" }] },
];

const BASE_COLUMNS: MetricKey[] = ["price", "change", "marketCap", "pe", "pb"];

const parse = (s: string) => {
  const v = parseFloat(s.replace(",", "."));
  return isFinite(v) ? v : null;
};

let nextId = 1;

export default function Radar({ companies }: { companies: CompanySummary[] }) {
  const sectors = useMemo(
    () => [...new Set(companies.map((c) => c.sector))].sort((a, b) => a.localeCompare(b, "tr")),
    [companies],
  );
  const [filters, setFilters] = useState<Filter[]>([]);
  const [chosenSectors, setChosenSectors] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState<IndexFilter>("all");
  const [sort, setSort] = useState<SortState>({ key: "marketCap", dir: -1 });

  const pool = useMemo(() => filterByIndex(companies, index), [companies, index]);

  const result = useMemo(() => {
    return pool.filter((c) => {
      if (chosenSectors.size && !chosenSectors.has(c.sector)) return false;
      return filters.every((f) => {
        const min = parse(f.min);
        const max = parse(f.max);
        if (min == null && max == null) return true;
        const v = c.metrics[f.key];
        if (v == null) return false;
        const s = inputScale(f.key);
        if (min != null && v < min * s) return false;
        if (max != null && v > max * s) return false;
        return true;
      });
    });
  }, [pool, filters, chosenSectors]);

  const columns = useMemo(() => {
    const extra = filters.map((f) => f.key).filter((k) => !BASE_COLUMNS.includes(k));
    const rest: MetricKey[] = ["roe", "netMargin", "evEbitda"].filter((k) => !extra.includes(k as MetricKey)) as MetricKey[];
    return [...BASE_COLUMNS, ...[...new Set(extra)], ...rest].slice(0, 11);
  }, [filters]);

  const addFilter = (key: MetricKey = "pe") => setFilters((fs) => [...fs, { id: nextId++, key, min: "", max: "" }]);
  const update = (id: number, patch: Partial<Filter>) => setFilters((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: number) => setFilters((fs) => fs.filter((f) => f.id !== id));
  const applyPreset = (p: (typeof PRESETS)[number]) => setFilters(p.filters.map((f) => ({ ...f, id: nextId++ })));

  const exportResult = () => {
    const keys = METRICS.map((m) => m.key);
    const rows = sortCompanies(result, sort).map((c) => [
      c.code,
      c.name,
      c.sector,
      ...keys.map((k) => {
        const v = c.metrics[k];
        const kind = METRIC_MAP[k].kind;
        return v == null ? null : kind === "percent" || kind === "change" ? v * 100 : v;
      }),
    ]);
    const header = ["Kod", "Şirket", "Sektör", ...METRICS.map((m) => (m.kind === "percent" || m.kind === "change" ? `${m.label} (%)` : m.label))];
    return downloadXlsx("hisse-radar", [{ name: "Hisse Radar", rows: [header, ...rows] }]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <div className="card flex items-center justify-between gap-3 p-4">
          <h2 className="text-sm font-semibold">Endeks</h2>
          <select
            value={index}
            onChange={(e) => setIndex(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm"
            title="Resmi BIST endeks bileşenleri (kaynak: KAP)"
          >
            <option value="all">Tüm hisseler</option>
            {Object.entries(INDEX_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold">Hazır taramalar</h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => applyPreset(p)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent hover:text-accent">
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Kriterler</h2>
            {filters.length > 0 && (
              <button onClick={() => setFilters([])} className="text-xs text-muted hover:text-down">
                Temizle
              </button>
            )}
          </div>
          <div className="space-y-3">
            {filters.map((f) => (
              <div key={f.id} className="rounded-lg border border-border p-2.5">
                <div className="mb-2 flex items-center gap-2">
                  <select
                    value={f.key}
                    onChange={(e) => update(f.id, { key: e.target.value as MetricKey })}
                    className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm"
                  >
                    {METRICS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => remove(f.id)} aria-label="Kriteri sil" className="px-1 text-muted hover:text-down">
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    value={f.min}
                    onChange={(e) => update(f.id, { min: e.target.value })}
                    placeholder="en az"
                    inputMode="decimal"
                    className="w-full min-w-0 rounded-md border border-border bg-surface-2 px-2 py-1.5"
                  />
                  <span className="text-muted">–</span>
                  <input
                    value={f.max}
                    onChange={(e) => update(f.id, { max: e.target.value })}
                    placeholder="en çok"
                    inputMode="decimal"
                    className="w-full min-w-0 rounded-md border border-border bg-surface-2 px-2 py-1.5"
                  />
                  <span className="w-10 shrink-0 text-xs text-muted">{inputUnit(f.key)}</span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted">{METRIC_MAP[f.key].hint}</p>
              </div>
            ))}
            <button
              onClick={() => addFilter()}
              className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted hover:border-accent hover:text-accent"
            >
              + Kriter ekle
            </button>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold">Sektör</h2>
          <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
            {sectors.map((s) => {
              const on = chosenSectors.has(s);
              return (
                <button
                  key={s}
                  onClick={() =>
                    setChosenSectors((cur) => {
                      const n = new Set(cur);
                      if (on) n.delete(s);
                      else n.add(s);
                      return n;
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-text"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm">
            <span className="font-semibold">{result.length}</span>
            <span className="text-muted"> / {pool.length} şirket kriterlere uyuyor</span>
          </p>
          <button onClick={exportResult} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-2">
            Excel&apos;e aktar
          </button>
        </div>
        <CompaniesTable companies={result} columns={columns} showSpark={false} initialSort={sort} onSortChange={setSort} />
      </section>
    </div>
  );
}
