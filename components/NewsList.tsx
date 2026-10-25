"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchNews, KIND_LABELS, type Disclosure } from "@/lib/news";

const timeFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const KIND_STYLE: Record<string, string> = {
  ODA: "bg-accent-soft text-accent",
  FR: "bg-up-soft text-up",
};

export default function NewsList({
  codes,
  days = 7,
  showCompany = true,
  empty = "Bu dönemde bildirim yok.",
}: {
  codes: string[];
  days?: number;
  showCompany?: boolean;
  empty?: string;
}) {
  const key = codes.join(",");
  const [state, setState] = useState<{ key: string; items: Disclosure[] | null; error: string | null }>({
    key: "",
    items: null,
    error: null,
  });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const list = key ? key.split(",") : [];
    fetchNews(list, days, ctrl.signal)
      .then((items) => setState({ key, items, error: null }))
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        // Tarayıcının ağ hatası ("Failed to fetch") kullanıcıya Türkçe gösterilir
        const network = e instanceof TypeError;
        setState({ key, items: [], error: network ? "Sunucuya ulaşılamadı." : e.message });
      });
    return () => ctrl.abort();
  }, [key, days, attempt]);

  if (codes.length === 0) return null;
  if (state.key !== key || state.items === null) {
    return <p className="p-4 text-sm text-muted">KAP bildirimleri yükleniyor…</p>;
  }
  if (state.error) {
    return (
      <div className="flex flex-wrap items-center gap-3 p-4 text-sm">
        <span className="text-down">KAP bildirimleri yüklenemedi: {state.error}</span>
        <button
          onClick={() => {
            setState((s) => ({ ...s, items: null }));
            setAttempt((a) => a + 1);
          }}
          className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-surface-2"
        >
          Tekrar dene
        </button>
      </div>
    );
  }
  if (state.items.length === 0) return <p className="p-4 text-sm text-muted">{empty}</p>;

  return (
    <ul className="divide-y divide-border">
      {state.items.map((d) => (
        <li key={d.id} className="flex gap-3 px-4 py-3 text-sm">
          <div className="w-24 shrink-0 text-xs text-muted tabular">{timeFmt.format(new Date(d.date))}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {showCompany &&
                d.codes.map((c) => (
                  <Link key={c} href={`/sirketler/${c}`} className="font-semibold text-accent hover:underline">
                    {c}
                  </Link>
                ))}
              <span className={`rounded px-1.5 py-0.5 text-[11px] ${KIND_STYLE[d.kind] ?? "bg-surface-2 text-muted"}`}>
                {KIND_LABELS[d.kind] ?? d.kind}
              </span>
            </div>
            <a href={d.url} target="_blank" rel="noreferrer" className="mt-0.5 block font-medium hover:underline">
              {d.subject}
            </a>
            {d.summary && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{d.summary}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
