"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/auth";
import { clearLocal, loadFromAccount } from "@/lib/watchlist";

/** Girişte izleme listesini hesaptan yükler, çıkışta tarayıcıdaki kopyayı siler. Görünür bir şey çizmez. */
export default function WatchlistSync() {
  const user = useUser();
  const userId = user?.id;
  useEffect(() => {
    if (userId) void loadFromAccount();
    else if (user === null) clearLocal();
  }, [userId, user]);
  return null;
}
