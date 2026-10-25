"use client";

import { useLive } from "@/lib/live";

const fmt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });

/** Altbilgideki son güncelleme zamanı: seans içi fiyat varsa onun saati */
export default function UpdatedAt({ dataUpdatedAt }: { dataUpdatedAt: string }) {
  const { updatedAt } = useLive();
  return <>Fiyatların son güncellenmesi: {fmt.format(new Date(updatedAt ?? dataUpdatedAt))}</>;
}
