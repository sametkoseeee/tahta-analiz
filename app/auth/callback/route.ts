import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/redirect";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * E-posta doğrulama ve şifre sıfırlama bağlantılarının döndüğü adres.
 * - token_hash: e-posta şablonundaki bağlantı; hangi tarayıcıda/cihazda açılırsa açılsın çalışır
 *   (Outlook/Gmail uygulamasının kendi tarayıcısı dahil)
 * - code: PKCE akışı; yalnızca üye olunan tarayıcıda açılırsa çalışır (eski bağlantılar için)
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), type === "recovery" ? "/hesap" : "/izleme-listesi");

  const supabase = await getServerSupabase();
  if (supabase && tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/giris?hata=baglanti`);
}
