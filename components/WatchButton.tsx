"use client";

import { useWatchlist } from "@/lib/watchlist";

export default function WatchButton({ code, compact = false }: { code: string; compact?: boolean }) {
  const { has, toggle } = useWatchlist();
  const on = has(code);
  const label = on ? "İzleme listesinden çıkar" : "İzleme listesine ekle";

  if (compact) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          toggle(code);
        }}
        aria-label={`${code}: ${label}`}
        title={label}
        className={`text-base leading-none ${on ? "text-amber-500" : "text-muted/50 hover:text-amber-500"}`}
      >
        {on ? "★" : "☆"}
      </button>
    );
  }

  return (
    <button
      onClick={() => toggle(code)}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${
        on ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-border hover:bg-surface-2"
      }`}
    >
      <span>{on ? "★" : "☆"}</span>
      {on ? "İzleniyor" : "İzle"}
    </button>
  );
}
