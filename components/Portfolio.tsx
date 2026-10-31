"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/auth";
import { changeClass, num, signedPct } from "@/lib/format";
import { useLive } from "@/lib/live";
import { getSupabase } from "@/lib/supabase/client";
import { parse } from "./CapitalCalculator";
import type { DividendPreset } from "./DividendIncomeCalculator";
import NewsletterToggle from "./NewsletterToggle";

/** Portföy formunda seçilebilecek hisseler */
export type Quote = { code: string; name: string; price: number | null; change: number | null };

type Holding = { code: string; lots: number; cost: number };

const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm tabular outline-none focus:border-accent";

function SignInPrompt() {
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <div className="text-3xl">💼</div>
      <h2 className="mt-2 text-lg font-semibold">Portföyüm üyelere özel</h2>
      <p className="mt-2 text-sm text-muted">
        Ücretsiz üye ol; elindeki hisseleri ve maliyetini gir, güncel değerini, kâr / zararını ve alacağın temettüyü tek
        yerde gör.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link href="/giris?kayit=1&next=/portfoy" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Üye ol
        </Link>
        <Link href="/giris?next=/portfoy" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">
          Giriş yap
        </Link>
      </div>
    </div>
  );
}

export default function Portfolio({ quotes: base, dividends }: { quotes: Quote[]; dividends: DividendPreset[] }) {
  const user = useUser();
  const { quotes: live } = useLive();
  const [rows, setRows] = useState<Holding[] | null>(null);
  const [form, setForm] = useState({ code: "", lots: "", cost: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byCode = useMemo(() => new Map(base.map((q) => [q.code, q])), [base]);
  const divs = useMemo(() => new Map(dividends.map((d) => [d.code, d])), [dividends]);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error } = await supabase.from("portfolio").select("code, lots, cost").order("code");
    if (error) setError("Portföy yüklenemedi. Sayfayı yenileyip tekrar dene.");
    else setRows(data.map((r) => ({ code: r.code, lots: Number(r.lots), cost: Number(r.cost) })));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (user === undefined) return null;
  if (user === null) return <SignInPrompt />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const lots = parse(form.lots);
    const cost = parse(form.cost);
    if (!byCode.has(code)) return setError(`${code || "Hisse"} bulunamadı. Listeden bir hisse kodu seç.`);
    if (!lots || lots <= 0) return setError("Lot sayısını gir.");
    if (cost == null || cost < 0) return setError("Pay başına ortalama maliyeti gir.");
    setBusy(true);
    setError(null);
    const { error } = await getSupabase()!
      .from("portfolio")
      .upsert({ user_id: user.id, code, lots, cost, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return setError("Kaydedilemedi. Tekrar dene.");
    setForm({ code: "", lots: "", cost: "" });
    load();
  };

  const remove = async (code: string) => {
    if (!window.confirm(`${code} portföyden çıkarılsın mı?`)) return;
    await getSupabase()!.from("portfolio").delete().eq("user_id", user.id).eq("code", code);
    load();
  };

  const lines = (rows ?? []).map((h) => {
    const q = byCode.get(h.code);
    const price = live[h.code]?.p ?? q?.price ?? null;
    const change = live[h.code]?.c ?? q?.change ?? null;
    const value = price != null ? price * h.lots : null;
    const costTotal = h.cost * h.lots;
    const pnl = value != null ? value - costTotal : null;
    const d = divs.get(h.code);
    return {
      ...h,
      name: q?.name ?? "",
      price,
      value,
      costTotal,
      pnl,
      pnlPct: pnl != null && costTotal > 0 ? pnl / costTotal : null,
      // Günlük değişim tutarı: önceki kapanışa göre
      day: value != null && change != null ? value - value / (1 + change) : null,
      dividend: d ? d.net * h.lots : null,
    };
  });
  const total = lines.reduce((s, l) => s + (l.value ?? 0), 0);
  const cost = lines.reduce((s, l) => s + l.costTotal, 0);
  const pnl = total - cost;
  const day = lines.reduce((s, l) => s + (l.day ?? 0), 0);
  const dividend = lines.reduce((s, l) => s + (l.dividend ?? 0), 0);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Portföy değeri", lines.length ? `${num(total)} ₺` : "–", ""],
          ["Toplam maliyet", lines.length ? `${num(cost)} ₺` : "–", ""],
          ["Kâr / zarar", lines.length ? `${pnl > 0 ? "+" : ""}${num(pnl)} ₺` : "–", changeClass(pnl)],
          ["Bugün", lines.length ? `${day > 0 ? "+" : ""}${num(day)} ₺` : "–", changeClass(day)],
          ["Beklenen temettü (net)", dividend ? `${num(dividend)} ₺` : "–", ""],
        ].map(([k, v, cls]) => (
          <div key={k} className="card p-3">
            <div className="text-xs text-muted">{k}</div>
            <div className={`mt-1 whitespace-nowrap text-lg font-semibold tabular ${cls}`}>{v}</div>
            {k === "Kâr / zarar" && lines.length > 0 && cost > 0 && (
              <div className={`text-xs tabular ${cls}`}>{signedPct(pnl / cost)}</div>
            )}
          </div>
        ))}
      </section>

      <section className="card">
        <div className="border-b border-border p-3">
          <h2 className="font-semibold">Hisselerim</h2>
          <form onSubmit={save} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <datalist id="portfoy-hisseler">
              {base.map((q) => (
                <option key={q.code} value={q.code}>
                  {q.name}
                </option>
              ))}
            </datalist>
            <input
              list="portfoy-hisseler"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="Hisse kodu (ör. THYAO)"
              aria-label="Hisse kodu"
              className={`${field} uppercase`}
            />
            <input
              inputMode="decimal"
              value={form.lots}
              onChange={(e) => setForm({ ...form, lots: e.target.value })}
              placeholder="Lot"
              aria-label="Lot sayısı"
              className={field}
            />
            <input
              inputMode="decimal"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              placeholder="Ortalama maliyet (₺)"
              aria-label="Pay başına ortalama maliyet"
              className={field}
            />
            <button
              disabled={busy}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Kaydet
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-down">{error}</p>}
          <p className="mt-2 text-xs text-muted">
            Aynı hisseyi tekrar kaydedersen lot ve maliyet güncellenir. Farklı fiyatlardan aldıysan ortalama maliyeti{" "}
            <Link href="/hesaplama#maliyet" className="text-accent hover:underline">
              maliyet hesaplayıcıyla
            </Link>{" "}
            bulabilirsin.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                {["Hisse", "Lot", "Maliyet", "Fiyat", "Değer", "Kâr / zarar", "Pay", "Temettü (net)", ""].map((h, i) => (
                  <th key={i} className={`whitespace-nowrap px-3 py-2.5 font-medium ${i === 0 ? "text-left" : "text-right"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.code} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-3 py-2">
                    <Link href={`/sirketler/${l.code}`} className="font-semibold text-accent">
                      {l.code}
                    </Link>
                    <div className="max-w-40 truncate text-xs text-muted">{l.name}</div>
                  </td>
                  <td className="px-3 py-2 text-right">{num(l.lots, 0)}</td>
                  <td className="px-3 py-2 text-right">{num(l.cost)}</td>
                  <td className="px-3 py-2 text-right">{l.price != null ? num(l.price) : "–"}</td>
                  <td className="px-3 py-2 text-right">{l.value != null ? num(l.value) : "–"}</td>
                  <td className={`whitespace-nowrap px-3 py-2 text-right ${changeClass(l.pnl)}`}>
                    {l.pnl != null ? `${l.pnl > 0 ? "+" : ""}${num(l.pnl)}` : "–"}
                    <div className="text-xs">{l.pnlPct != null ? signedPct(l.pnlPct) : ""}</div>
                  </td>
                  <td className="px-3 py-2 text-right">{l.value != null && total ? `%${num((l.value / total) * 100, 1)}` : "–"}</td>
                  <td className="px-3 py-2 text-right">{l.dividend ? num(l.dividend) : "–"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => setForm({ code: l.code, lots: String(l.lots).replace(".", ","), cost: String(l.cost).replace(".", ",") })}
                      className="rounded px-1.5 text-xs text-muted hover:bg-surface-2 hover:text-text"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => remove(l.code)}
                      aria-label={`${l.code} sil`}
                      className="rounded px-1.5 text-muted hover:bg-surface-2 hover:text-down"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
              {rows && lines.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted">
                    Henüz hisse eklemedin. Yukarıdan hisse kodu, lot ve maliyet girerek başla.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <NewsletterToggle />

      <p className="text-xs text-muted">
        Fiyatlar yaklaşık 15 dakika gecikmelidir. Temettü, şirketin son açıkladığı nakit kâr payına göre tahmindir.
        Portföyün yalnızca senin hesabında saklanır, başkası göremez. Yatırım tavsiyesi değildir.
      </p>
    </div>
  );
}
