"use client";

import Link from "next/link";
import { useUser } from "@/lib/auth";
import { supabaseEnabled } from "@/lib/supabase/config";

export default function AccountMenu() {
  const user = useUser();
  if (!supabaseEnabled || user === undefined) return null;

  if (!user) {
    return (
      <Link href="/giris" className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
        Giriş
      </Link>
    );
  }
  const initial = (user.email ?? "?")[0].toUpperCase();
  return (
    <Link
      href="/hesap"
      title={user.email ?? "Hesabım"}
      aria-label="Hesabım"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
    >
      {initial}
    </Link>
  );
}
