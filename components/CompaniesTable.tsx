"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { changeClass } from "@/lib/format";
import { formatMetric, METRIC_MAP } from "@/lib/metrics";
import type { CompanySummary, MetricKey } from "@/lib/types";
import Sparkline from "./Sparkline";
import WatchButton from "./WatchButton";

export type SortState = { key: MetricKey | "code"; dir: 1 | -1 };

export function sortCompanies(list: CompanySummary[], sort: SortState) {
  return [...list].sort((a, b) => {
    if (sort.key === "code") return a.code.localeCompare(b.code, "tr") * sort.dir;
    const va = a.metrics[sort.key];
    const vb = b.metrics[sort.key];
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // boşlar her zaman sonda
    if (vb == null) return -1;
    return (va - vb) * sort.dir;
  });
}

const CHANGE_KEYS = new Set<MetricKey>(["change", "change1y", "revenueGrowth", "netIncomeGrowth"]);

export default function CompaniesTable({
  companies,
  columns,
  showSpark = true,
  initialSort = { key: "marketCap", dir: -1 },
  onSortChange,
  pageSize = 50,
}: {
  companies: CompanySummary[];
  columns: MetricKey[];
  showSpark?: boolean;
  initialSort?: SortState;
  onSortChange?: (s: SortState) => void;
  pageSize?: number;
}) {
  const [sort, setSortState] = useState<SortState>(initialSort);
  // Liste değişince (filtre, sektör) ilk sayfaya dön
  const [paging, setPaging] = useState({ list: companies, page: 0 });
  if (paging.list !== companies) setPaging({ list: companies, page: 0 });
  const setPage = (page: number) => setPaging({ list: companies, page });

  const setSort = (fn: (s: SortState) => SortState) => {
    const next = fn(sort);
    setSortState(next);
    setPage(0);
    onSortChange?.(next);
  };
  const sorted = useMemo(() => sortCompanies(companies, sort), [companies, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(paging.page, pageCount - 1);
  const rows = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const header = (key: SortState["key"], label: string, title?: string, align = "text-right") => (
    <th className={`whitespace-nowrap px-3 py-2.5 font-medium ${align}`} title={title}>
      <button
        onClick={() => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "code" ? 1 : -1 }))}
        className={`inline-flex items-center gap-1 hover:text-text ${sort.key === key ? "text-text" : ""}`}
      >
        {label}
        {sort.key === key && <span className="text-[10px]">{sort.dir === 1 ? "▲" : "▼"}</span>}
      </button>
    </th>
  );

  return (
    <div className="card">
      <div className="overflow-x-auto">
      <table className="w-full text-sm tabular">
        <thead className="border-b border-border text-xs text-muted">
          <tr>
            {header("code", "Hisse", undefined, "text-left")}
            {showSpark && <th className="px-3 py-2.5 text-left font-medium">3 Ay</th>}
            {columns.map((k) => header(k, METRIC_MAP[k].short, `${METRIC_MAP[k].label}: ${METRIC_MAP[k].hint}`))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.code} className="border-b border-border last:border-0 hover:bg-surface-2">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <WatchButton code={c.code} compact />
                  <Link href={`/sirketler/${c.code}`} className="block min-w-0">
                    <div className="font-semibold text-accent">{c.code}</div>
                    <div className="max-w-56 truncate text-xs text-muted">{c.name}</div>
                  </Link>
                </div>
              </td>
              {showSpark && (
                <td className="px-3 py-2">
                  <Sparkline values={c.spark} />
                </td>
              )}
              {columns.map((k) => (
                <td key={k} className={`whitespace-nowrap px-3 py-2 text-right ${CHANGE_KEYS.has(k) ? changeClass(c.metrics[k]) : ""}`}>
                  {formatMetric(k, c.metrics[k])}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 2} className="px-3 py-10 text-center text-muted">
                Kriterlere uyan şirket yok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted tabular">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} / {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="rounded-md px-2.5 py-1 hover:bg-surface-2 hover:text-text disabled:opacity-40 disabled:hover:bg-transparent"
            >
              ‹ Önceki
            </button>
            <span className="px-2">
              {page + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pageCount - 1}
              className="rounded-md px-2.5 py-1 hover:bg-surface-2 hover:text-text disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Sonraki ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
