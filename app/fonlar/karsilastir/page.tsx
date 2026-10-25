import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import FundCompare from "@/components/FundCompare";
import { getFunds } from "@/lib/data";

export const metadata: Metadata = {
  title: "Fon Karşılaştırma",
  description: "TEFAS fonlarının getirilerini aynı grafikte ve tabloda karşılaştır",
};

export default function FundComparePage() {
  // Küçük grafik verisi bu sayfada gerekmiyor; sayfa hafif kalsın
  const funds = getFunds().funds.map((f) => ({ ...f, spark: undefined }));
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted">
        <Link href="/fonlar" className="hover:text-text">
          Yatırım Fonları
        </Link>{" "}
        / Karşılaştır
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fon Karşılaştırma</h1>
        <p className="mt-1 text-sm text-muted">
          En fazla 5 fon seç; getirileri aynı başlangıca (100) endekslenmiş grafikte ve tabloda yan yana gör. Bağlantıyı
          paylaşırsan karşılaştırma aynı şekilde açılır.
        </p>
      </div>
      <Suspense>
        <FundCompare funds={funds} />
      </Suspense>
    </div>
  );
}
