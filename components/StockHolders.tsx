import Link from "next/link";
import type { StockHolder } from "@/lib/holdings";
import { num } from "@/lib/format";

const SHOWN = 10;

function Row({ h }: { h: StockHolder }) {
  return (
    <li className="flex items-baseline gap-3 py-1.5 text-sm">
      <Link href={`/fonlar/${h.code}`} className="w-12 shrink-0 font-semibold text-accent hover:underline">
        {h.code}
      </Link>
      <span className="min-w-0 flex-1 truncate text-xs text-muted" title={h.name}>
        {h.name}
      </span>
      <span className="shrink-0 tabular font-medium">%{num(h.pct)}</span>
    </li>
  );
}

/** Hisse sayfası: hisseyi portföyünde tutan hisse senedi fonları (KAP aylık portföy raporları) */
export default function StockHolders({ code, holders }: { code: string; holders: StockHolder[] }) {
  const rest = holders.slice(SHOWN);
  return (
    <section className="card p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">{code} Hissesini Tutan Fonlar</h2>
        <span className="text-xs text-muted">{holders.length} hisse senedi fonu · KAP aylık raporları</span>
      </div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>Fon</span>
        <span>Fondaki payı</span>
      </div>
      <ul className="divide-y divide-border">
        {holders.slice(0, SHOWN).map((h) => (
          <Row key={h.code} h={h} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="mt-2 cursor-pointer list-none text-sm text-accent hover:underline">
            <span className="group-open:hidden">{rest.length} fon daha göster</span>
            <span className="hidden group-open:inline">Gizle</span>
          </summary>
          <ul className="divide-y divide-border">
            {rest.map((h) => (
              <Row key={h.code} h={h} />
            ))}
          </ul>
        </details>
      )}
      <p className="mt-3 text-xs text-muted">
        Hisse senedi fonlarının portföy şirketlerince KAP&apos;ta yayımlanan aylık portföy dağılım raporlarından alınır;
        fonlar o tarihten sonra pozisyonlarını değiştirmiş olabilir.
      </p>
    </section>
  );
}
