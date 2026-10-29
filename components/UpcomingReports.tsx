"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { periodLabel } from "@/lib/format";
import type { UpcomingReport } from "@/lib/reports";
import { matchesQuery, norm } from "@/lib/search";
import WatchButton from "./WatchButton";

const dayFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: "UTC" });

/** Yaklaşan bilançolar gün gün; arama kutusuyla tek hisseye daraltılabilir */
export default function UpcomingReports({ upcoming }: { upcoming: UpcomingReport[] }) {
  const [query, setQuery] = useState("");
  const q = norm(query.trim());
  const byDay = useMemo(() => {
    const m = new Map<string, UpcomingReport[]>();
    upcoming.filter((u) => !q || matchesQuery(u, q)).forEach((u) => m.set(u.date, [...(m.get(u.date) ?? []), u]));
    return m;
  }, [upcoming, q]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hisse ara (ör. THYAO)"
        aria-label="Yaklaşan bilançolarda hisse ara"
        className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent sm:w-64"
      />

      {byDay.size === 0 && (
        <div className="card p-8 text-center text-sm text-muted">
          {q ? `“${query.trim()}” bilanço tarihini henüz KAP'ta duyurmamış.` : "Duyurulmuş yaklaşan bilanço tarihi yok."}
        </div>
      )}

      <div className="space-y-4">
        {[...byDay.entries()].map(([day, items]) => {
          const d = new Date(`${day}T00:00:00Z`);
          return (
            <section key={day} className="card">
              <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
                <h2 className="font-semibold">
                  {dayFmt.format(d)} <span className="font-normal text-muted">{weekdayFmt.format(d)}</span>
                </h2>
                <span className="text-xs text-muted">{items.length} şirket</span>
              </div>
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                {items.map((u) => (
                  <li key={u.code} className="flex items-center gap-3 bg-surface px-4 py-3">
                    <WatchButton code={u.code} compact />
                    <Link href={`/sirketler/${u.code}`} className="min-w-0 flex-1">
                      <div className="font-semibold text-accent">{u.code}</div>
                      <div className="truncate text-xs text-muted">{u.name}</div>
                    </Link>
                    <a
                      href={`https://www.kap.org.tr/tr/Bildirim/${u.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-right text-xs text-muted hover:text-accent"
                      title="KAP'taki finansal takvim bildirimi"
                    >
                      <div>Bilanço dönemi</div>
                      <div className="font-medium text-text">{u.periodEnd ? periodLabel(u.periodEnd.slice(0, 7)) : "–"}</div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
