"use client";

import { useSyncExternalStore } from "react";
import { goToLogin, useUser } from "./auth";
import { getSupabase } from "./supabase/client";

/**
 * İzleme listesi yalnızca üyelere açık. Asıl kayıt Supabase'teki `watchlist` tablosu;
 * tarayıcıdaki (localStorage) kopya sayfalar arası hızlı gösterim içindir ve çıkışta silinir.
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

/**
 * Değişikliği veritabanına yazar; başarılıysa true. Uzun süre açık kalan sekmede (telefonda sık olur) oturum
 * anahtarının süresi dolmuş olabilir: ilk deneme başarısızsa oturum yenilenip bir kez daha denenir.
 */
async function syncRemote(code: string, add: boolean): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return false;
  const run = () =>
    add
      ? supabase.from("watchlist").upsert({ user_id: userId, code }, { onConflict: "user_id,code", ignoreDuplicates: true })
      : supabase.from("watchlist").delete().eq("user_id", userId).eq("code", code);
  let { error } = await run();
  if (error) {
    await supabase.auth.refreshSession();
    ({ error } = await run());
  }
  return !error;
}

/** Kaydedilemezse ekranda kalan değişiklik geri alınır ve kullanıcıya söylenir (sessizce kaybolmasın) */
async function save(code: string, add: boolean, previous: string[]) {
  if (await syncRemote(code, add)) return;
  write(previous);
  alert("İzleme listesi kaydedilemedi. Sayfayı yenileyip tekrar dene; sorun sürerse çıkış yapıp yeniden giriş yap.");
}

/** Girişte ve sekmeye geri dönüldüğünde: hesaptaki listeyi tarayıcıya al (başka cihazda yapılan değişiklikler de gelir) */
export async function loadFromAccount() {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase.from("watchlist").select("code").order("created_at");
  if (error) return;
  write(data.map((r) => r.code as string));
}

/** Çıkışta ya da oturum yokken: tarayıcıdaki kopyayı sil (ortak bilgisayarda başkası görmesin) */
export function clearLocal() {
  if (read().length) write([]);
}

export function useWatchlist() {
  const user = useUser();
  const stored = useSyncExternalStore(subscribe, read, () => EMPTY);
  const list = user ? stored : EMPTY;
  return {
    list,
    /** undefined = oturum henüz bilinmiyor */
    signedIn: user === undefined ? undefined : Boolean(user),
    has: (code: string) => list.includes(code),
    toggle: (code: string) => {
      if (user === undefined) return;
      if (!user) return goToLogin();
      const add = !list.includes(code);
      write(add ? [...list, code] : list.filter((c) => c !== code));
      void save(code, add, list);
    },
    remove: (code: string) => {
      if (!user) return;
      write(list.filter((c) => c !== code));
      void save(code, false, list);
    },
  };
}
