"use client";

import { useEffect, useState } from "react";
import EconomicCalendar, { type EconomicEvent } from "./EconomicCalendar";
import Heatmap, { type HeatItem } from "./Heatmap";
import HighLow from "./HighLow";
import SectorTable from "./SectorTable";
import type { SectorStat } from "@/lib/sectors";

const TABS = [
  { key: "isi-haritasi", label: "Isı haritası" },
  { key: "zirve-dip", label: "52 hafta zirve / dip" },
  { key: "sektorler", label: "Sektörler" },
  { key: "ekonomik-takvim", label: "Ekonomik takvim" },
] as const;

type Tab = (typeof TABS)[number]["key"];

/** Piyasa sayfası sekmeleri; seçili sekme adreste (#sektorler) tutulur ki paylaşılabilsin */
export default function MarketTabs({
  companies,
  sectors,
  events,
  today,
}: {
  companies: HeatItem[];
  sectors: SectorStat[];
  events: EconomicEvent[];
  today: string;
}) {
  const [tab, setTab] = useState<Tab>("isi-haritasi");
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      if (TABS.some((t) => t.key === h)) setTab(h as Tab);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const select = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => select(t.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
              tab === t.key ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "isi-haritasi" && <Heatmap companies={companies} />}
      {tab === "zirve-dip" && <HighLow companies={companies} />}
      {tab === "sektorler" && <SectorTable stats={sectors} />}
      {tab === "ekonomik-takvim" && <EconomicCalendar events={events} today={today} />}
    </div>
  );
}
