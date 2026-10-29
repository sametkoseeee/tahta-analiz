"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { changeClass, compact, num, periodLabel, signedPct } from "@/lib/format";
import { useLiveCompanies } from "@/lib/live";
import { matchesQuery, norm } from "@/lib/search";
import type { RecentReport } from "@/lib/reports";
import { STICKY_CELL, STICKY_HEAD } from "./CompaniesTable";
import WatchButton from "./WatchButton";

type Key = "code" | "at" | "price" | "change" | "marketCap" | "netProfit" | "netProfitYoY" | "pe" | "pb";

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });
const PAGE = 50;

function value(r: RecentReport, k: Key): number | string | null {
  if (k === "code" || k === "at") return r[k];
  if (k === "netProfit" || k === "netProfitYoY") return r[k];
  return r.metrics[k];
}

export default function RecentReportsTable({ reports }: { reports: RecentReport[] }) {
  const periods = useMemo(() => [...new Set(reports.map((r) => r.period))].sort().reverse(), [reports]);
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "at", dir: -1 });
  const [page, setPage] = useState(0);
  const live = useLiveCompanies(reports);

  const [query, setQuery] = useState("");
  const q = norm(query.trim());

  const list = useMemo(() => {
    const rows = live.filter((r) => (period === "all" || r.period === period) && (!q || matchesQuery(r, q)));
    return rows.sort((a, b) => {
      const va = value(a, sort.key);
      const vb = value(b, sort.key);
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // boşlar her zaman sonda
      if (vb == null) return -1;
      return (typeof va === "string" ? va.localeCompare(String(vb), "tr") : va - (vb as number)) * sort.dir;
    });
  }, [live, period, sort, q]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE));
  const current = Math.min(page, pageCount - 1);
  const rows = list.slice(current * PAGE, (current + 1) * PAGE);

  const th = (key: Key, label: string, align = "text-right", title?: string) => (
    <th
      key={key}
      className={`whitespace-nowrap px-3 py-2.5 font-medium ${align} ${key === "code" ? STICKY_HEAD : ""}`}
      title={title}
    >
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
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setPage(0);
          }}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
          aria-label="Dönem"
        >
          <option value="all">Tüm dönemler (en son açıklanan)</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {periodLabel(p)} ({reports.filter((r) => r.period === p).length} şirket)
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Hisse ara (ör. THYAO)"
          aria-label="Bilançolarda hisse ara"
          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent sm:ml-auto sm:w-64"
        />
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                {th("code", `${list.length} Hisse`, "text-left")}
                {th("at", "Açıklanma", "text-left")}
                <th className="px-3 py-2.5 text-left font-medium">Dönem</th>
                {th("price", "Son Fiyat")}
                {th("change", "Gün %")}
                {th("marketCap", "Piyasa Değeri")}
                {th("netProfit", "Net Dönem Kârı", "text-right", "Yılbaşından bu döneme ana ortaklık net kârı")}
                {th("netProfitYoY", "Yıllık Değişim", "text-right", "Geçen yılın aynı dönemine göre net kâr değişimi")}
                {th("pe", "F/K")}
                {th("pb", "PD/DD")}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const at = new Date(r.at);
                return (
                  <tr key={r.code} className="group border-b border-border last:border-0 hover:bg-surface-2">
                    <td className={`px-3 py-2 ${STICKY_CELL}`}>
                      <div className="flex items-center gap-2.5">
                        <WatchButton code={r.code} compact />
                        <Link href={`/sirketler/${r.code}`} className="block min-w-0">
                          <div className="font-semibold text-accent">{r.code}</div>
                          <div className="max-w-28 truncate text-xs text-muted sm:max-w-52">{r.name}</div>
                        </Link>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <a
                        href={`https://www.kap.org.tr/tr/Bildirim/${r.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent hover:underline"
                        title="KAP bildirimi"
                      >
                        {dateFmt.format(at)}
                      </a>
                      <div className="text-xs text-muted">{timeFmt.format(at)}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{periodLabel(r.period)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{num(r.metrics.price)}</td>
                    <td className={`whitespace-nowrap px-3 py-2 text-right ${changeClass(r.metrics.change)}`}>
                      {signedPct(r.metrics.change)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{compact(r.metrics.marketCap)}</td>
                    <td className={`whitespace-nowrap px-3 py-2 text-right ${r.netProfit != null && r.netProfit < 0 ? "text-down" : ""}`}>
                      {compact(r.netProfit)}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 text-right ${changeClass(r.netProfitYoY)}`}>
                      {signedPct(r.netProfitYoY, 1)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{num(r.metrics.pe)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{num(r.metrics.pb)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-muted">
                    {q ? `“${query.trim()}” için bu dönemde açıklanan bilanço yok.` : "Bu dönemde açıklanan bilanço yok."}
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
      <p className="text-xs text-muted">
        Net dönem kârı ve yıllık değişim, mali tabloların İş Yatırım&apos;da güncellenmesiyle (genelde açıklamadan 1–2 gün
        sonra) dolar; zarar eden dönemlerde yıllık değişim hesaplanmaz.
      </p>
    </div>
  );
}
