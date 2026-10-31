// Haftalık e-posta bülteni: bültene abone olan üyelere (newsletter tablosu) Resend ile gönderilir.
// Cuma akşamı yayın iş akışında, veri güncellendikten sonra çalışır (.github/workflows/yayin.yml).
// Diğer günler hiçbir şey yapmaz; elle denemek için: node --env-file=.env.local scripts/weekly_bulletin.mjs --force
// --dry-run: göndermez, e-postayı out/bulten.html'e yazar.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const env = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} ortam değişkeni eksik`);
  return v;
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://tahtaanaliz.com").replace(/\/$/, "");
const FROM = "Tahta Analiz <bulten@tahtaanaliz.com>";
const DATA = new URL("../data/", import.meta.url);
const read = (f) => (existsSync(new URL(f, DATA)) ? JSON.parse(readFileSync(new URL(f, DATA), "utf8")) : null);

// İstanbul saatine göre bugün ve önümüzdeki 7 gün
const istanbul = (d) => new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
const now = new Date();
const today = istanbul(now);
const weekEnd = istanbul(new Date(now.getTime() + 7 * 86400_000));
const weekAgo = istanbul(new Date(now.getTime() - 7 * 86400_000));
const isFriday = new Date(now.getTime() + 3 * 3600_000).getUTCDay() === 5;

const trDate = (d) => (d ? d.slice(0, 10).split("-").reverse().join(".") : "–");
const fmt = (v, digits = 2) => Number(v).toLocaleString("tr-TR", { maximumFractionDigits: digits });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const link = (path, text) => `<a href="${SITE}${path}" style="color:#2563eb;text-decoration:none">${esc(text)}</a>`;

function section(title, rows, empty, morePath) {
  const body = rows.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows
        .map((r) => `<tr>${r.map((c, i) => `<td style="padding:6px 4px;border-bottom:1px solid #e5e7eb;${i ? "text-align:right;color:#475569" : ""}">${c}</td>`).join("")}</tr>`)
        .join("")}</table>`
    : `<p style="color:#64748b;font-size:14px">${empty}</p>`;
  return `<h2 style="font-size:16px;margin:24px 0 8px">${title}</h2>${body}<p style="margin:6px 0 0;font-size:13px">${link(morePath, "Tümünü sitede gör →")}</p>`;
}

function buildHtml() {
  const names = new Map((read("companies.json")?.companies ?? []).map((c) => [c.code, c.name]));
  const stock = (code) => `${link(`/sirketler/${code}`, code)} <span style="color:#64748b;font-size:12px">${esc(names.get(code) ?? "")}</span>`;

  const reports = (read("reports.json")?.upcoming ?? [])
    .filter((r) => r.date >= today && r.date <= weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 25)
    .map((r) => [stock(r.code), trDate(r.date)]);

  const dividends = (read("dividends.json")?.items ?? [])
    .filter((d) => d.payDate && d.payDate >= today && d.payDate <= weekEnd && d.gross > 0)
    .sort((a, b) => a.payDate.localeCompare(b.payDate))
    .map((d) => [stock(d.code), `${fmt(d.net ?? d.gross, 4)} ₺ net`, trDate(d.payDate)]);

  const ipos = (read("ipos.json")?.items ?? [])
    .filter((d) => d.end && d.end >= today)
    .map((d) => [`<b>${esc(d.code)}</b> <span style="color:#64748b;font-size:12px">${esc(d.name)}</span>`, d.price ? `${fmt(d.price)} ₺` : "–", `${trDate(d.start)}–${trDate(d.end)}`]);

  const measures = (read("measures.json")?.items ?? [])
    .filter((m) => m.start >= weekAgo)
    .sort((a, b) => b.start.localeCompare(a.start))
    .map((m) => [stock(m.code), `${trDate(m.start)}–${trDate(m.end)}`]);

  const html = `<!doctype html><html lang="tr"><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:24px">
  <div style="font-size:20px;font-weight:bold">Tahta Analiz · Haftalık Bülten</div>
  <div style="color:#64748b;font-size:13px;margin-top:4px">${trDate(today)} · önümüzdeki 7 gün</div>
  ${section("Açıklanacak bilançolar", reports, "Bu hafta takvimde bilanço yok.", "/bilancolar/yaklasan")}
  ${section("Temettü ödemeleri", dividends, "Bu hafta temettü ödemesi yok.", "/temettu")}
  ${section("Halka arzlar", ipos, "Şu an talep toplayan ya da yaklaşan halka arz yok.", "/halka-arz")}
  ${section("Bu hafta tedbire girenler", measures, "Bu hafta yeni tedbir yok.", "/tedbirli-hisseler")}
  <p style="margin-top:28px;font-size:12px;color:#64748b">
    Bu e-postayı Tahta Analiz'de bültene abone olduğun için aldın. Yatırım tavsiyesi değildir.<br>
    Abonelikten çıkmak için: ${link("/portfoy#bulten", "Portföyüm › Haftalık e-posta bülteni")}
  </p>
</div></body></html>`;
  return { html, empty: !reports.length && !dividends.length && !ipos.length && !measures.length };
}

async function main() {
  if (!isFriday && !args.has("--force") && !DRY) return console.log("Bülten yalnızca cuma gönderilir");
  const { html, empty } = buildHtml();
  if (DRY) {
    mkdirSync(new URL("../out/", import.meta.url), { recursive: true });
    writeFileSync(new URL("../out/bulten.html", import.meta.url), html);
    return console.log("out/bulten.html yazıldı");
  }
  if (empty) return console.log("Bu hafta bültende içerik yok, gönderilmedi");

  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  const { data: subs, error } = await db.from("newsletter").select("user_id");
  if (error) throw new Error(error.message);
  if (!subs.length) return console.log("Abone yok");
  const wanted = new Set(subs.map((s) => s.user_id));

  // Abonelerin e-posta adresleri (yalnızca doğrulanmış hesaplar)
  const emails = [];
  for (let page = 1; ; page++) {
    const { data, error: e } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (e) throw new Error(e.message);
    for (const u of data.users) if (wanted.has(u.id) && u.email && u.email_confirmed_at) emails.push(u.email);
    if (data.users.length < 1000) break;
  }

  const key = env("RESEND_API_KEY");
  let sent = 0;
  // Her aboneye ayrı e-posta (alıcılar birbirini görmesin); Resend saniyede 2 istek sınırı
  for (const to of emails) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject: `Haftalık Bülten · ${trDate(today)}`, html }),
    });
    if (r.ok) sent++;
    else console.error(`Gönderilemedi (${r.status}): ${(await r.text()).slice(0, 200)}`);
    await new Promise((res) => setTimeout(res, 600));
  }
  console.log(`${emails.length} abone, ${sent} e-posta gönderildi`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
