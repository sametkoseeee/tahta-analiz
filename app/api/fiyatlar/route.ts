import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseEnabled } from "@/lib/supabase/config";
import type { LiveQuote } from "@/lib/live";

// Sonuç 5 dakika önbellekte tutulur; fiyatlar seans içinde ~40 dakikada bir güncelleniyor
export const revalidate = 300;

/** GET /api/fiyatlar → { quotes: { THYAO: { p, c, t } } } */
export async function GET() {
  if (!supabaseEnabled) return NextResponse.json({ quotes: {} });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("prices").select("code, price, change, updated_at").limit(2000);
  if (error) return NextResponse.json({ quotes: {}, error: error.message }, { status: 502 });

  const quotes: Record<string, LiveQuote> = {};
  for (const r of data) quotes[r.code] = { p: Number(r.price), c: r.change == null ? null : Number(r.change), t: r.updated_at };
  return NextResponse.json({ quotes });
}
