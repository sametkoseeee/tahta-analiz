"use client";

/** scripts/fetch_econ.py: TÜİK Ulusal Veri Yayımlama Takvimi ve TCMB takviminden seçilmiş açıklamalar */
export type EconomicEvent = {
  /** "2026-11-03T10:00" (TSİ) */
  date: string;
  title: string;
  period: string | null;
  org: string;
  /** 3: piyasayı en çok etkileyen (faiz kararı, enflasyon, büyüme) */
  weight: number;
  link: string | null;
};

const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function dayLabel(d: string) {
  const dt = new Date(`${d}T12:00:00`);
  return `${d.split("-").reverse().join(".")} ${DAYS[dt.getDay()]}`;
}

export default function EconomicCalendar({ events, today }: { events: EconomicEvent[]; today: string }) {
  if (events.length === 0) return <div className="card p-8 text-center text-sm text-muted">Takvim verisi henüz yüklenmedi.</div>;
  const days = new Map<string, EconomicEvent[]>();
  events.forEach((e) => days.set(e.date.slice(0, 10), [...(days.get(e.date.slice(0, 10)) ?? []), e]));
  return (
    <section className="space-y-3">
      <div className="card divide-y divide-border">
        {[...days.entries()].map(([day, list]) => {
          const past = day < today;
          return (
            <div key={day} className={`grid gap-2 p-3 sm:grid-cols-[180px_minmax(0,1fr)] ${past ? "opacity-55" : ""}`}>
              <div className="text-sm font-semibold">
                {dayLabel(day)}
                {day === today && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">Bugün</span>}
              </div>
              <ul className="space-y-1.5">
                {list.map((e) => (
                  <li key={e.title} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                    <span className="w-12 shrink-0 tabular text-muted">{e.date.slice(11, 16)}</span>
                    <span className={e.weight >= 3 ? "font-semibold" : ""}>
                      {e.title}
                      {e.weight >= 3 && <span className="ml-1.5 text-amber-500" title="Piyasayı en çok etkileyen açıklamalardan">●</span>}
                    </span>
                    {e.period && <span className="text-xs text-muted">{e.period}</span>}
                    <span className="ml-auto text-xs text-muted">{e.org}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        Saatler Türkiye saatidir. <span className="text-amber-500">●</span> işaretli açıklamalar (faiz kararı, enflasyon,
        büyüme) borsayı genellikle en çok etkileyenlerdir. Kaynak: TÜİK Ulusal Veri Yayımlama Takvimi ve TCMB; tarihler
        kurumlarca değiştirilebilir.
      </p>
    </section>
  );
}
