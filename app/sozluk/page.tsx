import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = {
  alternates: { canonical: "/sozluk" },
  title: "Borsa Sözlüğü: F/K, PD/DD, Temettü, Bedelsiz ve Daha Fazlası",
  description: "Borsa terimlerinin kısa ve anlaşılır açıklamaları: F/K oranı, PD/DD, FAVÖK, temettü verimi, bedelsiz ve bedelli sermaye artırımı, rüçhan hakkı, halka arz.",
};

export default function GlossaryPage() {
  const sorted = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, "tr"));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Borsa Sözlüğü</h1>
        <p className="mt-1 text-sm text-muted">Borsada sık geçen terimlerin kısa açıklamaları ve sitedeki ilgili araçlar.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((t) => (
          <Link key={t.slug} href={`/sozluk/${t.slug}`} className="card block p-4 hover:border-accent">
            <div className="font-semibold">{t.term}</div>
            <p className="mt-1 text-sm text-muted">{t.short}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
