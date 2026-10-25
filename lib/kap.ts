import "server-only";
import kapOids from "@/data/kap_oids.json";
import { stockCodes } from "./codes";
import { fetchKapDisclosures } from "./kap-core";
import type { Disclosure } from "./news";

const OIDS = kapOids as Record<string, string>;
const TTL_MS = 60_000;
/** KAP kimliği bilinmeyen şirketler için tüm bildirimler çekilip süzülür; 2000 sınırı yüzünden kısa tutulur */
const UNFILTERED_MAX_DAYS = 2;
const cache = new Map<string, { at: number; data: Disclosure[] }>();

async function cached(key: string, load: () => Promise<Disclosure[]>) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await load();
  cache.set(key, { at: Date.now(), data });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return data;
}

/** Verilen şirketlerin son `days` gündeki KAP bildirimleri (yeniden eskiye), 1 dakika önbellekli */
export async function getDisclosuresFor(allCodes: string[], days: number): Promise<Disclosure[]> {
  // Fon kodları KAP'ta yok; boşuna tüm bildirimleri çektirmesin
  const codes = stockCodes(allCodes);
  const wanted = new Set(codes);
  const known = codes.filter((c) => OIDS[c]).sort();
  const unknown = codes.filter((c) => !OIDS[c]);

  const [byOid, all] = await Promise.all([
    known.length
      ? cached(`oid:${days}:${known.join(",")}`, () => fetchKapDisclosures(days, known.map((c) => OIDS[c])))
      : Promise.resolve([]),
    unknown.length
      ? cached(`all:${Math.min(days, UNFILTERED_MAX_DAYS)}`, () => fetchKapDisclosures(Math.min(days, UNFILTERED_MAX_DAYS)))
      : Promise.resolve([]),
  ]);

  const seen = new Set<number>();
  return [...byOid, ...all]
    .filter((d) => !seen.has(d.id) && seen.add(d.id))
    .map((d) => ({ ...d, codes: d.codes.filter((c) => wanted.has(c)) }))
    .filter((d) => d.codes.length > 0)
    .sort((a, b) => b.id - a.id);
}
