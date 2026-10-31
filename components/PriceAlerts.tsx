"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/auth";
import { num } from "@/lib/format";
import { useLive } from "@/lib/live";
import { pushSupported } from "@/lib/push";
import { getSupabase } from "@/lib/supabase/client";
import { parse } from "./CapitalCalculator";
import type { Quote } from "./Portfolio";

type Alert = {
  id: number;
  code: string;
  direction: "above" | "below";
  price: number;
  created_at: string;
  triggered_at: string | null;
  triggered_price: number | null;
};

const MAX_OPEN = 20;
const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm tabular outline-none focus:border-accent";
const when = (iso: string) => new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });

/** Fiyat alarmları: hisse belirlenen fiyatın üstüne / altına geçince Web Push bildirimi (scripts/alarm_push.mjs) */
export default function PriceAlerts({ quotes }: { quotes: Quote[] }) {
  const user = useUser();
  const { quotes: live } = useLive();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [form, setForm] = useState({ code: "", direction: "above" as Alert["direction"], price: "" });
  const [error, setError] = useState<string | null>(null);
  const byCode = useMemo(() => new Map(quotes.map((q) => [q.code, q])), [quotes]);

  const load = useCallback(async () => {
    const { data } = await getSupabase()!
      .from("price_alerts")
      .select("id, code, direction, price, created_at, triggered_at, triggered_price")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setAlerts(data.map((a) => ({ ...a, price: Number(a.price) })) as Alert[]);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  // Hisse sayfasındaki "Fiyat alarmı kur" bağlantısı: /portfoy?alarm=THYAO
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("alarm")?.toUpperCase();
    if (code && byCode.has(code)) {
      setForm((f) => ({ ...f, code }));
      document.getElementById("fiyat-alarmlari")?.scrollIntoView();
    }
  }, [byCode]);

  if (!user) return null;
  const open = alerts.filter((a) => !a.triggered_at);
  const current = (code: string) => live[code]?.p ?? byCode.get(code)?.price ?? null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const price = parse(form.price);
    if (!byCode.has(code)) return setError(`${code || "Hisse"} bulunamadı. Listeden bir hisse kodu seç.`);
    if (!price || price <= 0) return setError("Alarm fiyatını gir.");
    if (open.length >= MAX_OPEN) return setError(`En fazla ${MAX_OPEN} açık alarm kurabilirsin.`);
    setError(null);
    const { error } = await getSupabase()!.from("price_alerts").insert({ user_id: user.id, code, direction: form.direction, price });
    if (error) return setError("Alarm kurulamadı. Tekrar dene.");
    setForm({ code: "", direction: "above", price: "" });
    load();
  };

  const remove = async (id: number) => {
    await getSupabase()!.from("price_alerts").delete().eq("id", id);
    load();
  };

  const cur = form.code ? current(form.code.toUpperCase()) : null;

  return (
    <section id="fiyat-alarmlari" className="card scroll-mt-24">
      <div className="border-b border-border p-3">
        <h2 className="font-semibold">Fiyat Alarmlarım</h2>
        <p className="mt-0.5 text-sm text-muted">
          Hisse belirlediğin fiyatın üstüne çıkınca ya da altına inince telefonuna / bilgisayarına bildirim gelsin. Seans
          içinde 15 dakikada bir kontrol edilir.
        </p>
        <form onSubmit={save} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            list="portfoy-hisseler"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="Hisse kodu"
            aria-label="Alarm hisse kodu"
            className={`${field} uppercase`}
          />
          <select
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value as Alert["direction"] })}
            aria-label="Alarm yönü"
            className={field}
          >
            <option value="above">Fiyat üstüne çıkınca</option>
            <option value="below">Fiyat altına inince</option>
          </select>
          <input
            inputMode="decimal"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder={cur ? `Şu an ${num(cur)} ₺` : "Fiyat (₺)"}
            aria-label="Alarm fiyatı"
            className={field}
          />
          <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Alarm kur</button>
        </form>
        {error && <p className="mt-2 text-sm text-down">{error}</p>}
        {!pushSupported() && (
          <p className="mt-2 text-xs text-muted">Bu tarayıcı bildirim desteklemiyor; tetiklenen alarmları bu sayfada görürsün.</p>
        )}
        <p className="mt-2 text-xs text-muted">
          Bildirim almak için{" "}
          <Link href="/izleme-listesi" className="text-accent hover:underline">
            İzleme Listesi
          </Link>{" "}
          sayfasından bu cihazda bildirimleri aç.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {alerts.map((a) => {
          const p = current(a.code);
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm">
              <Link href={`/sirketler/${a.code}`} className="w-14 font-semibold text-accent">
                {a.code}
              </Link>
              <span className="tabular">
                {a.direction === "above" ? "≥" : "≤"} {num(a.price)} ₺
              </span>
              <span className="text-xs text-muted tabular">{p != null ? `şu an ${num(p)} ₺` : ""}</span>
              <span className="ml-auto text-xs">
                {a.triggered_at ? (
                  <span className="rounded-full bg-up-soft px-2 py-0.5 font-medium text-up">
                    Tetiklendi {when(a.triggered_at)}
                    {a.triggered_price ? ` · ${num(a.triggered_price)} ₺` : ""}
                  </span>
                ) : (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">Bekliyor</span>
                )}
              </span>
              <button onClick={() => remove(a.id)} aria-label={`${a.code} alarmını sil`} className="rounded px-1.5 text-muted hover:text-down">
                ×
              </button>
            </li>
          );
        })}
        {alerts.length === 0 && <li className="p-6 text-center text-sm text-muted">Henüz alarm kurmadın.</li>}
      </ul>
    </section>
  );
}
