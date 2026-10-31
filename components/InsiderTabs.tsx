"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { compact, num } from "@/lib/format";
import type { Buyback, InsiderTrade } from "@/lib/insider";
import { matchesQuery, norm } from "@/lib/search";

const TABS = [
  { key: "alim-satim", label: "Yönetici ve ortak işlemleri" },
  { key: "geri-alimlar", label: "Pay geri alımları" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const date = (d: string) => d.split("-").reverse().join(".");
const kap = (id: number) => `https://kap.org.tr/tr/Bildirim/${id}`;

function Search({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Hisse ya da kişi ara"
      aria-label="İşlemlerde ara"
      className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent sm:w-56"
    />
  );
}

function Trades({ items }: { items: InsiderTrade[] }) {
  const [query, setQuery] = useState("");
  const q = norm(query.trim());
  const shown = q ? items.filter((t) => matchesQuery({ code: t.code, name: `${t.name ?? ""} ${t.by ?? ""}` }, q)) : items;
  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <p className="text-sm text-muted">Son 30 günde KAP&apos;a bildirilen pay alım-satımları ({items.length})</p>
        <Search value={query} onChange={setQuery} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Tarih</th>
              <th className="px-3 py-2.5 text-left font-medium">Hisse</th>
              <th className="px-3 py-2.5 text-left font-medium">İşlemi yapan</th>
              <th className="px-3 py-2.5 text-right font-medium">İşlem</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Lot</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Fiyat</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Tutar (₺)</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium" title="İşlem öncesi → sonrası sermayedeki payı">
                Ortaklık payı
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t) => {
              const side = t.net == null ? null : t.net > 0 ? "Alım" : t.net < 0 ? "Satım" : "—";
              return (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="whitespace-nowrap px-3 py-2">{date(t.date)}</td>
                  <td className="px-3 py-2">
                    <Link href={`/sirketler/${t.code}`} className="font-semibold text-accent hover:underline">
                      {t.code}
                    </Link>
                  </td>
                  <td className="max-w-64 truncate px-3 py-2" title={t.summary ?? undefined}>
                    {t.by}
                  </td>
                  <td className={`px-3 py-2 text-right font-medium ${side === "Alım" ? "text-up" : side === "Satım" ? "text-down" : ""}`}>
                    {side ?? (
                      <a href={kap(t.id)} target="_blank" rel="noreferrer" className="text-xs font-normal text-accent hover:underline">
                        Ayrıntı KAP&apos;ta
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">{t.net != null ? num(Math.abs(t.net), 0) : "–"}</td>
                  <td className="px-3 py-2 text-right">{t.price ? num(t.price) : "–"}</td>
                  <td className="px-3 py-2 text-right">{t.value ? compact(t.value) : "–"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {t.before != null && t.after != null ? `%${num(t.before)} → %${num(t.after)}` : "–"}
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 text-xs text-muted">
        Yönetim kurulu üyeleri, yöneticiler ve büyük ortaklar şirket paylarındaki işlemlerini KAP&apos;ta bildirir. Aracı
        kurum üzerinden yapılan bildirimlerde işlem ayrıntısı ektedir; &quot;Ayrıntı KAP&apos;ta&quot; bağlantısından
        görülebilir. Fiyat, bildirimde fiyat aralığı verildiyse ortalamasıdır.
      </p>
    </section>
  );
}

function Buybacks({ items }: { items: Buyback[] }) {
  const [query, setQuery] = useState("");
  const q = norm(query.trim());
  const shown = q ? items.filter((b) => matchesQuery({ code: b.code, name: b.name ?? "" }, q)) : items;
  // Son 30 günde en çok geri alım yapanlar (tutar)
  const leaders = useMemo(() => {
    const m = new Map<string, { code: string; value: number; nominal: number; ratio: number; days: number }>();
    for (const b of items) {
      const x = m.get(b.code) ?? { code: b.code, value: 0, nominal: 0, ratio: 0, days: 0 };
      x.value += b.value ?? 0;
      x.nominal += b.nominal;
      x.ratio += b.ratio;
      x.days += 1;
      m.set(b.code, x);
    }
    return [...m.values()].sort((a, b) => b.value - a.value).slice(0, 10);
  }, [items]);
  return (
    <div className="space-y-4">
      {leaders.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Son 30 Günde En Çok Geri Alım Yapanlar</h2>
          <ol className="grid gap-x-8 gap-y-1 md:grid-cols-2">
            {leaders.map((l, i) => (
              <li key={l.code} className="flex items-baseline gap-3 border-b border-border py-1.5 text-sm">
                <span className="w-5 shrink-0 text-right text-xs text-muted tabular">{i + 1}</span>
                <Link href={`/sirketler/${l.code}`} className="w-14 shrink-0 font-semibold text-accent hover:underline">
                  {l.code}
                </Link>
                <span className="min-w-0 flex-1 truncate text-xs text-muted">
                  {l.days} gün · sermayenin %{num(l.ratio, 3)}&apos;ü
                </span>
                <span className="shrink-0 tabular font-semibold">{compact(l.value)} ₺</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
          <p className="text-sm text-muted">Günlük geri alım işlemleri</p>
          <Search value={query} onChange={setQuery} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Tarih</th>
                <th className="px-3 py-2.5 text-left font-medium">Hisse</th>
                <th className="px-3 py-2.5 text-right font-medium">Lot</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Ort. fiyat</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Tutar (₺)</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Sermayeye oranı</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={`${b.code}-${b.date}`} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="whitespace-nowrap px-3 py-2">{date(b.date)}</td>
                  <td className="px-3 py-2">
                    <Link href={`/sirketler/${b.code}`} className="font-semibold text-accent hover:underline">
                      {b.code}
                    </Link>
                    <div className="max-w-48 truncate text-xs text-muted">{b.name}</div>
                  </td>
                  <td className="px-3 py-2 text-right">{num(b.nominal, 0)}</td>
                  <td className="px-3 py-2 text-right">{b.price ? num(b.price) : "–"}</td>
                  <td className="px-3 py-2 text-right">{b.value ? compact(b.value) : "–"}</td>
                  <td className="px-3 py-2 text-right">%{num(b.ratio, 4)}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted">
                    Kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-3 py-2 text-xs text-muted">
          Şirketlerin kendi paylarını borsadan geri alımları (KAP &quot;Payların Geri Alınmasına İlişkin Bildirim&quot;). Aynı
          gün farklı fiyatlardan yapılan alımlar toplanır; fiyat ağırlıklı ortalamadır.
        </p>
      </section>
    </div>
  );
}

export default function InsiderTabs({ trades, buybacks }: { trades: InsiderTrade[]; buybacks: Buyback[] }) {
  const [tab, setTab] = useState<Tab>("alim-satim");
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (TABS.some((t) => t.key === h)) setTab(h as Tab);
  }, []);
  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              history.replaceState(null, "", `#${t.key}`);
            }}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
              tab === t.key ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "alim-satim" ? <Trades items={trades} /> : <Buybacks items={buybacks} />}
    </div>
  );
}
