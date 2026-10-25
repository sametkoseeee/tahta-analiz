"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/auth";
import { mergeWithAccount } from "@/lib/watchlist";

/** Kullanıcı giriş yapınca izleme listesini hesapla birleştirir. Görünür bir şey çizmez. */
export default function WatchlistSync() {
  const user = useUser();
  const userId = user?.id;
  useEffect(() => {
    if (userId) void mergeWithAccount(userId);
  }, [userId]);
  return null;
}
