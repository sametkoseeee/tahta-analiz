import type { Metadata } from "next";
import CalculatorTabs from "@/components/CalculatorTabs";
import type { CalcPreset } from "@/components/CapitalCalculator";
import { getCapital } from "@/lib/capital";
import { getIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sermaye Artırımı ve Rüçhan Hakkı Hesaplama",
  description: "Bedelli ve bedelsiz sermaye artırımı sonrası lot sayısı, teorik fiyat, rüçhan hakkı değeri ve ödenecek tutar hesaplama araçları",
};

export default function CalculatorsPage() {
  const prices = new Map(getIndex().companies.map((c) => [c.code, c.metrics.price]));
  // Seçilebilecek hisseler: süren, oranı belli artırımlar
  const presets: CalcPreset[] = getCapital()
    .items.filter((d) => d.status !== "Tamamlandı" && d.status !== "İptal" && (d.rights?.pct || d.bonus?.pct))
    .map((d) => ({
      code: d.code,
      price: prices.get(d.code) ?? null,
      rightsPct: d.rights?.pct ?? null,
      rightsPrice: d.rights?.price ?? null,
      bonusPct: d.bonus?.pct ?? null,
    }))
    .sort((a, b) => a.code.localeCompare(b.code, "tr"));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hesaplama Araçları</h1>
        <p className="mt-1 text-sm text-muted">Yatırım kararlarında işine yarayacak hesaplamalar.</p>
      </div>
      <CalculatorTabs presets={presets} />
      <p className="text-xs text-muted">Hesaplamalar bilgilendirme amaçlıdır; yatırım tavsiyesi değildir.</p>
    </div>
  );
}
