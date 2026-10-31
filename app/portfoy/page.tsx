import type { Metadata } from "next";
import Portfolio from "@/components/Portfolio";
import { getIndex } from "@/lib/data";
import { dividendPresets } from "@/lib/dividends";

export const metadata: Metadata = {
  title: "Portföyüm",
  description: "Hisselerini ve maliyetini gir; portföy değeri, kâr / zarar ve beklenen temettü",
};

export default function PortfolioPage() {
  const quotes = getIndex()
    .companies.map((c) => ({ code: c.code, name: c.name, price: c.metrics.price, change: c.metrics.change }))
    .sort((a, b) => a.code.localeCompare(b.code, "tr"));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portföyüm</h1>
        <p className="mt-1 text-sm text-muted">Hisselerin, güncel değeri, kâr / zararın ve beklenen temettün.</p>
      </div>
      <Portfolio quotes={quotes} dividends={dividendPresets()} />
    </div>
  );
}
