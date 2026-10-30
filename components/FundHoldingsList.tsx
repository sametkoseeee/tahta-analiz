import Link from "next/link";
import type { FundHoldings } from "@/lib/holdings";
import { num } from "@/lib/format";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const periodTr = (p: string) => {
  const [y, m] = p.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
};

export default function FundHoldingsList({ holdings }: { holdings: FundHoldings }) {
  const max = holdings.items[0]?.pct ?? 1;
  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">En Büyük {holdings.items.length} Hisse</h2>
        <span className="text-xs text-muted">{periodTr(holdings.period)} sonu itibarıyla · KAP</span>
      </div>
      <ol className="grid gap-x-8 gap-y-2.5 md:grid-cols-2">
        {holdings.items.map((i, n) => (
          <li key={i.code} className="min-w-0">
            <div className="flex items-baseline gap-3 text-sm">
              <span className="w-5 shrink-0 text-right text-xs text-muted tabular">{n + 1}</span>
              <Link href={`/sirketler/${i.code}`} className="shrink-0 font-semibold hover:text-accent">
                {i.code}
              </Link>
              <span className="min-w-0 flex-1 truncate text-xs text-muted">{i.name}</span>
              <span className="shrink-0 tabular font-medium">%{num(i.pct)}</span>
            </div>
            <div className="ml-8 mt-1 h-1.5 rounded-full bg-surface-2">
              <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(i.pct / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted">
        Fon toplam değerine oranla. Fon, portföyünün %{num(holdings.total)}&apos;ini {holdings.count} farklı hissede tutuyor.
        Portföy şirketinin KAP&apos;ta yayımladığı aylık rapordan alınır; fon o tarihten sonra hisselerini değiştirmiş olabilir.
      </p>
    </section>
  );
}
