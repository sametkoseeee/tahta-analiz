import "server-only";
import { fetchKapDisclosures, kapDay } from "./kap-core";
import type { Disclosure } from "./news";

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: Disclosure[] }>();

/** Son `days` gündeki tüm şirket bildirimleri (yeniden eskiye), 1 dakika önbellekli */
export async function getDisclosures(days: number): Promise<Disclosure[]> {
  const key = `${days}_${kapDay(new Date())}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await fetchKapDisclosures(days);
  cache.set(key, { at: Date.now(), data });
  return data;
}
