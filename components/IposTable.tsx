"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { changeClass, compact, num, signedPct } from "@/lib/format";
import type { Ipo } from "@/lib/ipos";
import { useLive } from "@/lib/live";
import { matchesQuery, norm } from "@/lib/search";
import { STICKY_CELL, STICKY_HEAD, useRowLink } from "./CompaniesTable";

const date = (d: string | null) => (d ? d.split("-").reverse().join(".") : "–");
const days = (a: string | null, b: string | null) =>
  !a ? "–" : a === b || !b ? date(a) : `${a.slice(8)}–${date(b)}`;

type Phase = "upcoming" | "open" | "done";

function phase(d: Ipo, today: string): Phase {
  if (d.start && d.start > today) return "upcoming";
  if (d.start && d.end && d.start <= today && today <= d.end) return "open";
  return "done";
}

const PHASE: Record<Phase, [string, string]> = {
  upcoming: ["Talep toplama yakında", "bg-amber-500/15 text-amber-600 dark:text-amber-400"],
  open: ["Talep toplanıyor", "bg-accent-soft text-accent"],
  done: ["İşlem görüyor", "bg-surface-2 text-muted"],
};

function OfferCard({ d, today }: { d: Ipo; today: string }) {
  const [label, cls] = PHASE[phase(d, today)];
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">{d.code}</div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
      </div>
      <div className="mt-0.5 text-sm text-muted">{d.name}</div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {[
          ["Talep toplama", days(d.start, d.end)],
          ["Fiyat", d.price ? `${num(d.price)} ₺` : "–"],
          ["Halka arz oranı", d.ratio ? `%${num(d.ratio)}` : "–"],
          ["Büyüklük", d.price && d.nominal ? `${compact(d.price * d.nominal)} ₺` : "–"],
          ["Aracı kurum", d.broker ?? "–"],
          ["Pazar", d.market ?? "–"],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="truncate font-medium tabular" title={v}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function IposTable({ items, today }: { items: Ipo[]; today: string }) {
  const { quotes } = useLive();
  const rowLink = useRowLink();
  const [query, setQuery] = useState("");
  const q = norm(query.trim());

  const rows = useMemo(
    () =>
      items.map((d) => {
        const cur = quotes[d.code]?.p ?? d.current;
        // Güncel fiyat değiştiyse getiri yeniden hesaplanır (bedelsiz / bölünme varsa hiç gösterilmez)
        const ret = d.return != null && cur && d.price ? cur / d.price - 1 : null;
        return { ...d, current: cur, return: ret };
      }),
    [items, quotes],
  );
  const offers = rows.filter((d) => phase(d, today) !== "done");
  const shown = q ? rows.filter((d) => matchesQuery(d, q)) : rows;

  return (
    <div className="space-y-6">
      {offers.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Yaklaşan ve Süren Halka Arzlar</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((d) => (
              <OfferCard key={d.code} d={d} today={today} />
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
          <h2 className="font-semibold">Son Halka Arzlar</h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Şirket ya da kod ara"
            aria-label="Halka arzlarda ara"
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent sm:w-56"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                <th className={`px-3 py-2.5 text-left font-medium ${STICKY_HEAD}`}>Şirket</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Talep toplama</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Arz fiyatı</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Büyüklük</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Katılımcı</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Güncel fiyat</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium" title="Halka arz fiyatından bu yana">
                  Getiri
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr
                  key={d.code}
                  onClick={d.current ? rowLink(`/sirketler/${d.code}`) : undefined}
                  className={`group border-b border-border last:border-0 hover:bg-surface-2 ${d.current ? "cursor-pointer" : ""}`}
                >
                  <td className={`px-3 py-2 ${STICKY_CELL}`}>
                    {d.current ? (
                      <Link href={`/sirketler/${d.code}`} className="font-semibold text-accent">
                        {d.code}
                      </Link>
                    ) : (
                      <span className="font-semibold">{d.code}</span>
                    )}
                    <div className="max-w-40 truncate text-xs text-muted sm:max-w-72" title={d.name}>
                      {d.name}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">{days(d.start, d.end)}</td>
                  <td className="px-3 py-2 text-right">{d.price ? num(d.price) : "–"}</td>
                  <td className="px-3 py-2 text-right">{d.size ? compact(d.size) : "–"}</td>
                  <td className="px-3 py-2 text-right">{d.investors ? num(d.investors, 0) : "–"}</td>
                  <td className="px-3 py-2 text-right">{d.current ? num(d.current) : "–"}</td>
                  <td className={`px-3 py-2 text-right font-medium ${changeClass(d.return)}`}>
                    {d.return != null ? signedPct(d.return) : "–"}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted">
                    Sonuç yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
