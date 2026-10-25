"use client";

import { useMemo, useState } from "react";
import { COMPARE_COLORS, MAX_COMPARE } from "@/lib/compare";

type Item = { code: string; name: string };

const fold = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

/** Karşılaştırılacak hisse/fonları seçme: renkli etiketler + arama */
export default function ComparePicker({
  items,
  selected,
  onAdd,
  onRemove,
  placeholder,
}: {
  items: Item[];
  selected: string[];
  onAdd: (code: string) => void;
  onRemove: (code: string) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const f = fold(q.trim());
    if (!f) return [];
    return items
      .filter((i) => !selected.includes(i.code) && (fold(i.code).startsWith(f) || fold(i.name).includes(f)))
      .sort((a, b) => Number(!fold(a.code).startsWith(f)) - Number(!fold(b.code).startsWith(f)))
      .slice(0, 8);
  }, [q, items, selected]);
  const full = selected.length >= MAX_COMPARE;

  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap gap-2">
        {selected.map((c, i) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold"
            style={{ borderColor: COMPARE_COLORS[i], color: COMPARE_COLORS[i] }}
          >
            {c}
            <button onClick={() => onRemove(c)} aria-label={`${c} kaldır`} className="text-muted hover:text-down">
              ✕
            </button>
          </span>
        ))}
        {selected.length === 0 && <span className="text-sm text-muted">Karşılaştırmak için aşağıdan seçim yap.</span>}
      </div>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              onAdd(results[0].code);
              setQ("");
            }
          }}
          disabled={full}
          placeholder={full ? `En fazla ${MAX_COMPARE} seçilebilir` : placeholder}
          className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none placeholder:text-muted focus:border-accent disabled:opacity-60"
        />
        {results.length > 0 && (
          <ul className="absolute left-0 right-0 top-11 z-20 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            {results.map((r) => (
              <li key={r.code}>
                <button
                  onClick={() => {
                    onAdd(r.code);
                    setQ("");
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <span className="w-14 shrink-0 font-semibold">{r.code}</span>
                  <span className="min-w-0 truncate text-muted">{r.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
