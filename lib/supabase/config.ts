export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Supabase ayarlanmamışsa site üyeliksiz çalışır (izleme listesi tarayıcıda kalır). */
export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
