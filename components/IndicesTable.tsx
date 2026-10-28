"use client";

import { useMemo, useState } from "react";
import type { IndexRow } from "@/lib/indices-data";
import { changeClass, compact, num, signedPct } from "@/lib/format";
import { STICKY_CELL, STICKY_HEAD } from "./CompaniesTable";

type Group = "all" | IndexRow["group"];
type RetKey = keyof IndexRow["ret"];
type Key = "code" | "price" | "change" | "members" | "marketCap" | RetKey;

const GROUPS: { key: Group; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "Ana", label: "Ana endeksler" },
  { key: "Sektör", label: "Sektör" },
  { key: "Katılım", label: "Katılım" },
];

const RETS: { key: RetKey; label: string }[] = [
  { key: "w1", label: "1 hafta" },
  { key: "m1", label: "1 ay" },
  { key: "m3", label: "3 ay" },
  { key: "m6", label: "6 ay" },
  { key: "ytd", label: "Yılbaşı" },
  { key: "y1", label: "1 yıl" },
  { key: "y3", label: "3 yıl" },
  { key: "y5", label: "5 yıl" },
];

const value = (r: IndexRow, k: Key): number | string | null =>
  k in r.ret ? r.ret[k as RetKey] : (r[k as keyof IndexRow] as number | string | null);

export default function IndicesTable({ rows }: { rows: IndexRow[] }) {
  const [group, setGroup] = useState<Group>("all");
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 } | null>(null);

  const list = useMemo(() => {
    const filtered = rows.filter((r) => group === "all" || r.group === group);
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      const va = value(a, sort.key);
      const vb = value(b, sort.key);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (typeof va === "string" ? va.localeCompare(String(vb), "tr") : va - (vb as number)) * sort.dir;
    });
  }, [rows, group, sort]);

  const th = (key: Key, label: string, align = "text-right", title?: string) => (
    <th
      key={key}
      className={`whitespace-nowrap px-3 py-2.5 font-medium ${align} ${key === "code" ? STICKY_HEAD : ""}`}
      title={title}
    >
      <button
        onClick={() =>
          setSort((cur) => (cur?.key === key ? { key, dir: (cur.dir * -1) as 1 | -1 } : { key, dir: key === "code" ? 1 : -1 }))
        }
        className={`inline-flex items-center gap-1 hover:text-text ${sort?.key === key ? "text-text" : ""}`}
      >
        {label}
        {sort?.key === key && <span className="text-[10px]">{sort.dir === 1 ? "▲" : "▼"}</span>}
      </button>
    </th>
  );

  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGroup(g.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
              group === g.key ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              {th("code", "Endeks", "text-left")}
              {th("price", "Son değer")}
              {th("change", "Gün %")}
              {th("members", "Şirket", "text-right", "Endeksteki şirket sayısı (KAP'ın yayımladığı ana endekslerde)")}
              {th("marketCap", "Piyasa değeri", "text-right", "Endeksteki şirketlerin toplam piyasa değeri")}
              {RETS.map((r) => th(r.key, r.label))}
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.code} className="group border-b border-border last:border-0 hover:bg-surface-2">
                <td className={`px-3 py-2 ${STICKY_CELL}`}>
                  <div className="font-semibold">{r.code}</div>
                  <div className="max-w-36 truncate text-xs text-muted sm:max-w-56">{r.name}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{num(r.price)}</td>
                <td className={`whitespace-nowrap px-3 py-2 text-right ${changeClass(r.change)}`}>{signedPct(r.change)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-muted">{r.members ?? "–"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{r.marketCap ? `₺${compact(r.marketCap)}` : "–"}</td>
                {RETS.map((k) => (
                  <td key={k.key} className={`whitespace-nowrap px-3 py-2 text-right ${changeClass(r.ret[k.key])}`}>
                    {signedPct(r.ret[k.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
