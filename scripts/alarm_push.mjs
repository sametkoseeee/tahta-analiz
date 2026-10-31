// Fiyat alarmları: `prices` tablosundaki güncel fiyat alarm fiyatını geçince kullanıcıya Web Push gönderir.
// Seans içinde fiyatlar güncellendikten hemen sonra çalışır (.github/workflows/fiyat.yml).
// Yerelde: node --env-file=.env.local scripts/alarm_push.mjs
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const env = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} ortam değişkeni eksik`);
  return v;
};

const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
webpush.setVapidDetails(env("VAPID_SUBJECT"), env("NEXT_PUBLIC_VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const STALE_MS = 2 * 3600_000; // bundan eski fiyatla alarm tetiklenmez (seans dışı / güncelleme aksadı)

async function check(res) {
  const { data, error } = await res;
  if (error) throw new Error(error.message);
  return data;
}

const fmt = (v) => Number(v).toLocaleString("tr-TR", { maximumFractionDigits: 4 });

async function main() {
  const open = await check(db.from("price_alerts").select("id, user_id, code, direction, price").is("triggered_at", null));
  if (open.length === 0) return console.log("Açık alarm yok");

  const codes = [...new Set(open.map((a) => a.code))];
  const prices = new Map(
    (await check(db.from("prices").select("code, price, updated_at").in("code", codes)))
      .filter((p) => Date.now() - new Date(p.updated_at).getTime() < STALE_MS)
      .map((p) => [p.code, Number(p.price)]),
  );

  const hits = open.filter((a) => {
    const p = prices.get(a.code);
    if (p == null) return false;
    return a.direction === "above" ? p >= Number(a.price) : p <= Number(a.price);
  });
  if (hits.length === 0) return console.log(`${open.length} açık alarm, tetiklenen yok`);

  // Önce işaretle: gönderimde hata olsa da aynı alarm tekrar tekrar gönderilmesin
  const now = new Date().toISOString();
  for (const a of hits) {
    await check(db.from("price_alerts").update({ triggered_at: now, triggered_price: prices.get(a.code) }).eq("id", a.id));
  }

  const users = [...new Set(hits.map((a) => a.user_id))];
  const subs = await check(db.from("push_subscriptions").select("endpoint, user_id, p256dh, auth").in("user_id", users));
  let sent = 0;
  const dead = [];
  for (const sub of subs) {
    for (const a of hits.filter((h) => h.user_id === sub.user_id)) {
      const p = prices.get(a.code);
      const payload = {
        title: `${a.code} · Fiyat alarmı`,
        body: `${a.code} ${fmt(p)} ₺ — alarm fiyatın ${fmt(a.price)} ₺ ${a.direction === "above" ? "üstüne çıktı" : "altına indi"}.`,
        url: `${siteUrl}/sirketler/${a.code}`,
        tag: `alarm-${a.id}`,
      };
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 6 * 3600 },
        );
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          dead.push(sub.endpoint);
          break;
        }
        console.error(`Gönderilemedi (${e.statusCode ?? "?"}): ${e.body ?? e.message}`);
      }
    }
  }
  if (dead.length) await check(db.from("push_subscriptions").delete().in("endpoint", dead));
  console.log(`${hits.length} alarm tetiklendi, ${sent} push gönderildi, ${dead.length} ölü abonelik silindi`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
