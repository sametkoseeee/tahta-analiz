"use client";

import { useEffect, useMemo, useState } from "react";
import { num } from "@/lib/format";
import { useLive } from "@/lib/live";
import { parse } from "./CapitalCalculator";

/** Hissenin son açıklanan nakit kâr payı (pay başına) */
export type DividendPreset = { code: string; price: number | null; gross: number; net: number; payDate: string | null };

type Row = { code: string; lots: string };

const STORE_KEY = "temettu-hesaplama";
const empty = (): Row[] => Array.from({ length: 3 }, () => ({ code: "", lots: "" }));
const date = (d: string | null) => (d ? d.split("-").reverse().join(".") : "–");

/** Elindeki hisselerden ne kadar temettü alacağını hesaplar; satırlar tarayıcıda hatırlanır */
export default function DividendIncomeCalculator({ presets }: { presets: DividendPreset[] }) {
  const [rows, setRows] = useState<Row[]>(empty);
  const [loaded, setLoaded] = useState(false);
  const { quotes } = useLive();
  const byCode = useMemo(() => new Map(presets.map((p) => [p.code, p])), [presets]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null") as Row[] | null;
      if (saved?.length) setRows(saved);
    } catch {
      // Gizli sekme vb.: boş başlar
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(rows));
    } catch {
      // Kaydedilemezse yalnızca bu oturumda kalır
    }
  }, [rows, loaded]);

  const update = (i: number, key: keyof Row, value: string) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: key === "code" ? value.toUpperCase().trim() : value } : row)));
  const remove = (i: number) => setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : empty()));

  const lines = rows.map((r) => {
    const p = byCode.get(r.code);
    const lots = parse(r.lots);
    if (!p || !lots || lots <= 0) return null;
    const price = quotes[p.code]?.p ?? p.price;
    return { p, net: p.net * lots, gross: p.gross * lots, value: price ? price * lots : null };
  });
  const net = lines.reduce((s, l) => s + (l?.net ?? 0), 0);
  const gross = lines.reduce((s, l) => s + (l?.gross ?? 0), 0);
  const value = lines.reduce((s, l) => s + (l?.value ?? 0), 0);
  const filled = lines.some(Boolean);
  const unknown = rows.filter((r) => r.code.length >= 3 && !byCode.has(r.code)).map((r) => r.code);

  const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm tabular outline-none focus:border-accent";

  return (
    <section className="card p-4">
      <h2 className="font-semibold">Temettü Geliri Hesaplama</h2>
      <p className="mt-0.5 text-sm text-muted">
        Elindeki hisseleri ve lot sayısını gir; şirketlerin son açıkladığı kâr payına göre ne kadar temettü alacağını gör.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <datalist id="temettu-hisseler">
            {presets.map((p) => (
              <option key={p.code} value={p.code} />
            ))}
          </datalist>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_1.5rem] items-center gap-2 text-xs font-medium text-muted">
            <span>Hisse</span>
            <span className="text-right">Lot</span>
            <span className="text-right">Net temettü (₺)</span>
            <span />
          </div>
          <div className="mt-1 space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_1.5rem] items-center gap-2">
                <input
                  list="temettu-hisseler"
                  aria-label={`${i + 1}. hisse kodu`}
                  value={r.code}
                  onChange={(e) => update(i, "code", e.target.value)}
                  placeholder="Örn: TUPRS"
                  className={`${field} uppercase`}
                />
                <input
                  inputMode="decimal"
                  aria-label={`${i + 1}. hisse lot sayısı`}
                  value={r.lots}
                  onChange={(e) => update(i, "lots", e.target.value)}
                  placeholder="Lot"
                  className={`${field} text-right`}
                />
                <span className="truncate text-right text-sm tabular">
                  {lines[i] ? num(lines[i]!.net) : "–"}
                  {lines[i] && <span className="block text-[11px] text-muted">ödeme {date(lines[i]!.p.payDate)}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`${i + 1}. satırı sil`}
                  title="Satırı sil"
                  className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-surface-2 hover:text-down"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {unknown.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              {unknown.join(", ")}: son dönemde nakit kâr payı açıklanmamış ya da hisse bulunamadı.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRows((r) => [...r, { code: "", lots: "" }])}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
            >
              + Hisse ekle
            </button>
            <button
              type="button"
              onClick={() => setRows(empty())}
              className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-text"
            >
              Temizle
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-surface-2 p-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Net temettü (eline geçen)", filled ? `${num(net)} ₺` : null],
              ["Brüt temettü", filled ? `${num(gross)} ₺` : null],
              ["Portföy değeri", filled && value ? `${num(value)} ₺` : null],
              ["Temettü verimi (brüt)", filled && value ? `%${num((gross / value) * 100)}` : null],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-lg border border-border bg-surface p-3">
                <div className="text-xs text-muted">{k}</div>
                <div className="mt-1 whitespace-nowrap text-base font-semibold tabular sm:text-lg">{v || "–"}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            1 lot = 1 pay. Şirketin KAP&apos;a bildirdiği son nakit kâr payı (pay başına) kullanılır; net tutar stopaj
            düşülmüş halidir. Gelecek yıl dağıtılacak tutar farklı olabilir. Girdiğin değerler yalnızca bu tarayıcıda
            saklanır.
          </p>
        </div>
      </div>
    </section>
  );
}
