import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GLOSSARY, GLOSSARY_MAP } from "@/lib/glossary";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = GLOSSARY_MAP.get(slug);
  if (!t) return { title: "Bulunamadı" };
  const name = t.term.split(" (")[0];
  return { title: `${name} Nedir?`, description: t.short, alternates: { canonical: `/sozluk/${t.slug}` } };
}

export default async function TermPage({ params }: Props) {
  const { slug } = await params;
  const t = GLOSSARY_MAP.get(slug);
  if (!t) notFound();
  const name = t.term.split(" (")[0];
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <div className="text-sm text-muted">
        <Link href="/sozluk" className="hover:text-text">
          Borsa Sözlüğü
        </Link>{" "}
        / {name}
      </div>
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{name} nedir?</h1>
        <p className="mt-2 text-lg text-muted">{t.short}</p>
      </header>
      <div className="space-y-3 leading-relaxed">
        {t.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {t.formula && (
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Formül</div>
          <div className="mt-1 font-medium">{t.formula}</div>
        </div>
      )}
      {t.example && (
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Örnek</div>
          <div className="mt-1">{t.example}</div>
        </div>
      )}
      {t.link && (
        <Link href={t.link.href} className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          {t.link.label} →
        </Link>
      )}
      {t.related && t.related.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted">İlgili terimler</h2>
          <div className="flex flex-wrap gap-2">
            {t.related.map((s) => {
              const r = GLOSSARY_MAP.get(s);
              return r ? (
                <Link key={s} href={`/sozluk/${s}`} className="rounded-full border border-border px-3 py-1 text-sm hover:bg-surface-2">
                  {r.term.split(" (")[0]}
                </Link>
              ) : null;
            })}
          </div>
        </div>
      )}
      <p className="text-xs text-muted">Bu sayfa bilgilendirme amaçlıdır; yatırım tavsiyesi değildir.</p>
    </article>
  );
}
