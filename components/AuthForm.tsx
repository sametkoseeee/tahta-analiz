"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authErrorMessage, safeNext } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/config";

type Mode = "login" | "signup" | "reset";

const TITLES: Record<Mode, string> = { login: "Giriş yap", signup: "Hesap oluştur", reset: "Şifremi unuttum" };

export default function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("kayit") ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("hata") ? "Bağlantının süresi dolmuş ya da geçersiz. Tekrar dene." : null,
  );
  const [info, setInfo] = useState<string | null>(null);
  // Girişten sonra gelinen sayfaya dön (ör. ☆'a basılan şirket sayfası)
  const next = safeNext(params.get("next"));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const redirect = `${window.location.origin}/auth/callback`;
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${redirect}?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        if (data.session) router.push(next);
        else setInfo("Doğrulama bağlantısı e-posta adresine gönderildi. Bağlantıya tıklayınca giriş yapmış olacaksın.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${redirect}?next=/hesap` });
        if (error) throw error;
        setInfo("Şifre sıfırlama bağlantısı e-posta adresine gönderildi.");
      }
    } catch (err) {
      setError(authErrorMessage((err as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="card mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold">{TITLES[mode]}</h1>
      <p className="mt-1 text-sm text-muted">
        {mode === "reset"
          ? "E-posta adresini yaz, sana şifre sıfırlama bağlantısı gönderelim."
          : "Hesabınla izleme listen tüm cihazlarında aynı olur ve bildirimler site kapalıyken de gelir."}
      </p>
      {!supabaseEnabled && (
        <p className="mt-4 rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">
          Üyelik sistemi henüz bağlanmadı. Supabase kurulumu yapılınca (KURULUM.md) kayıt ve giriş bu formdan çalışır.
        </p>
      )}
      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">E-posta</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        {mode !== "reset" && (
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Şifre</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
            />
          </label>
        )}
        {error && <p className="rounded-md bg-down-soft px-3 py-2 text-sm text-down">{error}</p>}
        {info && <p className="rounded-md bg-up-soft px-3 py-2 text-sm text-up">{info}</p>}
        <button
          type="submit"
          disabled={busy || !supabaseEnabled}
          className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Bekle…" : mode === "login" ? "Giriş yap" : mode === "signup" ? "Kayıt ol" : "Bağlantı gönder"}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        {mode === "login" ? (
          <>
            <button onClick={() => setMode("signup")} className="text-accent hover:underline">
              Hesap oluştur
            </button>
            <button onClick={() => setMode("reset")} className="text-muted hover:text-text">
              Şifremi unuttum
            </button>
          </>
        ) : (
          <button onClick={() => setMode("login")} className="text-accent hover:underline">
            Zaten hesabım var, giriş yap
          </button>
        )}
      </div>
    </div>
  );
}
