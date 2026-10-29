/**
 * GET /api/fiyatlar → { quotes: { THYAO: { p, c, t } } }: seans içi güncel fiyatlar.
 * Tarayıcılar Supabase'e doğrudan gitmesin diye (ücretsiz planın veri çıkışı kotası) yanıt 5 dakika
 * Cloudflare önbelleğinde tutulur; Supabase'e her konumdan 5 dakikada en fazla bir istek gider.
 * Fiyatlar seans içinde ~15-40 dakikada bir güncellendiği için gecikme fark edilmez.
 */
type Env = { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string };
type Context = { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void };
type Row = { code: string; price: number | string; change: number | string | null; updated_at: string };

const CACHE_SECONDS = 300;

export const onRequestGet = async ({ request, env, waitUntil }: Context) => {
  const url = new URL(request.url);
  const key = new Request(`${url.origin}/api/fiyatlar`);
  const cache = (caches as unknown as { default: Cache }).default;
  const hit = await cache.match(key);
  if (hit) return hit;

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return Response.json({ quotes: {} });
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/prices?select=code,price,change,updated_at&limit=2000`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) return Response.json({ quotes: {}, error: `Supabase ${res.status}` }, { status: 502 });

  const quotes: Record<string, { p: number; c: number | null; t: string }> = {};
  for (const r of (await res.json()) as Row[]) {
    quotes[r.code] = { p: Number(r.price), c: r.change == null ? null : Number(r.change), t: r.updated_at };
  }
  const out = new Response(JSON.stringify({ quotes }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": `public, max-age=60, s-maxage=${CACHE_SECONDS}` },
  });
  waitUntil(cache.put(key, out.clone()));
  return out;
};
