import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PriceChart from "@/components/PriceChart";
import WatchButton from "@/components/WatchButton";
import { getFund, getFunds } from "@/lib/data";
import { changeClass, compact, fundPrice, num, pct, signedPct } from "@/lib/format";

type Props = { params: Promise<{ kod: string }> };

export function generateStaticParams() {
  return getFunds().funds.map((f) => ({ kod: f.code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  const f = getFund(kod);
  return f ? { title: `${f.code} · ${f.name}`, description: `${f.name} fiyatı, getirileri ve büyüklüğü` } : { title: "Bulunamadı" };
}

const RETURNS = [
  ["r1m", "1 Ay"],
  ["r3m", "3 Ay"],
  ["r6m", "6 Ay"],
  ["rytd", "Yılbaşından beri"],
  ["r1y", "1 Yıl"],
  ["r3y", "3 Yıl"],
  ["r5y", "5 Yıl"],
] as const;

export default async function FundPage({ params }: Props) {
  const { kod } = await params;
  const f = getFund(kod);
  if (!f) notFound();
  const date = f.priceDate?.split("-").reverse().join(".");

  const stats: [string, string, string?][] = [
    ["Portföy büyüklüğü", compact(f.size) + " ₺", f.sizeChange1m != null ? `1 ayda ${signedPct(f.sizeChange1m)}` : undefined],
    ["Yatırımcı sayısı", num(f.investors, 0)],
    ["Pazar payı", pct(f.marketShare, 2)],
    ["Risk değeri", f.risk ? `${f.risk} / 7` : "–"],
    [
      "Kategori sırası",
      f.categoryRank && f.categoryCount ? `${num(f.categoryRank, 0)} / ${num(f.categoryCount, 0)}` : "–",
      f.category ?? undefined,
    ],
    ["Portföy şirketi", f.founder ?? "–"],
  ];

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted">
        <Link href="/fonlar" className="hover:text-text">
          Yatırım Fonları
        </Link>{" "}
        / {f.code}
      </div>

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{f.code}</h1>
            <WatchButton code={f.code} />
            {f.umbrella && (
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">{f.umbrella}</span>
            )}
          </div>
          <p className="mt-1 text-muted">{f.name}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular">{fundPrice(f.price)} ₺</div>
          <div className={`text-sm font-medium tabular ${changeClass(f.change)}`}>
            {signedPct(f.change)} <span className="font-normal text-muted">günlük · {date}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <PriceChart code={f.code} prices={f.prices} live={false} label="Fiyat" />
        </div>
        <div className="card divide-y divide-border">
          {stats.map(([label, value, sub]) => (
            <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="text-muted">{label}</span>
              <span className="text-right">
                <span className="font-medium tabular">{value}</span>
                {sub && <span className="block text-xs text-muted">{sub}</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Getiriler</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {RETURNS.map(([key, label]) => (
            <div key={key} className="rounded-lg bg-surface-2 px-3 py-2">
              <div className="text-xs text-muted">{label}</div>
              <div className={`text-lg font-semibold tabular ${changeClass(f[key])}`}>{signedPct(f[key])}</div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        Veriler{" "}
        <a
          href={`https://www.tefas.gov.tr/tr/fon-detayli-analiz/${f.code}`}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          TEFAS
        </a>{" "}
        kaynaklıdır ve günde bir kez güncellenir. Geçmiş getiri gelecekteki getirinin göstergesi değildir; yatırım tavsiyesi
        değildir.
      </p>
    </div>
  );
}
