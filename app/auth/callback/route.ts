import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** E-posta doğrulama ve şifre sıfırlama bağlantılarının döndüğü adres */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/izleme-listesi";
  // Yalnızca site içi yönlendirme (açık yönlendirme açığı olmasın)
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/izleme-listesi";

  const supabase = await getServerSupabase();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/giris?hata=baglanti`);
}
