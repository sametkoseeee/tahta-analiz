import type { Metadata } from "next";
import Link from "next/link";
import ReportsTabs from "@/components/ReportsTabs";
import WatchButton from "@/components/WatchButton";
import { periodLabel } from "@/lib/format";
import { getReports, type UpcomingReport } from "@/lib/reports";

export const metadata: Metadata = {
  title: "Yaklaşan Bilançolar",
  description: "Bilanço açıklama tarihini KAP'ta duyuran BIST şirketleri, gün gün",
};

const dayFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: "UTC" });

export default function UpcomingReportsPage() {
  const { upcoming } = getReports();
  const byDay = new Map<string, UpcomingReport[]>();
  upcoming.forEach((u) => byDay.set(u.date, [...(byDay.get(u.date) ?? []), u]));

  return (
    <div className="space-y-4">
      <ReportsTabs active="upcoming" />
      <p className="text-sm text-muted">
        Her şirket finansal rapor tarihini önceden açıklamaz; burada yalnızca KAP&apos;ta &quot;Finansal Takvim&quot;
        bildirimiyle tarih duyuran şirketler listelenir. Tarihler şirketlerin planıdır, değişebilir.
      </p>

      {byDay.size === 0 && (
        <div className="card p-8 text-center text-sm text-muted">Duyurulmuş yaklaşan bilanço tarihi yok.</div>
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
              <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
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
