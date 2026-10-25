"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export type Series = { code: string; name: string; prices: { d: string; c: number }[] };

export const MAX_COMPARE = 5;
/** Seri renkleri: açık ve koyu temada ayırt edilebilir */
export const COMPARE_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed"];

/** Seçili kodlar adres çubuğunda tutulur (?kod=AFA,TTE): bağlantı paylaşılabilir */
export function useSelectedCodes(valid: Set<string>) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const codes = (params.get("kod") ?? "")
    .toUpperCase()
    .split(",")
    .map((c) => c.trim())
    .filter((c, i, a) => c && valid.has(c) && a.indexOf(c) === i)
    .slice(0, MAX_COMPARE);
  const set = (next: string[]) => {
    const q = next.length ? `?kod=${next.join(",")}` : "";
    router.replace(`${path}${q}`, { scroll: false });
  };
  return {
    codes,
    add: (c: string) => !codes.includes(c) && codes.length < MAX_COMPARE && set([...codes, c]),
    remove: (c: string) => set(codes.filter((x) => x !== c)),
  };
}

/** Seçili kodların fiyat serileri; önceden yüklenenler yeniden istenmez */
export function useSeries(kind: "fon" | "hisse", codes: string[]) {
  const [cache, setCache] = useState<Record<string, Series | null>>({});
  const key = codes.join(",");
  useEffect(() => {
    const missing = key.split(",").filter((c) => c && !(c in cache));
    if (!missing.length) return;
    let stop = false;
    Promise.all(
      missing.map((c) =>
        fetch(`/api/seri/${kind}/${c}`)
          .then((r) => (r.ok ? (r.json() as Promise<Series>) : null))
          .catch(() => null),
      ),
    ).then((list) => {
      if (stop) return;
      setCache((prev) => ({ ...prev, ...Object.fromEntries(missing.map((c, i) => [c, list[i]])) }));
    });
    return () => {
      stop = true;
    };
  }, [key, kind, cache]);
  return {
    series: codes.map((c) => cache[c]).filter((s): s is Series => Boolean(s)),
    loading: codes.some((c) => !(c in cache)),
  };
}
