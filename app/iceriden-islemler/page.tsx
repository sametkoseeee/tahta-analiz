import type { Metadata } from "next";
import InsiderTabs from "@/components/InsiderTabs";
import { getInsider } from "@/lib/insider";

export const metadata: Metadata = {
  alternates: { canonical: "/iceriden-islemler" },
  title: "İçeriden İşlemler: Yönetici Alım-Satımları ve Pay Geri Alımları",
  description:
    "BIST şirketlerinde yöneticilerin, büyük ortakların pay alım-satımları ve şirketlerin kendi paylarını geri alımları (KAP bildirimleri)",
};

export default function InsiderPage() {
  const { trades, buybacks } = getInsider();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">İçeriden İşlemler</h1>
        <p className="mt-1 text-sm text-muted">
          Şirket yöneticilerinin ve büyük ortaklarının kendi şirketlerinin paylarında yaptığı alım-satımlar ve şirketlerin
          kendi paylarını geri alımları. Kaynak: KAP; son 30 gün.
        </p>
      </div>
      {trades.length + buybacks.length > 0 ? (
        <InsiderTabs trades={trades} buybacks={buybacks} />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">Veri henüz yüklenmedi.</div>
      )}
      <p className="text-xs text-muted">Yatırım tavsiyesi değildir.</p>
    </div>
  );
}
