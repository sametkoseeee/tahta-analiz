import type { Metadata } from "next";
import MeasuresTable from "@/components/MeasuresTable";
import { getMeasures } from "@/lib/measures";

export const metadata: Metadata = {
  title: "Tedbirli Hisseler",
  description: "Borsa İstanbul Volatilite Bazlı Tedbir Sistemi (VBTS) kapsamında tedbir uygulanan hisseler ve tedbir süreleri",
};

export default function MeasuresPage() {
  const { active, ended } = getMeasures();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tedbirli Hisseler</h1>
        <p className="mt-1 text-sm text-muted">
          Borsa İstanbul, aşırı fiyat hareketi görülen paylara Volatilite Bazlı Tedbir Sistemi (VBTS) kapsamında
          tedbir uygular: kredili alım ve açığa satış yasağı, brüt takas, emir paketi, tek fiyat ya da internetten emir
          yasağı. Tedbirler süre sonunda kendiliğinden kalkar.
        </p>
      </div>
      <MeasuresTable active={active} ended={ended} />
      <p className="text-xs text-muted">
        Kaynak: Borsa İstanbul&apos;un KAP&apos;taki VBTS duyuruları; her akşam güncellenir. Ayrıntılar için satırdaki KAP
        bağlantısına bakın. Yatırım tavsiyesi değildir.
      </p>
    </div>
  );
}
