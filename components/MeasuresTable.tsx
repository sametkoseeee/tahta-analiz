"use client";

import Link from "next/link";
import { useState } from "react";
import type { Measure, MeasureKind } from "@/lib/measures";
import { STICKY_CELL, STICKY_HEAD } from "./CompaniesTable";
import WatchButton from "./WatchButton";

type Tab = "active" | "ended";

const COLUMNS: { kind: MeasureKind; label: string }[] = [
  { kind: "credit", label: "Kredili alım ve açığa satış" },
  { kind: "gross", label: "Brüt takas" },
  { kind: "package", label: "Emir paketi" },
  { kind: "single", label: "Tek fiyat" },
  { kind: "internet", label: "İnternet emir yasağı" },
];

const date = (d: string) => d.split("-").reverse().join(".");

export default function MeasuresTable({ active, ended }: { active: Measure[]; ended: Measure[] }) {
  const [tab, setTab] = useState<Tab>("active");
  const list = tab === "active" ? active : ended;
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Süren tedbirler", count: active.length },
    { key: "ended", label: "Son 4 ayda bitenler", count: ended.length },
  ];

  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
              tab === t.key ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {t.label} <span className="opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className={`whitespace-nowrap px-3 py-2.5 text-left font-medium ${STICKY_HEAD}`}>Hisse</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Başlangıç</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Bitiş</th>
              {COLUMNS.map((c) => (
                <th key={c.kind} className="px-3 py-2.5 text-center font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-3 py-2.5 text-left font-medium">Duyuru</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={`${m.code}-${m.id}`} className="group border-b border-border last:border-0 hover:bg-surface-2">
                <td className={`px-3 py-2 ${STICKY_CELL}`}>
                  <div className="flex items-center gap-2.5">
                    <WatchButton code={m.code} compact />
                    <Link href={`/sirketler/${m.code}`} className="block min-w-0">
                      <div className="font-semibold text-accent">{m.code}</div>
                      <div className="max-w-28 truncate text-xs text-muted sm:max-w-52">{m.name}</div>
                    </Link>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{date(m.start)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{date(m.end)}</td>
                {COLUMNS.map((c) => (
                  <td key={c.kind} className="px-3 py-2 text-center">
                    {m.kinds.includes(c.kind) ? (
                      <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-down-soft text-xs font-bold text-down" aria-label="Var">
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted">–</span>
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2">
                  <a
                    href={`https://www.kap.org.tr/tr/Bildirim/${m.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title={m.text}
                    className="text-xs text-accent hover:underline"
                  >
                    KAP
                  </a>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 4} className="px-3 py-10 text-center text-muted">
                  {tab === "active" ? "Şu anda tedbir uygulanan hisse yok." : "Bu listede hisse yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
