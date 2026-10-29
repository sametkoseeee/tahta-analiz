"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CapitalIncrease, CapitalStatus } from "@/lib/capital";
import { compact, num } from "@/lib/format";
import { STICKY_CELL, STICKY_HEAD } from "./CompaniesTable";
import WatchButton from "./WatchButton";

type Tab = "open" | "done" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "open", label: "Süren" },
  { key: "done", label: "Tamamlanan" },
  { key: "cancelled", label: "İptal edilen" },
];

const STATUS_STYLE: Record<CapitalStatus, string> = {
  Karar: "bg-surface-2 text-muted",
  "SPK başvurusu": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "SPK onaylı": "bg-accent-soft text-accent",
  "Tarih belli": "bg-accent-soft text-accent",
  "Rüçhan süreci": "bg-up-soft text-up",
  Tamamlandı: "bg-surface-2 text-muted",
  İptal: "bg-down-soft text-down",
};

const date = (d: string | null | undefined) => (d ? d.split("-").reverse().join(".") : null);
const pctText = (v: number | null | undefined) => (v ? `%${num(v, v % 1 ? 2 : 0)}` : "–");

/** Arama için: şirket adları KAP'ta Türkçe karaktersiz de yazılabiliyor ("Sekerbank"), harfler eşitlenir */
const norm = (s: string) =>
  s
    .toLocaleUpperCase("tr")
    .replace(/[ŞĞÜÖÇİ]/g, (c) => ({ Ş: "S", Ğ: "G", Ü: "U", Ö: "O", Ç: "C", İ: "I" })[c]!);

function tab(d: CapitalIncrease): Tab {
  if (d.status === "İptal") return "cancelled";
  return d.status === "Tamamlandı" ? "done" : "open";
}

/** Rüçhan ya da bedelsiz hak kullanım tarihleri */
function dates(d: CapitalIncrease): string {
  const r = d.rights;
  if (r?.start) return `Rüçhan ${date(r.start)}${r.end ? ` – ${date(r.end)}` : ""}`;
  if (d.bonus?.start) return `Bedelsiz ${date(d.bonus.start)}`;
  if (d.spkApproved) return `SPK onayı ${date(d.spkApproved)}`;
  if (d.spkApplied) return `SPK başvurusu ${date(d.spkApplied)}`;
  return d.decision ? `Karar ${date(d.decision)}` : "–";
}

export default function CapitalTable({ items }: { items: CapitalIncrease[] }) {
  const [active, setActive] = useState<Tab>("open");
  const [query, setQuery] = useState("");
  const q = norm(query.trim());
  // Arama yapılınca hisse hangi sekmede olursa olsun gösterilir
  const matches = useMemo(
    () => (q ? items.filter((d) => norm(d.code).includes(q) || norm(d.name).includes(q)) : items),
    [items, q],
  );
  const counts = useMemo(() => {
    const c = { open: 0, done: 0, cancelled: 0 };
    matches.forEach((d) => c[tab(d)]++);
    return c;
  }, [matches]);
  const list = q ? matches : items.filter((d) => tab(d) === active);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hisse ara (ör. SKBNK)"
          aria-label="Sermaye artırımı tablosunda hisse ara"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent sm:w-64"
        />
        <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActive(t.key);
                setQuery("");
              }}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
                !q && active === t.key ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              {t.label} <span className="opacity-70">({counts[t.key]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className={`whitespace-nowrap px-3 py-2.5 text-left font-medium ${STICKY_HEAD}`}>Hisse</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Mevcut sermaye</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium" title="Rüçhan hakkı kullandırılarak">
                Bedelli
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium" title="1 TL nominal pay için">
                Rüçhan fiyatı
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Bedelsiz</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium" title="Rüçhan hakkı kısıtlanarak belirli kişilere">
                Tahsisli
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Ulaşılacak sermaye</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">Tarih</th>
              <th className="px-3 py-2.5 text-left font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.code} className="group border-b border-border last:border-0 hover:bg-surface-2">
                <td className={`px-3 py-2 ${STICKY_CELL}`}>
                  <div className="flex items-center gap-2.5">
                    <WatchButton code={d.code} compact />
                    <Link href={`/sirketler/${d.code}`} className="block min-w-0">
                      <div className="font-semibold text-accent">{d.code}</div>
                      <div className="max-w-28 truncate text-xs text-muted sm:max-w-52">{d.name}</div>
                    </Link>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{compact(d.current)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{pctText(d.rights?.pct)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{d.rights?.price ? num(d.rights.price) : "–"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{pctText(d.bonus?.pct)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  {d.allocated ? (d.allocated.amount ? compact(d.allocated.amount) : "Var") : "–"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{compact(d.target)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-muted">{dates(d)}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <a
                    href={`https://www.kap.org.tr/tr/Bildirim/${d.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title={d.summary ?? "KAP bildirimi"}
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[d.status]}`}
                  >
                    {d.status}
                  </a>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-muted">
                  {q ? `“${query.trim()}” son 12 ayda sermaye artırımı bildirmemiş.` : "Bu listede şirket yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Sermaye tutarları TL&apos;dir; oranlar mevcut sermayeye göredir. Rüçhan fiyatı 1 TL nominal değerli pay
        içindir. Durum, şirketin KAP&apos;taki son bildirimine göre belirlenir; durumun üzerine tıklayınca bildirim açılır.
      </p>
    </div>
  );
}
