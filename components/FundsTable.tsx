"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { changeClass, compact, fundPrice, num, signedPct } from "@/lib/format";
import type { FundSummary } from "@/lib/types";
import Sparkline from "./Sparkline";
import WatchButton from "./WatchButton";

type Key = "code" | "price" | "change" | "r1m" | "r3m" | "r6m" | "rytd" | "r1y" | "r3y" | "size" | "investors" | "risk";

const COLUMNS: { key: Key; label: string; title?: string }[] = [
  { key: "price", label: "Fiyat" },
  { key: "change", label: "Günlük" },
  { key: "r1m", label: "1 Ay" },
  { key: "r3m", label: "3 Ay" },
  { key: "r6m", label: "6 Ay" },
  { key: "rytd", label: "YB", title: "Yılbaşından bu yana getiri" },
  { key: "r1y", label: "1 Yıl" },
  { key: "r3y", label: "3 Yıl" },
  { key: "size", label: "Büyüklük", title: "Portföy büyüklüğü" },
  { key: "investors", label: "Yatırımcı", title: "Yatırımcı sayısı" },
  { key: "risk", label: "Risk", title: "Risk değeri: 1 (düşük) – 7 (yüksek)" },
];

const RETURN_KEYS = new Set<Key>(["change", "r1m", "r3m", "r6m", "rytd", "r1y", "r3y"]);
const PAGE = 50;

function cell(f: FundSummary, k: Key): string {
  const v = f[k as keyof FundSummary] as number | null;
  if (k === "price") return fundPrice(v);
  if (k === "size") return compact(v);
  if (k === "investors") return num(v, 0);
  if (k === "risk") return v == null ? "–" : String(v);
  return signedPct(v);
}

/** "Hisse Senedi Şemsiye Fonu" → "Hisse Senedi" */
const short = (u: string) => u.replace(/\s*Şemsiye Fonu$/i, "").trim();

/** bare: izleme listesindeki gibi az fon için filtre çubuğu olmadan */
export default function FundsTable({ funds, bare = false }: { funds: FundSummary[]; bare?: boolean }) {
  const [q, setQ] = useState("");
  const [umbrella, setUmbrella] = useState("all");
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "size", dir: -1 });
  const [page, setPage] = useState(0);

  const umbrellas = useMemo(() => {
    const count = new Map<string, number>();
    funds.forEach((f) => f.umbrella && count.set(f.umbrella, (count.get(f.umbrella) ?? 0) + 1));
    return [...count.entries()].sort((a, b) => b[1] - a[1]);
  }, [funds]);

  const list = useMemo(() => {
    const term = q.trim().toLocaleUpperCase("tr");
    const filtered = funds.filter(
      (f) =>
        (umbrella === "all" || f.umbrella === umbrella) &&
        (!term || f.code.includes(term) || f.name.toLocaleUpperCase("tr").includes(term) ||
          (f.founder ?? "").toLocaleUpperCase("tr").includes(term)),
    );
    return filtered.sort((a, b) => {
      if (sort.key === "code") return a.code.localeCompare(b.code, "tr") * sort.dir;
      const va = a[sort.key as keyof FundSummary] as number | null;
      const vb = b[sort.key as keyof FundSummary] as number | null;
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // boşlar her zaman sonda
      if (vb == null) return -1;
      return (va - vb) * sort.dir;
    });
  }, [funds, q, umbrella, sort]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE));
  const current = Math.min(page, pageCount - 1);
  const rows = list.slice(current * PAGE, (current + 1) * PAGE);

  const header = (key: Key, label: string, title?: string, align = "text-right") => (
    <th key={key} className={`whitespace-nowrap px-3 py-2.5 font-medium ${align}`} title={title}>
      <button
        onClick={() => {
          setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "code" ? 1 : -1 }));
          setPage(0);
        }}
        className={`inline-flex items-center gap-1 hover:text-text ${sort.key === key ? "text-text" : ""}`}
      >
        {label}
        {sort.key === key && <span className="text-[10px]">{sort.dir === 1 ? "▲" : "▼"}</span>}
      </button>
    </th>
  );

  return (
    <div className="space-y-3">
      <div className={`flex-wrap items-center gap-2 ${bare ? "hidden" : "flex"}`}>
        <select
          value={umbrella}
          onChange={(e) => {
            setUmbrella(e.target.value);
            setPage(0);
          }}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
          aria-label="Fon türü"
        >
          <option value="all">Tüm fon türleri ({funds.length})</option>
          {umbrellas.map(([u, n]) => (
            <option key={u} value={u}>
              {short(u)} ({n})
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Fon kodu, adı ya da portföy şirketi"
          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm sm:ml-auto sm:w-72"
        />
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                {header("code", "Fon", undefined, "text-left")}
                <th className="px-3 py-2.5 text-left font-medium">3 Ay</th>
                {COLUMNS.map((c) => header(c.key, c.label, c.title))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.code} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <WatchButton code={f.code} compact />
                      <Link href={`/fonlar/${f.code}`} className="block min-w-0">
                        <div className="font-semibold text-accent">{f.code}</div>
                        <div className="max-w-64 truncate text-xs text-muted" title={f.name}>
                          {f.name}
                        </div>
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Sparkline values={f.spark} />
                  </td>
                  {COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      className={`whitespace-nowrap px-3 py-2 text-right ${
                        RETURN_KEYS.has(c.key) ? changeClass(f[c.key as keyof FundSummary] as number | null) : ""
                      }`}
                    >
                      {cell(f, c.key)}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 2} className="px-3 py-10 text-center text-muted">
                    Aramaya uyan fon yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted tabular">
            <span>
              {current * PAGE + 1}–{Math.min((current + 1) * PAGE, list.length)} / {list.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(current - 1)}
                disabled={current === 0}
                className="rounded-md px-2.5 py-1 hover:bg-surface-2 hover:text-text disabled:opacity-40 disabled:hover:bg-transparent"
              >
                ‹ Önceki
              </button>
              <span className="px-2">
                {current + 1} / {pageCount}
              </span>
              <button
                onClick={() => setPage(current + 1)}
                disabled={current >= pageCount - 1}
                className="rounded-md px-2.5 py-1 hover:bg-surface-2 hover:text-text disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Sonraki ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
