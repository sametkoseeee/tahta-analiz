"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Item = { code: string; name: string };

const fold = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

export default function Search({ items }: { items: Item[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const f = fold(q.trim());
    if (!f) return [];
    return items
      .filter((i) => fold(i.code).startsWith(f) || fold(i.name).includes(f))
      .sort((a, b) => Number(!fold(a.code).startsWith(f)) - Number(!fold(b.code).startsWith(f)))
      .slice(0, 8);
  }, [q, items]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (code: string) => {
    setQ("");
    setOpen(false);
    router.push(`/sirketler/${code}`);
  };

  return (
    <div ref={box} className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          else if (e.key === "Enter" && results[active]) go(results[active].code);
          else if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Hisse ara (ör. THYAO)"
        className="h-9 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none placeholder:text-muted focus:border-accent"
      />
      {open && results.length > 0 && (
        <ul className="absolute right-0 top-11 w-full min-w-64 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          {results.map((r, i) => (
            <li key={r.code}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.code)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${i === active ? "bg-surface-2" : ""}`}
              >
                <span className="w-14 font-semibold">{r.code}</span>
                <span className="truncate text-muted">{r.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
