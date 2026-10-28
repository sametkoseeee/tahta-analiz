"use client";

import { useState } from "react";
import { num } from "@/lib/format";
import { useLive } from "@/lib/live";

/** Tablodaki süren artırımlar: seçilince alanlar dolar */
export type CalcPreset = {
  code: string;
  price: number | null;
  rightsPct: number | null;
  rightsPrice: number | null;
  bonusPct: number | null;
};

/** "1.234,5" ya da "1234.5" → 1234.5 */
export function parse(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const v = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return isFinite(v) ? v : null;
}

const fmt = (v: number) => num(v);

export default function CapitalCalculator({ presets }: { presets: CalcPreset[] }) {
  const { quotes } = useLive();
  const [code, setCode] = useState("");
  const [lots, setLots] = useState("");
  const [price, setPrice] = useState("");
  const [rightsPct, setRightsPct] = useState("");
  const [rightsPrice, setRightsPrice] = useState("1");
  const [bonusPct, setBonusPct] = useState("");

  const pick = (c: string) => {
    setCode(c);
    const p = presets.find((x) => x.code === c);
    if (!p) return;
    const live = quotes[c]?.p ?? p.price;
    setPrice(live ? String(live).replace(".", ",") : "");
    setRightsPct(p.rightsPct ? String(p.rightsPct).replace(".", ",") : "");
    setRightsPrice(p.rightsPrice ? String(p.rightsPrice).replace(".", ",") : "1");
    setBonusPct(p.bonusPct ? String(p.bonusPct).replace(".", ",") : "");
  };

  const L = parse(lots);
  const P = parse(price);
  const rb = (parse(rightsPct) ?? 0) / 100;
  const K = parse(rightsPrice) ?? 0;
  const rs = (parse(bonusPct) ?? 0) / 100;
  const ready = L != null && L > 0 && P != null && P > 0 && rb + rs > 0;

  // Bedelli payların bedeli ödenir; bedelsiz paylar karşılıksız gelir. Toplam değer korunur:
  // teorik fiyat = (eski fiyat + bedelli oran × rüçhan fiyatı) / (1 + bedelli oran + bedelsiz oran)
  const res = ready
    ? {
        added: L * (rb + rs),
        total: L * (1 + rb + rs),
        cash: L * rb * K,
        theo: (P + rb * K) / (1 + rb + rs),
        value: L * P + L * rb * K,
      }
    : null;

  const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "mb-1 block text-xs font-medium text-muted";

  return (
    <section className="card p-4">
      <h2 className="font-semibold">Sermaye Artırımı Hesaplama</h2>
      <p className="mt-0.5 text-sm text-muted">
        Bedelli ve bedelsiz artırım sonrası lot sayın, teorik fiyat ve ödemen gereken tutar. İkisi aynı anda da girilebilir.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Etiketler farklı uzunlukta: kutular aynı hizada kalsın */}
        <div className="grid grid-cols-2 items-end gap-3">
          <label className="col-span-2">
            <span className={label}>Hisse (isteğe bağlı, seçince oranlar dolar)</span>
            <select value={code} onChange={(e) => pick(e.target.value)} className={field}>
              <option value="">Elle gir</option>
              {presets.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code}
                  {p.rightsPct ? ` · Bedelli %${num(p.rightsPct, 0)}` : ""}
                  {p.bonusPct ? ` · Bedelsiz %${num(p.bonusPct, 0)}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={label}>Mevcut lot</span>
            <input inputMode="decimal" value={lots} onChange={(e) => setLots(e.target.value)} placeholder="Örn: 1000" className={field} />
          </label>
          <label>
            <span className={label}>Hisse fiyatı (₺)</span>
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Örn: 25,40" className={field} />
          </label>
          <label>
            <span className={label}>Bedelli oranı (%)</span>
            <input inputMode="decimal" value={rightsPct} onChange={(e) => setRightsPct(e.target.value)} placeholder="Örn: 100" className={field} />
          </label>
          <label>
            <span className={label}>Rüçhan (yeni pay) fiyatı (₺)</span>
            <input inputMode="decimal" value={rightsPrice} onChange={(e) => setRightsPrice(e.target.value)} placeholder="Örn: 1" className={field} />
          </label>
          <label className="col-span-2">
            <span className={label}>Bedelsiz oranı (%)</span>
            <input inputMode="decimal" value={bonusPct} onChange={(e) => setBonusPct(e.target.value)} placeholder="Örn: 200" className={field} />
          </label>
        </div>

        <div className="rounded-xl bg-surface-2 p-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Yeni toplam lot", res && fmt(res.total)],
              ["Eklenen lot", res && fmt(res.added)],
              ["Teorik fiyat", res && `${fmt(res.theo)} ₺`],
              ["Ödenecek tutar", res && `${fmt(res.cash)} ₺`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-surface p-3">
                <div className="text-xs text-muted">{k}</div>
                <div className="mt-1 whitespace-nowrap text-base font-semibold tabular sm:text-lg">{v || "–"}</div>
              </div>
            ))}
            <div className="col-span-2 rounded-lg border border-border bg-surface p-3">
              <div className="text-xs text-muted">Artırım sonrası portföy değeri (teorik)</div>
              <div className="mt-1 whitespace-nowrap text-base font-semibold tabular sm:text-lg">{res ? `${fmt(res.value)} ₺` : "–"}</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Bedelsizde portföy değeri değişmez: lot artar, fiyat aynı oranda düzelir. Bedellide yeni paylar için rüçhan
            fiyatı kadar ödeme yapılır; portföy değeri ödenen tutar kadar artar. Teorik fiyat, hak kullanımı günü
            borsanın uygulayacağı düzeltilmiş fiyattır; piyasa fiyatı farklı oluşabilir.
          </p>
        </div>
      </div>
    </section>
  );
}
