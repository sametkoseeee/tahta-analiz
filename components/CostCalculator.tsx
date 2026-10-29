"use client";

import { useEffect, useState } from "react";
import { changeClass, num } from "@/lib/format";
import { parse } from "./CapitalCalculator";

type Row = { price: string; lots: string };

const STORE_KEY = "maliyet-hesaplama";
const empty = (): Row[] => Array.from({ length: 4 }, () => ({ price: "", lots: "" }));

/** Farklı fiyatlardan alımların ortalama maliyeti; satırlar tarayıcıda hatırlanır */
export default function CostCalculator() {
  const [rows, setRows] = useState<Row[]>(empty);
  const [current, setCurrent] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null") as { rows: Row[]; current: string } | null;
      if (saved?.rows?.length) {
        setRows(saved.rows);
        setCurrent(saved.current ?? "");
      }
    } catch {
      // Gizli sekme vb.: boş başlar
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ rows, current }));
    } catch {
      // Kaydedilemezse yalnızca bu oturumda kalır
    }
  }, [rows, current, loaded]);

  const update = (i: number, key: keyof Row, value: string) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: value } : row)));
  const remove = (i: number) => setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : empty()));

  const lines = rows.map((r) => {
    const p = parse(r.price);
    const l = parse(r.lots);
    return p != null && l != null && p > 0 && l > 0 ? p * l : null;
  });
  let lots = 0;
  let total = 0;
  rows.forEach((r, i) => {
    if (lines[i] == null) return;
    lots += parse(r.lots)!;
    total += lines[i]!;
  });
  const avg = lots > 0 ? total / lots : null;
  const cur = parse(current);
  const value = cur && lots > 0 ? cur * lots : null;
  const pnl = value != null ? value - total : null;
  const pnlPct = pnl != null && total > 0 ? pnl / total : null;

  const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-right text-sm tabular outline-none focus:border-accent";

  return (
    <section className="card p-4">
      <h2 className="font-semibold">Hisse Maliyet Hesaplama</h2>
      <p className="mt-0.5 text-sm text-muted">
        Aynı hisseyi farklı fiyatlardan aldıysan ortalama maliyetini bul. Güncel fiyatı girersen kâr/zararını da görürsün.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_1.5rem] items-center gap-2 text-xs font-medium text-muted">
            <span />
            <span className="text-right">Fiyat (₺)</span>
            <span className="text-right">Lot</span>
            <span className="text-right">Tutar (₺)</span>
            <span />
          </div>
          <div className="mt-1 space-y-2">
            {rows.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_1.5rem] items-center gap-2"
              >
                <span className="text-sm font-semibold text-muted">{i + 1}.</span>
                <input
                  inputMode="decimal"
                  aria-label={`${i + 1}. alım fiyatı`}
                  value={r.price}
                  onChange={(e) => update(i, "price", e.target.value)}
                  placeholder="Fiyat"
                  className={field}
                />
                <input
                  inputMode="decimal"
                  aria-label={`${i + 1}. alım lot sayısı`}
                  value={r.lots}
                  onChange={(e) => update(i, "lots", e.target.value)}
                  placeholder="Lot"
                  className={field}
                />
                <span className="truncate text-right text-sm tabular">{lines[i] != null ? num(lines[i]) : "–"}</span>
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
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRows((r) => [...r, { price: "", lots: "" }])}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
            >
              + Alım ekle
            </button>
            <button
              type="button"
              onClick={() => {
                setRows(empty());
                setCurrent("");
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-text"
            >
              Temizle
            </button>
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-muted">Güncel fiyat (₺, isteğe bağlı)</span>
            <input
              inputMode="decimal"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Örn: 25,40"
              className={`${field} text-left`}
            />
          </label>
        </div>

        <div className="rounded-xl bg-surface-2 p-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Ortalama maliyet", avg != null ? `${num(avg, avg < 10 ? 4 : 2)} ₺` : null, ""],
              ["Toplam lot", lots > 0 ? num(lots, 0) : null, ""],
              ["Toplam maliyet", lots > 0 ? `${num(total)} ₺` : null, ""],
              ["Güncel değer", value != null ? `${num(value)} ₺` : null, ""],
              ["Kâr / zarar", pnl != null ? `${pnl > 0 ? "+" : ""}${num(pnl)} ₺` : null, changeClass(pnl)],
              ["Getiri", pnlPct != null ? `${pnlPct > 0 ? "+" : ""}%${num(pnlPct * 100)}` : null, changeClass(pnlPct)],
            ].map(([k, v, cls]) => (
              <div key={k as string} className="rounded-lg border border-border bg-surface p-3">
                <div className="text-xs text-muted">{k}</div>
                <div className={`mt-1 whitespace-nowrap text-base font-semibold tabular sm:text-lg ${cls}`}>{v || "–"}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Ortalama maliyet = toplam ödenen tutar / toplam lot. Komisyon ve vergiler dahil değildir. Girdiğin değerler
            yalnızca bu tarayıcıda saklanır.
          </p>
        </div>
      </div>
    </section>
  );
}
