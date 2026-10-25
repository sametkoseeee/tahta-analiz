"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/auth";
import { fetchNews } from "@/lib/news";
import { markRead, notificationsEnabled, notificationsSupported, setNotificationsEnabled } from "@/lib/notify";
import { currentSubscription, disablePush, enablePush, pushActive, pushSupported } from "@/lib/push";
import type { CompanySummary } from "@/lib/types";
import { useWatchlist } from "@/lib/watchlist";
import CompaniesTable from "./CompaniesTable";
import NewsList from "./NewsList";

function Switch({ on, busy, onClick }: { on: boolean; busy?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? "bg-accent" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

/** Giriş yapılmışsa: Web Push (site kapalıyken de) */
function PushToggle() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    currentSubscription().then((s) => setOn(Boolean(s) && pushActive()));
  }, []);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    if (on) {
      await disablePush();
      setOn(false);
    } else {
      const err = await enablePush();
      setError(err);
      setOn(!err);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Switch on={on} busy={busy} onClick={toggle} />
      <div className="text-sm">
        <div className="font-medium">Anlık bildirimler {on ? "açık" : "kapalı"}</div>
        <div className={`text-xs ${error ? "text-down" : "text-muted"}`}>
          {error ?? "İzlediğin şirketler KAP'ta bildirim yayınlayınca site kapalıyken de bu cihaza bildirim gelir."}
        </div>
      </div>
    </div>
  );
}

/** Tarayıcı Web Push desteklemiyorsa: yalnızca site açıkken çalışan sekme içi bildirimler */
function TabNotificationToggle() {
  const [on, setOn] = useState(false);
  const [supported, setSupported] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    setSupported(notificationsSupported());
    setOn(notificationsEnabled());
    setDenied(notificationsSupported() && Notification.permission === "denied");
  }, []);

  if (!supported) return <p className="text-xs text-muted">Bu tarayıcı bildirimleri desteklemiyor.</p>;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Switch
        on={on}
        onClick={async () => {
          const result = await setNotificationsEnabled(!on);
          setOn(result);
          setDenied(Notification.permission === "denied");
        }}
      />
      <div className="text-sm">
        <div className="font-medium">Tarayıcı bildirimleri {on ? "açık" : "kapalı"}</div>
        <div className="text-xs text-muted">
          {denied
            ? "Bildirim izni tarayıcıda engellenmiş; adres çubuğundaki site ayarlarından izin verebilirsin."
            : "İzlediğin şirketler KAP'ta bildirim yayınladığında uyarı alırsın. Site bir sekmede açık olmalı."}
        </div>
      </div>
    </div>
  );
}

/** Üye olmayanlara: izleme listesi yalnızca üyelere açık */
function SignInPrompt() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">İzleme Listesi</h1>
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="text-3xl text-amber-500">☆</div>
        <h2 className="mt-2 text-lg font-semibold">İzleme listesi üyelere özel</h2>
        <p className="mt-2 text-sm text-muted">
          Ücretsiz üye ol; takip ettiğin şirketleri tek yerde gör, KAP&apos;ta bildirim yayınladıklarında site kapalıyken
          de haberin olsun. Listen tüm cihazlarında aynı kalır.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/giris?kayit=1&next=/izleme-listesi" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Üye ol
          </Link>
          <Link href="/giris?next=/izleme-listesi" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">
            Giriş yap
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotificationToggle() {
  const user = useUser();
  const [push, setPush] = useState(false);
  useEffect(() => setPush(pushSupported()), []);
  if (user === undefined) return null;
  return user && push ? <PushToggle /> : <TabNotificationToggle />;
}

export default function Watchlist({ companies }: { companies: CompanySummary[] }) {
  const { list, remove, signedIn } = useWatchlist();
  const watched = useMemo(() => companies.filter((c) => list.includes(c.code)), [companies, list]);
  const [days, setDays] = useState(7);

  // Sayfa açılınca izlenen şirketlerin bildirimleri okundu sayılır (zildeki sayaç sıfırlanır)
  const key = list.join(",");
  useEffect(() => {
    if (!key) return;
    fetchNews(key.split(","), 2)
      .then((items) => markRead(items.map((d) => d.id)))
      .catch(() => {});
  }, [key]);

  if (signedIn === undefined) return null;
  if (!signedIn) return <SignInPrompt />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">İzleme Listesi</h1>
          <p className="mt-1 text-sm text-muted">
            {list.length > 0
              ? `${list.length} şirket izleniyor.`
              : "Henüz şirket eklemedin. Şirket sayfalarındaki ya da tablolardaki ☆ işaretiyle ekleyebilirsin."}
          </p>
        </div>
        <div className="card p-3">
          <NotificationToggle />
        </div>
      </div>

      {watched.length > 0 && (
        <>
          <section>
            <CompaniesTable
              companies={watched}
              columns={["price", "change", "change1y", "marketCap", "pe", "pb", "roe", "netMargin"]}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {watched.map((c) => (
                <button
                  key={c.code}
                  onClick={() => remove(c.code)}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted hover:border-down hover:text-down"
                >
                  {c.code} ✕
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between border-b border-border p-3">
              <h2 className="font-semibold">KAP Bildirimleri</h2>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs"
                aria-label="Dönem"
              >
                <option value={1}>Bugün</option>
                <option value={7}>Son 7 gün</option>
                <option value={30}>Son 30 gün</option>
              </select>
            </div>
            <NewsList codes={list} days={days} empty="Bu dönemde izlediğin şirketlerden bildirim yok." />
          </section>
        </>
      )}

      {list.length === 0 && (
        <div className="card p-8 text-center text-sm text-muted">
          <Link href="/" className="text-accent hover:underline">
            Hisselere göz at
          </Link>{" "}
          ve takip etmek istediklerini ☆ ile işaretle.
        </div>
      )}
    </div>
  );
}
