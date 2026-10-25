"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { stockCodes } from "@/lib/codes";
import { fetchNews, type Disclosure } from "@/lib/news";
import { getNotified, getRead, markNotified, notificationsEnabled, READ_EVENT } from "@/lib/notify";
import { pushActive } from "@/lib/push";
import { useWatchlist } from "@/lib/watchlist";

const POLL_MS = 2 * 60_000;

/**
 * İzleme listesindeki şirketlerin KAP bildirimlerini 2 dakikada bir kontrol eder.
 * Yeni bildirim gelince tarayıcı bildirimi gösterir; zil simgesinde okunmamış sayısını gösterir.
 * Site bir sekmede açıkken çalışır.
 */
export default function NewsBell() {
  const { list } = useWatchlist();
  const [items, setItems] = useState<Disclosure[]>([]);
  const [read, setRead] = useState<Set<number>>(() => new Set());
  const key = stockCodes(list).join(","); // fonlar KAP'ta bildirim yayınlamaz

  useEffect(() => {
    if (!key) return;
    const codes = key.split(",");
    let stopped = false;

    const check = async () => {
      let fresh: Disclosure[];
      try {
        fresh = await fetchNews(codes, 2);
      } catch {
        return; // KAP'a ulaşılamadı; sonraki turda tekrar denenir
      }
      if (stopped) return;
      setItems(fresh);

      const notified = getNotified();
      if (notified === null) {
        // İlk çalıştırma: mevcut bildirimler için uyarı gösterme
        markNotified(fresh.map((d) => d.id));
        return;
      }
      const incoming = fresh.filter((d) => !notified.has(d.id));
      if (incoming.length === 0) return;
      markNotified(incoming.map((d) => d.id));
      // Web Push açıksa bildirimi sunucu gönderir; burada tekrar gösterme
      if (!notificationsEnabled() || pushActive()) return;
      for (const d of incoming.slice(0, 5).reverse()) {
        const n = new Notification(`${d.codes.join(", ")} · KAP bildirimi`, {
          body: d.summary ? `${d.subject}\n${d.summary}` : d.subject,
          tag: String(d.id),
        });
        n.onclick = () => {
          window.focus();
          window.open(d.url, "_blank", "noopener");
        };
      }
      if (incoming.length > 5) {
        new Notification("KAP bildirimleri", { body: `İzleme listenizde ${incoming.length} yeni bildirim var.` });
      }
    };

    check();
    const timer = setInterval(check, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [key]);

  useEffect(() => {
    const sync = () => setRead(getRead());
    sync();
    window.addEventListener(READ_EVENT, sync);
    return () => window.removeEventListener(READ_EVENT, sync);
  }, []);

  const unread = key ? items.filter((d) => !read.has(d.id)).length : 0;

  return (
    <Link
      href="/izleme-listesi"
      className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text"
      aria-label={unread ? `İzleme listesi, ${unread} okunmamış bildirim` : "İzleme listesi"}
      title="İzleme listesi ve bildirimler"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-down px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
