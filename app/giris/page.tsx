import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { supabaseEnabled } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Giriş | Borsa Analiz" };

export default function LoginPage() {
  if (!supabaseEnabled) {
    return (
      <div className="card mx-auto max-w-md p-6 text-sm text-muted">
        Üyelik henüz ayarlanmadı. Supabase anahtarları eklenince giriş ve kayıt burada açılır (bkz. KURULUM.md). Bu
        arada izleme listen bu tarayıcıda saklanıyor.
      </div>
    );
  }
  return <AuthForm />;
}
