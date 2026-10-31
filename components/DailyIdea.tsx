"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IDEAS, ideaIndex } from "@/lib/ideas";

/** Ana sayfa: "Günün Ekonomi Fikri"; gün tarayıcıda hesaplanır (site her gün derlenmese de değişsin) */
export default function DailyIdea() {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => setI(ideaIndex()), []);
  if (i == null) return <div className="card h-40" aria-hidden />;
  const idea = IDEAS[i];
  const go = (d: number) => setI((x) => ((x ?? 0) + d + IDEAS.length) % IDEAS.length);
  return (
    <section className="card relative overflow-hidden p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-6 -top-10 text-[140px] leading-none text-accent/10" aria-hidden>
        “
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-accent">Günün Ekonomi Fikri</h2>
        <div className="flex items-center gap-1 text-xs text-muted">
          <button onClick={() => go(-1)} className="rounded px-2 py-0.5 hover:bg-surface-2 hover:text-text" aria-label="Önceki fikir">
            ‹
          </button>
          <span className="tabular">
            {i + 1}/{IDEAS.length}
          </span>
          <button onClick={() => go(1)} className="rounded px-2 py-0.5 hover:bg-surface-2 hover:text-text" aria-label="Sonraki fikir">
            ›
          </button>
        </div>
      </div>
      <div className="relative mt-2">
        <div className="text-lg font-semibold">{idea.title}</div>
        <div className="mt-0.5 text-sm text-muted">
          <span className="font-medium text-text">{idea.who}</span> · {idea.role}
        </div>
        <p className="mt-3 text-sm leading-relaxed">{idea.body}</p>
        <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed">
          <span className="font-medium">Borsada: </span>
          {idea.example}
        </p>
        {idea.link && (
          <Link href={idea.link.href} className="mt-2 inline-block text-sm text-accent hover:underline">
            {idea.link.label} →
          </Link>
        )}
      </div>
    </section>
  );
}
