import type { Metadata } from "next";
import FundsTable from "@/components/FundsTable";
import { getFunds } from "@/lib/data";

export const metadata: Metadata = {
  title: "Yatırım Fonları",
  description: "TEFAS'ta işlem gören yatırım fonlarının getirileri, büyüklükleri ve fiyat geçmişi",
};

export default function FundsPage() {
  const { funds } = getFunds();
  const lastDate = funds.map((f) => f.priceDate).filter(Boolean).sort().pop();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yatırım Fonları</h1>
        <p className="mt-1 text-sm text-muted">
          TEFAS&apos;ta işlem gören {funds.length} fonun getirileri, büyüklükleri ve fiyat geçmişi.
          {lastDate && ` Fiyat tarihi: ${lastDate.split("-").reverse().join(".")}.`} Getiriler TEFAS kaynaklıdır, geçmiş getiri
          gelecekteki getirinin göstergesi değildir.
        </p>
      </div>
      {funds.length > 0 ? (
        <FundsTable funds={funds} />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">Fon verisi henüz yüklenmedi.</div>
      )}
    </div>
  );
}
