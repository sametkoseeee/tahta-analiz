"use client";

import { useState } from "react";
import { downloadXlsx, type Sheet } from "@/lib/excel";
import { millions, num, periodLabel } from "@/lib/format";
import type { Financials, Statement } from "@/lib/types";

const TABS = [
  { key: "balance", label: "Bilanço" },
  { key: "income", label: "Gelir Tablosu" },
  { key: "cashflow", label: "Nakit Akışı" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Hisse başına kâr milyon cinsinden gösterilmez */
const RAW_ROWS = new Set(["Hisse Başına Kâr"]);
const BOLD_ROWS = new Set([
  "Toplam Varlıklar",
  "Toplam Özkaynaklar",
  "Hasılat",
  "Brüt Kâr",
  "FAVÖK",
  "Esas Faaliyet Kârı",
  "Net Faiz Geliri",
  "Net Faaliyet Kârı",
  "Teknik Bölüm Dengesi",
  "Ana Ortaklık Net Kârı",
  "Serbest Nakit Akışı",
]);

/** Çeyreklik tabloda gösterilecek dönem sayısı */
const RANGES = [
  { label: "Son 8", n: 8 },
  { label: "Son 20", n: 20 },
  { label: "Tümü", n: Infinity },
];

function toSheet(name: string, s: Statement, annual: boolean): Sheet {
  // Excel'de eskiden yeniye, ham değerlerle
  return {
    name,
    rows: [["Kalem", ...s.periods.map((p) => periodLabel(p, annual))], ...s.rows.map((r) => [r.label, ...r.values])],
  };
}

export function exportCompany(company: Financials) {
  const sheets: Sheet[] = [];
  for (const mode of ["quarterly", "annual"] as const) {
    const suffix = mode === "quarterly" ? "Çeyreklik" : "Yıllık";
    for (const t of TABS) sheets.push(toSheet(`${t.label} (${suffix})`, company.statements[mode][t.key], mode === "annual"));
  }
  return downloadXlsx(`${company.code}-mali-tablolar`, sheets);
}

export default function Statements({ company }: { company: Financials }) {
  const [tab, setTab] = useState<TabKey>("balance");
  const [mode, setMode] = useState<"quarterly" | "annual">("quarterly");
  const [range, setRange] = useState(8);
  const s = company.statements[mode][tab];
  const annual = mode === "annual";
  // En yeni dönem solda; çeyreklikte seçilen sayıda dönem
  const shown = annual ? s.periods.length : Math.min(range, s.periods.length);
  const order = s.periods.map((_, i) => i).slice(s.periods.length - shown).reverse();

  return (
    <section className="card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === t.key ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:text-text"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!annual && s.periods.length > 8 && (
            <div className="flex rounded-lg bg-surface-2 p-0.5 text-xs" aria-label="Dönem sayısı">
              {RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRange(r.n)}
                  className={`rounded-md px-2.5 py-1 ${range === r.n ? "bg-surface font-semibold shadow-sm" : "text-muted"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex rounded-lg bg-surface-2 p-0.5 text-xs">
            {(["quarterly", "annual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-2.5 py-1 ${mode === m ? "bg-surface font-semibold shadow-sm" : "text-muted"}`}
              >
                {m === "quarterly" ? "Çeyreklik" : "Yıllık"}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportCompany(company)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-2"
          >
            Excel&apos;e aktar
          </button>
        </div>
      </div>
      {s.rows.length === 0 ? (
        <p className="p-6 text-sm text-muted">Bu tablo için veri yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead className="text-xs text-muted">
              <tr className="border-b border-border">
                <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left font-medium sm:px-4">
                  Milyon {company.financialCurrency}
                </th>
                {order.map((i) => (
                  <th key={i} className="whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">
                    {periodLabel(s.periods[i], annual)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.label} className={`group border-b border-border last:border-0 hover:bg-surface-2 ${BOLD_ROWS.has(r.label) ? "font-semibold" : ""}`}>
                  {/* Telefonda uzun kalem adları iki satıra bölünür, yanında daha çok dönem görünür */}
                  <td className="sticky left-0 z-10 min-w-36 max-w-44 bg-surface px-3 py-2 leading-snug group-hover:bg-surface-2 sm:max-w-none sm:whitespace-nowrap sm:px-4">
                    {r.label}
                  </td>
                  {order.map((i) => {
                    const v = r.values[i];
                    return (
                      <td key={i} className={`whitespace-nowrap px-3 py-2 text-right sm:px-4 ${v != null && v < 0 ? "text-down" : ""}`}>
                        {RAW_ROWS.has(r.label) ? num(v) : millions(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
