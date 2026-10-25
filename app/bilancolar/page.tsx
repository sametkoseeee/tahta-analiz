import type { Metadata } from "next";
import RecentReportsTable from "@/components/RecentReportsTable";
import ReportsTabs from "@/components/ReportsTabs";
import { getReports } from "@/lib/reports";

export const metadata: Metadata = {
  title: "Son Bilançolar",
  description: "KAP'ta açıklanan son bilançolar: dönem, net kâr, yıllık değişim, F/K ve PD/DD",
};

export default function RecentReportsPage() {
  const { recent } = getReports();
  return (
    <div className="space-y-4">
      <ReportsTabs active="recent" />
      {recent.length > 0 ? (
        <RecentReportsTable reports={recent} />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">Bilanço verisi henüz yüklenmedi.</div>
      )}
    </div>
  );
}
