"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { safeNext } from "@/lib/redirect";
import { getSupabase } from "@/lib/supabase/client";

/**
 * E-posta doğrulama ve şifre sıfırlama bağlantılarının döndüğü adres. Site statik olduğu için doğrulama
 * tarayıcıda yapılır.
 * - token_hash: e-posta şablonundaki bağlantı; hangi tarayıcıda/cihazda açılırsa açılsın çalışır
 *   (Outlook/Gmail uygulamasının kendi tarayıcısı dahil)
 * - code: PKCE akışı; yalnızca üye olunan tarayıcıda açılırsa çalışır (eski bağlantılar için)
 */
function Callback() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    const code = params.get("code");
    const next = safeNext(params.get("next"), type === "recovery" ? "/hesap" : "/izleme-listesi");
    const supabase = getSupabase();
    (async () => {
      let ok = false;
      if (supabase && tokenHash && type) {
        ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
      } else if (supabase && code) {
        ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
      }
      router.replace(ok ? next : "/giris?hata=baglanti");
    })();
  }, [params, router]);

  return <p className="py-16 text-center text-sm text-muted">Bağlantı doğrulanıyor…</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <Callback />
    </Suspense>
  );
}
