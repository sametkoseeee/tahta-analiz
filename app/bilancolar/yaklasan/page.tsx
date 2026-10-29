import type { Metadata } from "next";
import ReportsTabs from "@/components/ReportsTabs";
import UpcomingReports from "@/components/UpcomingReports";
import { getReports } from "@/lib/reports";

export const metadata: Metadata = {
  title: "Yaklaşan Bilançolar",
  description: "Bilanço açıklama tarihini KAP'ta duyuran BIST şirketleri, gün gün",
};

export default function UpcomingReportsPage() {
  const { upcoming } = getReports();

  return (
    <div className="space-y-4">
      <ReportsTabs active="upcoming" />
      <p className="text-sm text-muted">
        Her şirket finansal rapor tarihini önceden açıklamaz; burada yalnızca KAP&apos;ta &quot;Finansal Takvim&quot;
        bildirimiyle tarih duyuran şirketler listelenir. Tarihler şirketlerin planıdır, değişebilir.
      </p>
      <UpcomingReports upcoming={upcoming} />
    </div>
  );
}
