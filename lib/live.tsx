"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Metrics } from "./types";

/** Seans içi güncel fiyat: p = fiyat, c = günlük değişim, t = güncelleme zamanı (ISO) */
export type LiveQuote = { p: number; c: number | null; t: string };

type LiveState = { quotes: Record<string, LiveQuote>; updatedAt: string | null };

const LiveContext = createContext<LiveState>({ quotes: {}, updatedAt: null });
const REFRESH_MS = 5 * 60_000;

/** Seans içi fiyatlar: Cloudflare fonksiyonu (functions/api/fiyatlar.ts) Supabase'i 5 dakika önbellekleyerek verir */
async function fetchQuotes(): Promise<Record<string, LiveQuote> | null> {
  const res = await fetch("/api/fiyatlar");
  if (!res.ok) return null;
  return ((await res.json()) as { quotes: Record<string, LiveQuote> }).quotes;
}

/**
 * /api/fiyatlar'dan güncel fiyatları alır (5 dakikada bir). Yalnızca site verisinden
 * (build) daha yeni fiyatlar kullanılır; fiyat yoksa hiçbir şey değişmez.
 */
export function LiveProvider({ dataUpdatedAt, children }: { dataUpdatedAt: string; children: React.ReactNode }) {
  const [state, setState] = useState<LiveState>({ quotes: {}, updatedAt: null });

  useEffect(() => {
    const built = new Date(dataUpdatedAt).getTime();
    let stopped = false;
    const load = async () => {
      try {
        const quotes = await fetchQuotes();
        if (!quotes) return;
        const fresh: Record<string, LiveQuote> = {};
        let latest: string | null = null;
        for (const [code, q] of Object.entries(quotes)) {
          if (new Date(q.t).getTime() <= built) continue;
          fresh[code] = q;
          if (!latest || q.t > latest) latest = q.t;
        }
        if (!stopped) setState({ quotes: fresh, updatedAt: latest });
      } catch {
        /* ağ hatası: bir sonraki turda tekrar dene */
      }
    };
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [dataUpdatedAt]);

  return <LiveContext.Provider value={state}>{children}</LiveContext.Provider>;
}

export function useLive() {
  return useContext(LiveContext);
}

/** Fiyata bağlı oranları güncel fiyatla yeniden hesaplar (mali tablo kalemleri aynı kalır) */
export function withLive(m: Metrics, q: LiveQuote | undefined): Metrics {
  if (!q || !m.price) return m;
  const r = q.p / m.price;
  const scale = (v: number | null) => (v == null ? null : v * r);
  const inverse = (v: number | null) => (v == null ? null : v / r);
  const marketCap = scale(m.marketCap);
  const ev = m.ev != null && m.marketCap != null && marketCap != null ? m.ev + (marketCap - m.marketCap) : m.ev;
  return {
    ...m,
    price: q.p,
    change: q.c ?? m.change,
    change1y: m.change1y == null ? null : (1 + m.change1y) * r - 1,
    high52: m.high52 == null ? q.p : Math.max(m.high52, q.p),
    low52: m.low52 == null ? q.p : Math.min(m.low52, q.p),
    marketCap,
    ev,
    pe: scale(m.pe),
    pb: scale(m.pb),
    ps: scale(m.ps),
    evEbitda: m.ebitdaTtm && m.ebitdaTtm > 0 && ev != null ? ev / m.ebitdaTtm : m.evEbitda,
    dividendYield: inverse(m.dividendYield),
    fcfYield: inverse(m.fcfYield),
  };
}

/** Şirket listesine güncel fiyatları uygular */
export function useLiveCompanies<T extends { code: string; metrics: Metrics }>(list: T[]): T[] {
  const { quotes } = useLive();
  return useMemo(() => {
    if (Object.keys(quotes).length === 0) return list;
    return list.map((c) => (quotes[c.code] ? { ...c, metrics: withLive(c.metrics, quotes[c.code]) } : c));
  }, [list, quotes]);
}
