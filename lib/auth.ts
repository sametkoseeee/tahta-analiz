"use client";

import type { User } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { getSupabase } from "./supabase/client";

/**
 * Oturum tüm sayfa için tek yerden izlenir (tablodaki her ☆ düğmesi ayrı istek atmasın).
 * undefined = henüz bilinmiyor, null = giriş yapılmamış.
 */
let current: User | null | undefined = undefined;
let started = false;
const listeners = new Set<() => void>();

function set(user: User | null) {
  if (user?.id === current?.id && current !== undefined) return;
  current = user;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  const supabase = getSupabase();
  if (!supabase) {
    set(null);
    return;
  }
  supabase.auth.getSession().then(({ data }) => set(data.session?.user ?? null));
  supabase.auth.onAuthStateChange((_event, session) => set(session?.user ?? null));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  start();
  return () => listeners.delete(cb);
}

export function useUser(): User | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => undefined,
  );
}

/** Giriş sayfasına, giriş sonrası bu sayfaya dönülecek şekilde yönlendirir */
export function goToLogin(signup = false) {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/giris?${signup ? "kayit=1&" : ""}next=${next}`;
}

/** Supabase hata mesajlarının Türkçesi */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-posta ya da şifre hatalı.";
  if (m.includes("email not confirmed")) return "E-posta adresin henüz doğrulanmadı. Gelen kutundaki bağlantıya tıkla.";
  if (m.includes("already registered")) return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.";
  if (m.includes("password should be at least")) return "Şifre en az 6 karakter olmalı.";
  if (m.includes("rate limit")) return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "Geçerli bir e-posta adresi gir.";
  if (m.includes("fetch failed") || m.includes("failed to fetch") || m.includes("network"))
    return "Sunucuya bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.";
  return message;
}
