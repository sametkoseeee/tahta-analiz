import type { Metadata } from "next";
import Link from "next/link";
import CapitalTable from "@/components/CapitalTable";
import { getCapital } from "@/lib/capital";

export const metadata: Metadata = {
  title: "Sermaye Artırımı Tablosu",
  description: "Bedelli, bedelsiz ve tahsisli sermaye artırımı yapacak BIST şirketleri: oranlar, rüçhan fiyatı ve tarihler",
};

export default function CapitalPage() {
  const { items } = getCapital();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sermaye Artırımı Tablosu</h1>
        <p className="mt-1 text-sm text-muted">
          Şirketlerin son 12 ayda KAP&apos;a bildirdiği bedelli (rüçhanlı), bedelsiz ve tahsisli sermaye artırımları ile
          sermaye azaltımları: oranlar, rüçhan fiyatı, SPK süreci ve hak kullanım tarihleri.{" "}
          <Link href="/hesaplama" className="font-medium text-accent hover:underline">
            Sermaye artırımı hesaplama →
          </Link>
        </p>
      </div>
      {items.length > 0 ? (
        <CapitalTable items={items} />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">Sermaye artırımı verisi henüz yüklenmedi.</div>
      )}
      <p className="text-xs text-muted">
        Kaynak: şirketlerin KAP&apos;taki &quot;Sermaye Artırımı - Azaltımı İşlemlerine İlişkin Bildirim&quot;leri; her
        akşam güncellenir. Yatırım tavsiyesi değildir.
      </p>
    </div>
  );
}
