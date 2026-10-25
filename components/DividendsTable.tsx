"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dividend } from "@/lib/dividends";
import { num, pct } from "@/lib/format";
import { useLive } from "@/lib/live";
import { STICKY_CELL, STICKY_HEAD } from "./CompaniesTable";
import WatchButton from "./WatchButton";

type Tab = "upcoming" | "paid" | "none";
type Key = "code" | "gross" | "net" | "yield" | "bonusPct" | "payDate" | "meeting";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Yaklaşan ödemeler" },
  { key: "paid", label: "Ödenenler" },
  { key: "none", label: "Dağıtmayanlar" },
];

const STATUS_STYLE: Record<Dividend["status"], string> = {
  Teklif: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Onaylandı: "bg-accent-soft text-accent",
  Ödendi: "bg-up-soft text-up",
  Dağıtılmayacak: "bg-surface-2 text-muted",
};

const date = (d: string | null) => (d ? d.split("-").reverse().join(".") : "–");

export default function DividendsTable({ items, today }: { items: Dividend[]; today: string }) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 } | null>(null);
  const { quotes } = useLive();

  const withYield = useMemo(
    () =>
      items.map((d) => {
        const price = quotes[d.code]?.p ?? d.price;
        return { ...d, yield: d.gross && price ? d.gross / price : null };
      }),
    [items, quotes],
  );

  const counts = useMemo(() => {
    const c = { upcoming: 0, paid: 0, none: 0 };
    withYield.forEach((d) => c[group(d, today)]++);
    return c;
  }, [withYield, today]);

  const list = useMemo(() => {
    const rows = withYield.filter((d) => group(d, today) === tab);
    // Varsayılan: yaklaşanlar en yakın ödeme önce, ödenenler en yeni önce
    const s = sort ?? { key: "payDate" as Key, dir: tab === "upcoming" ? (1 as const) : (-1 as const) };
    return rows.sort((a, b) => {
      const va = a[s.key];
      const vb = b[s.key];
      if (va == null && vb == null) return a.code.localeCompare(b.code, "tr");
      if (va == null) return 1;
      if (vb == null) return -1;
      return (typeof va === "string" ? va.localeCompare(String(vb), "tr") : va - (vb as number)) * s.dir;
    });
  }, [withYield, tab, sort, today]);

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
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setSort(null);
            }}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
              tab === t.key ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {t.label} <span className="opacity-70">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              {th("code", "Hisse", "text-left")}
              {th("gross", "Brüt ₺", "text-right", "1 TL nominal pay başına brüt nakit kâr payı")}
              {th("net", "Net ₺", "text-right", "Stopaj düşülmüş, pay başına")}
              {th("yield", "Verim", "text-right", "Brüt kâr payı / güncel fiyat")}
              {th("bonusPct", "Bedelsiz", "text-right", "Pay olarak (bedelsiz) dağıtım oranı")}
              {th("payDate", "Ödeme", "text-right", "Nakit kâr payı hak kullanım (ödeme) tarihi")}
              {th("meeting", "Genel kurul", "text-right")}
              <th className="px-3 py-2.5 text-left font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.code} className="group border-b border-border last:border-0 hover:bg-surface-2">
                <td className={`px-3 py-2 ${STICKY_CELL}`}>
                  <div className="flex items-center gap-2.5">
                    <WatchButton code={d.code} compact />
                    <Link href={`/sirketler/${d.code}`} className="block min-w-0">
                      <div className="font-semibold text-accent">{d.code}</div>
                      <div className="max-w-28 truncate text-xs text-muted sm:max-w-52">{d.name}</div>
                    </Link>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{d.gross ? num(d.gross, 4) : "–"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{d.net ? num(d.net, 4) : "–"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{pct(d.yield, 2)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{d.bonusPct ? `%${num(d.bonusPct, 2)}` : "–"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{date(d.payDate)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-muted">{date(d.meeting)}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <a
                    href={`https://www.kap.org.tr/tr/Bildirim/${d.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title={d.summary ?? "KAP bildirimi"}
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[d.status]}`}
                  >
                    {d.status}
                  </a>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-muted">
                  Bu listede şirket yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Tutarlar 1 TL nominal değerli pay başınadır; verim, brüt kâr payının güncel fiyata oranıdır. Ödeme tarihleri
        şirketlerin KAP bildirimlerindeki (genel kurulca onaylanan ya da teklif edilen) tarihlerdir. Duruma tıklayınca KAP
        bildirimi açılır.
      </p>
    </div>
  );
}

function group(d: Dividend, today: string): Tab {
  if (d.status === "Dağıtılmayacak") return "none";
  if (d.status === "Ödendi" || (d.payDate && d.payDate < today)) return "paid";
  return "upcoming";
}
