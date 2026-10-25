"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { compact, num } from "@/lib/format";
import type { CapitalAction } from "@/lib/types";

type Kind = "all" | "bedelli" | "bedelsiz" | "tahsisli" | "azaltim";
type StatusFilter = "active" | "all";

const KINDS: { key: Kind; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "bedelli", label: "Bedelli" },
  { key: "bedelsiz", label: "Bedelsiz" },
  { key: "tahsisli", label: "Tahsisli" },
  { key: "azaltim", label: "Azaltım" },
];

const STATUS_STYLE: Record<CapitalAction["status"], string> = {
  "YK kararı": "bg-surface-2 text-muted",
  "SPK başvurusu": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "SPK onayı": "bg-accent-soft text-accent",
  "Hak kullanımı": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Tamamlandı: "bg-surface-2 text-text",
  İptal: "bg-red-500/10 text-down line-through",
};

const date = (d?: string | null) => (d ? d.split("-").reverse().join(".") : "–");
const rate = (v?: number) => (v == null ? "–" : `%${num(v, v % 1 ? 2 : 0)}`);

function matchesKind(r: CapitalAction, k: Kind) {
  if (k === "bedelli") return r.bedelliOran != null;
  if (k === "bedelsiz") return r.bedelsizOran != null;
  if (k === "tahsisli") return r.tahsisliOran != null;
  if (k === "azaltim") return r.azaltimOran != null || (r.ulasilacak ?? 0) < (r.mevcut ?? 0);
  return true;
}

export default function CapitalTable({ rows, initialCode = "" }: { rows: CapitalAction[]; initialCode?: string }) {
  const [kind, setKind] = useState<Kind>("all");
  const [status, setStatus] = useState<StatusFilter>(initialCode ? "all" : "active");
  const [q, setQ] = useState(initialCode);
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const term = q.trim().toLocaleUpperCase("tr");
    return rows.filter(
      (r) =>
        matchesKind(r, kind) &&
        (status === "all" || (r.status !== "Tamamlandı" && r.status !== "İptal")) &&
        (!term || r.code.includes(term) || r.company.toLocaleUpperCase("tr").includes(term)),
    );
  }, [rows, kind, status, q]);

  const chip = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-sm ${active ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"}`;

  return (
    <div className="space-y-3">
      {/* Şirket sayfasında yalnızca o şirketin işlemleri gösterilir, filtre gerekmez */}
      <div className={`flex-wrap items-center gap-2 ${initialCode ? "hidden" : "flex"}`}>
        <div className="flex flex-wrap gap-1">
          {KINDS.map((k) => (
            <button key={k.key} onClick={() => setKind(k.key)} className={chip(kind === k.key)}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 border-l border-border pl-2">
          <button onClick={() => setStatus("active")} className={chip(status === "active")}>
            Devam eden
          </button>
          <button onClick={() => setStatus("all")} className={chip(status === "all")}>
            Tamamlananlar dahil
          </button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hisse kodu veya şirket"
          className="ml-auto w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm sm:w-56"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm tabular">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Hisse</th>
              <th className="px-3 py-2.5 text-right font-medium" title="Rüçhan hakkı kullandırılarak bedelli artırım">
                Bedelli
              </th>
              <th className="px-3 py-2.5 text-right font-medium" title="İç kaynaklardan ve kâr payından bedelsiz">
                Bedelsiz
              </th>
              <th className="px-3 py-2.5 text-right font-medium" title="Rüçhan hakkı kısıtlanarak tahsisli satış">
                Tahsisli
              </th>
              <th className="px-3 py-2.5 text-right font-medium">Rüçhan Fiyatı</th>
              <th className="px-3 py-2.5 text-right font-medium">Mevcut Sermaye</th>
              <th className="px-3 py-2.5 text-right font-medium">Ulaşılacak Sermaye</th>
              <th className="px-3 py-2.5 text-right font-medium">YK Kararı</th>
              <th className="px-3 py-2.5 text-right font-medium">SPK Onayı</th>
              <th className="px-3 py-2.5 text-right font-medium">Hak Kullanımı</th>
              <th className="px-3 py-2.5 text-left font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const key = `${r.code}-${r.ykKarar}-${r.disclosures[0]?.id}`;
              const start = r.ruchanBaslangic ?? r.bedelsizBaslangic ?? r.tahsisliTarih;
              return (
                <Fragment key={key}>
                  <tr
                    onClick={() => setOpen(open === key ? null : key)}
                    className="cursor-pointer border-b border-border hover:bg-surface-2"
                  >
                    <td className="px-3 py-2">
                      {r.listed ? (
                        <Link
                          href={`/sirketler/${r.code}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-accent"
                        >
                          {r.code}
                        </Link>
                      ) : (
                        <span className="font-semibold">{r.code}</span>
                      )}
                      <div className="max-w-56 truncate text-xs text-muted">{r.company}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{rate(r.bedelliOran)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{rate(r.bedelsizOran)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{rate(r.tahsisliOran)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {r.ruchanFiyat != null ? `${num(r.ruchanFiyat)} ₺` : "–"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{compact(r.mevcut)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{compact(r.ulasilacak)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{date(r.ykKarar)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{date(r.spkOnay)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {date(start)}
                      {r.ruchanBitis && <span className="text-muted"> – {date(r.ruchanBitis)}</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                  {open === key && (
                    <tr className="border-b border-border bg-surface-2/50">
                      <td colSpan={11} className="px-3 py-2">
                        <ul className="space-y-1 text-xs">
                          {r.disclosures.map((d) => (
                            <li key={d.id} className="flex gap-3">
                              <span className="shrink-0 text-muted tabular">{date(d.date)}</span>
                              <a
                                href={`https://www.kap.org.tr/tr/Bildirim/${d.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-accent hover:underline"
                              >
                                {d.summary || "KAP bildirimi"}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-10 text-center text-muted">
                  Kriterlere uyan sermaye işlemi yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Satıra tıklayınca ilgili KAP bildirimleri açılır. Oranlar mevcut sermayeye göredir.
      </p>
    </div>
  );
}
