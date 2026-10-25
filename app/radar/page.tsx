import type { Metadata } from "next";
import Radar from "@/components/Radar";
import { getIndex } from "@/lib/data";

export const metadata: Metadata = { title: "Hisse Radar" };

export default function RadarPage() {
  const { companies } = getIndex();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hisse Radar</h1>
        <p className="mt-1 text-sm text-muted">Şirketleri oranlarına göre filtrele, sırala ve Excel&apos;e aktar.</p>
      </div>
      <Radar companies={companies} />
    </div>
  );
}
