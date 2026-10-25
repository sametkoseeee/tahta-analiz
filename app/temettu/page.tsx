import type { Metadata } from "next";
import DividendsTable from "@/components/DividendsTable";
import { getDividends } from "@/lib/dividends";

export const metadata: Metadata = {
  title: "Temettü Takvimi",
  description: "BIST şirketlerinin kâr payı (temettü) dağıtımları: pay başına tutar, verim ve ödeme tarihleri",
};

export default function DividendsPage() {
  const { items } = getDividends();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Temettü Takvimi</h1>
        <p className="mt-1 text-sm text-muted">
          Şirketlerin KAP&apos;a bildirdiği son kâr payı dağıtımları: pay başına brüt ve net tutar, temettü verimi, ödeme
          ve genel kurul tarihleri.
        </p>
      </div>
      {items.length > 0 ? (
        <DividendsTable items={items} today={today} />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">Temettü verisi henüz yüklenmedi.</div>
      )}
    </div>
  );
}
