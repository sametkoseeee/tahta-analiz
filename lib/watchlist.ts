"use client";

import { useSyncExternalStore } from "react";
import { getSupabase } from "./supabase/client";

/**
 * İzleme listesi her zaman tarayıcıda (localStorage) tutulur; giriş yapılmışsa Supabase'teki
 * `watchlist` tablosuyla eşitlenir, böylece tüm cihazlarda aynı olur.
 */
const KEY = "izleme-listesi";
const EVENT = "izleme-listesi-degisti";
const EMPTY: string[] = [];

let cached: { raw: string | null; list: string[] } = { raw: null, list: EMPTY };

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cached.raw) return cached.list;
  let list = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) list = parsed.filter((x) => typeof x === "string");
  } catch {
    /* bozuk veri: boş liste */
  }
  cached = { raw, list };
  return list;
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* gizli pencere vb. */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb); // diğer sekmeler
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Giriş yapılmışsa değişikliği veritabanına da yansıtır (arka planda; hata olursa bir sonraki girişte birleşir) */
async function syncRemote(code: string, add: boolean) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;
  if (add) await supabase.from("watchlist").upsert({ user_id: userId, code });
  else await supabase.from("watchlist").delete().eq("user_id", userId).eq("code", code);
}

/** Girişte: tarayıcıdaki liste ile hesaptakini birleştir, ikisini de güncelle */
export async function mergeWithAccount(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase.from("watchlist").select("code").order("created_at");
  if (error) return;
  const remote = data.map((r) => r.code as string);
  const local = read();
  const missingRemote = local.filter((c) => !remote.includes(c));
  if (missingRemote.length) {
    await supabase.from("watchlist").upsert(missingRemote.map((code) => ({ user_id: userId, code })));
  }
  write([...remote, ...missingRemote]);
}

export function useWatchlist() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    list,
    has: (code: string) => list.includes(code),
    toggle: (code: string) => {
      const add = !list.includes(code);
      write(add ? [...list, code] : list.filter((c) => c !== code));
      void syncRemote(code, add);
    },
    remove: (code: string) => {
      write(list.filter((c) => c !== code));
      void syncRemote(code, false);
    },
  };
}
