import type { Metadata } from "next";
import IposTable from "@/components/IposTable";
import { getIpos } from "@/lib/ipos";

export const metadata: Metadata = {
  title: "Halka Arz Takvimi",
  description: "Borsa İstanbul halka arzları: talep toplama tarihleri, halka arz fiyatı, büyüklük, katılımcı sayısı ve getiri",
};

export default function IposPage() {
  const { items } = getIpos();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Halka Arz Takvimi</h1>
        <p className="mt-1 text-sm text-muted">
          Son bir yılın halka arzları: talep toplama tarihleri, fiyat, büyüklük, katılımcı sayısı ve halka arz fiyatından
          bu yana getiri. Veriler Borsa İstanbul ve aracı kurumların KAP bildirimlerinden alınır.
        </p>
      </div>
      {items.length > 0 ? (
        <IposTable items={items} today={today} />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">Halka arz verisi henüz yüklenmedi.</div>
      )}
      <p className="text-xs text-muted">
        Getiri, halka arz fiyatı ile güncel fiyat arasındaki farktır; sonradan bedelsiz sermaye artırımı ya da bölünme
        yapan şirketlerde gösterilmez. Talep toplama tarihi okunamayan arzlarda sonuç bildiriminin tarihi yazılır. Yatırım
        tavsiyesi değildir.
      </p>
    </div>
  );
}
