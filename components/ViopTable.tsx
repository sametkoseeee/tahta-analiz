"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { num } from "@/lib/format";
import { useLive } from "@/lib/live";
import type { ViopRow } from "@/lib/viop";
import { STICKY_CELL, STICKY_HEAD } from "./CompaniesTable";

type Key = "code" | "spot" | "psr" | "contractValue" | "margin" | "leverage";
const KINDS = ["Tümü", "Pay", "Endeks", "Döviz", "Emtia"] as const;

export default function ViopTable({ rows }: { rows: ViopRow[] }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("Tümü");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "code", dir: 1 });
  const { quotes } = useLive();

  // Seans içinde pay fiyatı güncellenince teminat da güncel fiyattan hesaplanır
  const live = useMemo(
    () =>
      rows.map((r) => {
        const p = r.kind === "Pay" ? quotes[r.code]?.p : undefined;
        if (!p) return r;
        const contractValue = p * r.size;
        return { ...r, spot: p, contractValue, margin: (contractValue * r.psr) / 100 };
      }),
    [rows, quotes],
  );

  const list = useMemo(() => {
    const term = q.trim().toLocaleUpperCase("tr");
    return live
      .filter((r) => (kind === "Tümü" || r.kind === kind) && (!term || r.code.includes(term) || r.name.toLocaleUpperCase("tr").includes(term)))
      .sort((a, b) =>
        sort.key === "code" ? a.code.localeCompare(b.code, "tr") * sort.dir : ((a[sort.key] as number) - (b[sort.key] as number)) * sort.dir,
      );
  }, [live, kind, q, sort]);

  const th = (key: Key, label: string, align = "text-right", title?: string) => (
    <th key={key} title={title} className={`whitespace-nowrap px-3 py-2.5 font-medium ${align} ${key === "code" ? STICKY_HEAD : ""}`}>
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${kind === k ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"}`}
            >
              {k}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Dayanak varlık ara"
          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm sm:ml-auto sm:w-56"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              {th("code", `${list.length} Dayanak varlık`, "text-left")}
              {th("spot", "Spot fiyat")}
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Kontrat</th>
              {th("contractValue", "Kontrat değeri", "text-right", "Spot fiyat × kontrat büyüklüğü (TL)")}
              {th("psr", "PSR", "text-right", "Takasbank Fiyat Değişim Aralığı (teminat oranı)")}
              {th("margin", "Teminat ≈", "text-right", "Kontrat değeri × PSR (TL, yaklaşık)")}
              {th("leverage", "Kaldıraç ≈", "text-right", "1 / PSR")}
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.code} className="group border-b border-border last:border-0 hover:bg-surface-2">
                <td className={`px-3 py-2 ${STICKY_CELL}`}>
                  {r.kind === "Pay" ? (
                    <Link href={`/sirketler/${r.code}`} className="font-semibold text-accent">
                      {r.code}
                    </Link>
                  ) : (
                    <span className="font-semibold">{r.code}</span>
                  )}
                  <div className="max-w-28 truncate text-xs text-muted sm:max-w-52">{r.name}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  {num(r.spot, r.spot < 10 ? 4 : 2)} {r.currency === "USD" ? "$" : "₺"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-muted">{r.unit}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{num(r.contractValue, 0)} ₺</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">%{num(r.psr, 1)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{num(r.margin, 0)} ₺</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{num(r.leverage, 1)}x</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted">
                  Aramaya uyan sözleşme yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
