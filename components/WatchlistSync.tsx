"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/auth";
import { clearLocal, loadFromAccount } from "@/lib/watchlist";

/**
 * Girişte izleme listesini hesaptan yükler, çıkışta tarayıcıdaki kopyayı siler. Telefonda sekmeler günlerce açık
 * kalır: sekmeye dönülünce liste yeniden yüklenir ki başka cihazda eklenenler de görünsün. Görünür bir şey çizmez.
 */
export default function WatchlistSync() {
  const user = useUser();
  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      if (user === null) clearLocal();
      return;
    }
    void loadFromAccount();
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadFromAccount();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [userId, user]);
  return null;
}
