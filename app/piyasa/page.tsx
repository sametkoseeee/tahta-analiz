import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { EconomicEvent } from "@/components/EconomicCalendar";
import MarketTabs from "@/components/MarketTabs";
import { getIndex } from "@/lib/data";
import { getSectorStats } from "@/lib/sectors";
import type { Metrics } from "@/lib/types";

export const metadata: Metadata = {
  alternates: { canonical: "/piyasa" },
  title: "Piyasa: Isı Haritası, 52 Hafta Zirve/Dip, Sektörler ve Ekonomik Takvim",
  description:
    "BIST ısı haritası, 52 haftanın zirvesindeki ve dibindeki hisseler, sektörlerin F/K ve PD/DD ortalamaları, TCMB faiz kararı ve enflasyon açıklama tarihleri",
};

function getEvents(): EconomicEvent[] {
  const file = path.join(process.cwd(), "data", "econ.json");
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf-8")).events as EconomicEvent[]) : [];
}

export default function MarketPage() {
  // Sayfaya yalnızca ısı haritası ve zirve/dip listesinin kullandığı alanlar gömülür
  const companies = getIndex().companies.map((c) => ({
    code: c.code,
    name: c.name,
    sector: c.sector,
    indices: c.indices,
    metrics: {
      price: c.metrics.price,
      change: c.metrics.change,
      change1y: c.metrics.change1y,
      marketCap: c.metrics.marketCap,
      high52: c.metrics.high52,
      low52: c.metrics.low52,
    } as Metrics,
  }));
  const today = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Piyasa</h1>
        <p className="mt-1 text-sm text-muted">
          Borsa İstanbul&apos;un genel görünümü: ısı haritası, yılın zirvesindeki ve dibindeki hisseler, sektör ortalamaları
          ve borsayı etkileyen ekonomik veri açıklamaları.
        </p>
      </div>
      <MarketTabs companies={companies} sectors={getSectorStats()} events={getEvents()} today={today} />
    </div>
  );
}
