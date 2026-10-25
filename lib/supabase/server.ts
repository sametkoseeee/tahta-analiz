import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseEnabled } from "./config";

/** İstekteki oturum çerezleriyle çalışan istemci (RLS kullanıcı adına uygulanır) */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseEnabled) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* Server Component içinden çağrıldıysa çerez yazılamaz; middleware yeniler */
        }
      },
    },
  });
}

/** RLS'i aşan yönetici istemcisi — yalnızca sunucuda, güvenilir işler için */
export function getAdminSupabase(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseEnabled || !key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}
