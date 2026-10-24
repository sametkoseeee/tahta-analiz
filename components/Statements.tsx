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
const BOLD_ROWS = new Set(["Toplam Varlıklar", "Toplam Özkaynaklar", "Brüt Kâr", "Esas Faaliyet Kârı", "Ana Ortaklık Net Kârı", "Serbest Nakit Akışı"]);

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
  const s = company.statements[mode][tab];
  const annual = mode === "annual";
  // En yeni dönem solda
  const order = s.periods.map((_, i) => i).reverse();

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
        <div className="ml-auto flex items-center gap-2">
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
                <th className="sticky left-0 bg-surface px-4 py-2.5 text-left font-medium">
                  Milyon {company.financialCurrency}
                </th>
                {order.map((i) => (
                  <th key={i} className="whitespace-nowrap px-4 py-2.5 text-right font-medium">
                    {periodLabel(s.periods[i], annual)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.label} className={`border-b border-border last:border-0 hover:bg-surface-2 ${BOLD_ROWS.has(r.label) ? "font-semibold" : ""}`}>
                  <td className="sticky left-0 whitespace-nowrap bg-surface px-4 py-2">{r.label}</td>
                  {order.map((i) => {
                    const v = r.values[i];
                    return (
                      <td key={i} className={`whitespace-nowrap px-4 py-2 text-right ${v != null && v < 0 ? "text-down" : ""}`}>
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
