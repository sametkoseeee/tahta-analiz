"use client";

import { useState } from "react";
import { num } from "@/lib/format";
import { useLive } from "@/lib/live";
import { parse, type CalcPreset } from "./CapitalCalculator";

/** Rüçhan hakkı: hak kullanım maliyeti, teorik fiyat ve hak (kupon) değeri */
export default function RightsCalculator({ presets }: { presets: CalcPreset[] }) {
  const { quotes } = useLive();
  const [code, setCode] = useState("");
  const [lots, setLots] = useState("");
  const [price, setPrice] = useState("");
  const [rightsPrice, setRightsPrice] = useState("1");
  const [rightsPct, setRightsPct] = useState("");
  const [cost, setCost] = useState("");

  const options = presets.filter((p) => p.rightsPct);
  const pick = (c: string) => {
    setCode(c);
    const p = options.find((x) => x.code === c);
    if (!p) return;
    const live = quotes[c]?.p ?? p.price;
    setPrice(live ? String(live).replace(".", ",") : "");
    setRightsPct(p.rightsPct ? String(p.rightsPct).replace(".", ",") : "");
    setRightsPrice(p.rightsPrice ? String(p.rightsPrice).replace(".", ",") : "1");
  };

  const L = parse(lots);
  const P = parse(price);
  const K = parse(rightsPrice) ?? 0;
  const r = (parse(rightsPct) ?? 0) / 100;
  const C = parse(cost) ?? P; // ortalama maliyet girilmezse güncel fiyat
  const ready = L != null && L > 0 && P != null && P > 0 && r > 0;

  // Teorik fiyat = (eski fiyat + oran × kullanım fiyatı) / (1 + oran); 1 hakkın değeri = teorik fiyat − kullanım fiyatı
  const res = ready
    ? (() => {
        const added = L * r;
        const theo = (P + r * K) / (1 + r);
        const right = Math.max(theo - K, 0);
        return {
          added,
          cash: added * K,
          theo,
          right,
          sale: added * right,
          avg: (L * (C ?? P) + added * K) / (L + added),
        };
      })()
    : null;

  const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "mb-1 block text-xs font-medium text-muted";
  const cards: [string, string | null][] = [
    ["Kullanılabilir yeni lot", res && num(res.added)],
    ["Gerekli toplam nakit", res && `${num(res.cash)} ₺`],
    ["Teorik fiyat (hak kullanım sonrası)", res && `${num(res.theo)} ₺`],
    ["Teorik hak değeri (1 rüçhan hakkı)", res && `${num(res.right)} ₺`],
    ["Kullanım sonrası ortalama maliyet", res && `${num(res.avg)} ₺`],
    ["Hakları satarsan teorik gelir", res && `${num(res.sale)} ₺`],
  ];

  return (
    <section className="card p-4">
      <h2 className="font-semibold">Rüçhan Hakkı Hesaplama</h2>
      <p className="mt-0.5 text-sm text-muted">
        Bedelli artırımda yeni pay alma (rüçhan) hakkını kullanmanın maliyeti, teorik fiyat ve hakkın değeri.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Etiketler farklı uzunlukta: kutular aynı hizada kalsın */}
        <div className="grid grid-cols-2 items-end gap-3">
          <label className="col-span-2">
            <span className={label}>Hisse (isteğe bağlı, seçince oranlar dolar)</span>
            <select value={code} onChange={(e) => pick(e.target.value)} className={field}>
              <option value="">Elle gir</option>
              {options.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} · Bedelli %{num(p.rightsPct, 0)}
                  {p.rightsPrice ? ` · ${num(p.rightsPrice)} ₺` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={label}>Sahip olduğun lot</span>
            <input inputMode="decimal" value={lots} onChange={(e) => setLots(e.target.value)} placeholder="Örn: 1000" className={field} />
          </label>
          <label>
            <span className={label}>Hak kullanım öncesi fiyat (₺)</span>
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Örn: 25,40" className={field} />
          </label>
          <label>
            <span className={label}>Rüçhan kullanım fiyatı (₺)</span>
            <input inputMode="decimal" value={rightsPrice} onChange={(e) => setRightsPrice(e.target.value)} placeholder="Örn: 1" className={field} />
          </label>
          <label>
            <span className={label}>Rüçhan oranı (%)</span>
            <input inputMode="decimal" value={rightsPct} onChange={(e) => setRightsPct(e.target.value)} placeholder="Örn: 100" className={field} />
          </label>
          <label className="col-span-2">
            <span className={label}>Ortalama maliyetin (₺, isteğe bağlı; boşsa güncel fiyat alınır)</span>
            <input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Örn: 18,75" className={field} />
          </label>
        </div>

        <div className="rounded-xl bg-surface-2 p-4">
          <div className="grid grid-cols-2 gap-3">
            {cards.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-surface p-3">
                <div className="text-xs text-muted">{k}</div>
                <div className="mt-1 whitespace-nowrap text-base font-semibold tabular sm:text-lg">{v || "–"}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Teorik fiyat, mevcut fiyat ile kullanım fiyatının rüçhan oranına göre ağırlıklandırılmasıyla bulunur. Hak
            değeri, teorik fiyat ile kullanım fiyatı arasındaki farktır; rüçhan hakkı kuponu borsada bu değerin
            çevresinde işlem görür. Piyasa fiyatları farklı oluşabilir.
          </p>
        </div>
      </div>
    </section>
  );
}
