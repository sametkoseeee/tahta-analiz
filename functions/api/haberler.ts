/**
 * GET /api/haberler?codes=THYAO,ASELS&days=7 → izlenen şirketlerin KAP bildirimleri.
 * Site statik (Cloudflare Pages); KAP tarayıcıdan doğrudan çağrılamadığı için bu tek iş sunucuda,
 * Cloudflare Pages fonksiyonu olarak çalışır. Yanıtlar 2 dakika Cloudflare önbelleğinde tutulur;
 * aynı istek KAP'a tekrar gitmez.
 */
import kapOids from "../../data/kap_oids.json";
import { stockCodes } from "../../lib/codes";
import { fetchKapDisclosures } from "../../lib/kap-core";
import type { Disclosure } from "../../lib/news";

const OIDS = kapOids as Record<string, string>;
/** KAP kimliği bilinmeyen şirketler için tüm bildirimler çekilip süzülür; 2000 sınırı yüzünden kısa tutulur */
const UNFILTERED_MAX_DAYS = 2;
const CACHE_SECONDS = 120;

async function disclosuresFor(allCodes: string[], days: number): Promise<Disclosure[]> {
  // Fon kodları KAP'ta yok; boşuna tüm bildirimleri çektirmesin
  const codes = stockCodes(allCodes);
  const wanted = new Set(codes);
  const known = codes.filter((c) => OIDS[c]).sort();
  const unknown = codes.filter((c) => !OIDS[c]);
  const [byOid, all] = await Promise.all([
    known.length ? fetchKapDisclosures(days, known.map((c) => OIDS[c])) : Promise.resolve([]),
    unknown.length ? fetchKapDisclosures(Math.min(days, UNFILTERED_MAX_DAYS)) : Promise.resolve([]),
  ]);
  const seen = new Set<number>();
  return [...byOid, ...all]
    .filter((d) => !seen.has(d.id) && seen.add(d.id))
    .map((d) => ({ ...d, codes: d.codes.filter((c) => wanted.has(c)) }))
    .filter((d) => d.codes.length > 0)
    .sort((a, b) => b.id - a.id);
}

const json = (body: unknown, status = 200, cache = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache ? `public, max-age=60, s-maxage=${CACHE_SECONDS}` : "no-store",
    },
  });

/** Cloudflare Pages fonksiyon bağlamının kullandığımız kısmı (workers-types paketine gerek kalmasın) */
type Context = { request: Request; waitUntil: (p: Promise<unknown>) => void };

export const onRequestGet = async ({ request, waitUntil }: Context) => {
  const url = new URL(request.url);
  const codes = [
    ...new Set(
      (url.searchParams.get("codes") ?? "")
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => /^[A-Z0-9]{2,8}$/.test(c)),
    ),
  ]
    .sort()
    .slice(0, 200);
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 7, 1), 30);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 300);
  if (codes.length === 0) return json({ items: [] });

  // Önbellek anahtarı: sıralanmış kodlar + gün + limit (aynı liste farklı sırada gelse de aynı kayıt)
  const key = new Request(`${url.origin}/api/haberler?codes=${codes.join(",")}&days=${days}&limit=${limit}`);
  const cache = (caches as unknown as { default: Cache }).default;
  const hit = await cache.match(key);
  if (hit) return hit;

  try {
    const items = (await disclosuresFor(codes, days)).slice(0, limit);
    const res = json({ items }, 200, true);
    waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (e) {
    const m = (e as Error).message;
    const reason = /fetch failed|timeout|aborted/i.test(m) ? "bağlantı kurulamadı, biraz sonra tekrar deneyin" : m;
    return json({ items: [], error: `KAP'a ulaşılamadı: ${reason}` }, 502);
  }
};
