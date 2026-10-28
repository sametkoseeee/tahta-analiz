import type { Metadata } from "next";
import CapitalCalculator, { type CalcPreset } from "@/components/CapitalCalculator";
import CapitalTable from "@/components/CapitalTable";
import { getCapital } from "@/lib/capital";
import { getIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sermaye Artırımı Tablosu",
  description: "Bedelli, bedelsiz ve tahsisli sermaye artırımı yapacak BIST şirketleri: oranlar, rüçhan fiyatı ve tarihler",
};

export default function CapitalPage() {
  const { items } = getCapital();
  const prices = new Map(getIndex().companies.map((c) => [c.code, c.metrics.price]));
  // Hesaplayıcıda seçilebilecek hisseler: süren, oranı belli artırımlar
  const presets: CalcPreset[] = items
    .filter((d) => d.status !== "Tamamlandı" && d.status !== "İptal" && (d.rights?.pct || d.bonus?.pct))
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
        <h1 className="text-2xl font-semibold tracking-tight">Sermaye Artırımı Tablosu</h1>
        <p className="mt-1 text-sm text-muted">
          Şirketlerin son 12 ayda KAP&apos;a bildirdiği bedelli (rüçhanlı), bedelsiz ve tahsisli sermaye artırımları ile
          sermaye azaltımları: oranlar, rüçhan fiyatı, SPK süreci ve hak kullanım tarihleri.{" "}
          <a href="#hesaplama" className="font-medium text-accent hover:underline">
            Sermaye artırımı hesaplama ↓
          </a>
        </p>
      </div>
      {items.length > 0 ? (
        <CapitalTable items={items} />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">Sermaye artırımı verisi henüz yüklenmedi.</div>
      )}
      <div id="hesaplama" className="scroll-mt-24">
        <CapitalCalculator presets={presets} />
      </div>
      <p className="text-xs text-muted">
        Kaynak: şirketlerin KAP&apos;taki &quot;Sermaye Artırımı - Azaltımı İşlemlerine İlişkin Bildirim&quot;leri; her
        akşam güncellenir. Yatırım tavsiyesi değildir.
      </p>
    </div>
  );
}
