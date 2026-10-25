"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabase } from "./supabase/client";

/** Oturum açmış kullanıcı; undefined = henüz bilinmiyor, null = giriş yapılmamış */
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setUser(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  return user;
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
