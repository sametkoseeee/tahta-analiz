// İzleme listelerindeki şirketler için yeni KAP bildirimlerini Web Push ile gönderir.
// GitHub Actions'ta 10 dakikada bir çalışır (.github/workflows/kap-bildirim.yml).
// Yerelde: node --env-file=.env.local scripts/kap_push.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { stockCodes } from "../lib/codes.ts";
import { fetchKapDisclosures } from "../lib/kap-core.ts";

const env = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} ortam değişkeni eksik`);
  return v;
};

const MAX_PER_USER = 5; // bir turda kullanıcı başına ayrı bildirim; fazlası tek özet bildirimde
const MAX_CODES_PER_NOTICE = 10; // bundan çok şirketi ilgilendiren toplu duyurular gönderilmez
const KEEP_DAYS = 7; // gönderildi kayıtlarını bu kadar gün tut

const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
webpush.setVapidDetails(env("VAPID_SUBJECT"), env("NEXT_PUBLIC_VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

async function check(res) {
  const { data, error, count } = await res;
  if (error) throw new Error(error.message);
  return { data, count };
}

/** Supabase tek seferde en fazla 1000 satır döndürür; tümünü sayfa sayfa al */
async function fetchAll(query) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await check(query().range(from, from + 999));
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

/** İzlenen şirketlerin son 2 günlük bildirimleri (dün + bugün, gece yarısı geçişi için) */
async function fetchWatchedDisclosures(watchedCodes) {
  const oids = JSON.parse(readFileSync(new URL("../data/kap_oids.json", import.meta.url), "utf8"));
  const known = watchedCodes.filter((c) => oids[c]);
  const unknown = new Set(watchedCodes.filter((c) => !oids[c]));
  const lists = [];
  if (known.length) lists.push(await fetchKapDisclosures(2, known.map((c) => oids[c])));
  // KAP kimliği bilinmeyenler: tüm bildirimler (2 günde 2000 sınırının altında kalır) süzülür
  if (unknown.size) lists.push((await fetchKapDisclosures(2)).filter((d) => d.codes.some((c) => unknown.has(c))));
  const seen = new Set();
  return lists
    .flat()
    .filter((d) => !seen.has(d.id) && seen.add(d.id))
    .sort((a, b) => b.id - a.id);
}

async function main() {
  const watchRows = await fetchAll(() => db.from("watchlist").select("user_id, code"));
  // İzleme listesindeki fonlar KAP'ta bildirim yayınlamaz
  const watchedCodes = stockCodes([...new Set(watchRows.map((r) => r.code))]);
  if (watchedCodes.length === 0) return console.log("İzlenen şirket yok");

  // Yüzlerce şirketi aynı anda ilgilendiren toplu duyurular (ör. SPK işlem yasağı listesi) bildirim olarak gönderilmez
  const items = (await fetchWatchedDisclosures(watchedCodes)).filter((d) => d.codes.length <= MAX_CODES_PER_NOTICE);
  if (items.length === 0) return console.log("KAP: izlenen şirketlerde bildirim yok");

  const minId = Math.min(...items.map((d) => d.id));
  const { data: sentRows } = await check(db.from("sent_disclosures").select("disclosure_id").gte("disclosure_id", minId));
  const sent = new Set(sentRows.map((r) => Number(r.disclosure_id)));
  const fresh = items.filter((d) => !sent.has(d.id));

  // İlk çalıştırma: geçmiş bildirimleri göndermeden "gönderildi" say
  const { count } = await check(db.from("sent_disclosures").select("*", { count: "exact", head: true }));
  if (count === 0) {
    await check(db.from("sent_disclosures").insert(items.map((d) => ({ disclosure_id: d.id }))));
    return console.log(`İlk çalıştırma: ${items.length} mevcut bildirim kaydedildi, gönderim yapılmadı`);
  }
  if (fresh.length === 0) return console.log("Yeni bildirim yok");

  // Önce kaydet: bir hata olursa aynı bildirim tekrar tekrar gönderilmesin
  await check(db.from("sent_disclosures").upsert(fresh.map((d) => ({ disclosure_id: d.id }))));

  // Kullanıcı → o kullanıcıyı ilgilendiren yeni bildirimler
  const watchers = new Map(); // code → Set(user_id)
  for (const r of watchRows) {
    if (!watchers.has(r.code)) watchers.set(r.code, new Set());
    watchers.get(r.code).add(r.user_id);
  }
  const perUser = new Map();
  for (const d of fresh) {
    const users = new Set(d.codes.flatMap((c) => [...(watchers.get(c) ?? [])]));
    for (const u of users) {
      if (!perUser.has(u)) perUser.set(u, []);
      perUser.get(u).push(d);
    }
  }

  const { data: subs } = await check(
    db.from("push_subscriptions").select("endpoint, user_id, p256dh, auth").in("user_id", [...perUser.keys()]),
  );

  let sentCount = 0;
  const dead = [];
  for (const sub of subs) {
    const list = perUser.get(sub.user_id) ?? [];
    const payloads = list.slice(0, MAX_PER_USER).map((d) => ({
      title: `${d.codes.join(", ")} · KAP bildirimi`,
      body: d.summary ? `${d.subject}\n${d.summary}` : d.subject,
      url: d.url,
      tag: String(d.id),
    }));
    if (list.length > MAX_PER_USER) {
      payloads.push({
        title: "KAP bildirimleri",
        body: `İzleme listende ${list.length} yeni bildirim var.`,
        url: `${siteUrl}/izleme-listesi`,
        tag: "ozet",
      });
    }
    for (const p of payloads) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(p),
          { TTL: 6 * 3600 },
        );
        sentCount++;
      } catch (e) {
        // 404/410: tarayıcı aboneliği iptal etmiş
        if (e.statusCode === 404 || e.statusCode === 410) {
          dead.push(sub.endpoint);
          break;
        }
        console.error(`Gönderilemedi (${e.statusCode ?? "?"}): ${e.body ?? e.message}`);
      }
    }
  }

  if (dead.length) await check(db.from("push_subscriptions").delete().in("endpoint", dead));
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString();
  await check(db.from("sent_disclosures").delete().lt("sent_at", cutoff));

  console.log(
    `${fresh.length} yeni bildirim, ${perUser.size} kullanıcı, ${sentCount} push gönderildi, ${dead.length} ölü abonelik silindi`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
