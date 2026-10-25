import type { Metadata } from "next";
import { Suspense } from "react";
import StockCompare from "@/components/StockCompare";
import { getIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Hisse Karşılaştırma",
  description: "BIST hisselerinin oranlarını ve fiyat performansını yan yana karşılaştır",
};

export default function StockComparePage() {
  const stocks = getIndex().companies.map((c) => ({ code: c.code, name: c.name, sector: c.sector, metrics: c.metrics }));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hisse Karşılaştırma</h1>
        <p className="mt-1 text-sm text-muted">
          En fazla 5 hisse seç; fiyat performanslarını aynı başlangıca (100) endekslenmiş grafikte, değerleme, kârlılık,
          büyüme ve borçluluk oranlarını tabloda yan yana gör. Bağlantıyı paylaşırsan karşılaştırma aynı şekilde açılır.
        </p>
      </div>
      <Suspense>
        <StockCompare stocks={stocks} />
      </Suspense>
    </div>
  );
}
