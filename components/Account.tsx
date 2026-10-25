"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authErrorMessage, useUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";

export default function Account() {
  const user = useUser();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (user === undefined) return <p className="text-sm text-muted">Yükleniyor…</p>;
  if (user === null) {
    return (
      <div className="card mx-auto max-w-md p-6 text-sm">
        Hesap bilgilerini görmek için{" "}
        <Link href="/giris" className="text-accent hover:underline">
          giriş yap
        </Link>
        .
      </div>
    );
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await getSupabase()!.auth.updateUser({ password });
    setMsg(error ? { ok: false, text: authErrorMessage(error.message) } : { ok: true, text: "Şifren güncellendi." });
    if (!error) setPassword("");
  };

  const signOut = async () => {
    await getSupabase()!.auth.signOut();
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Hesabım</h1>
      <div className="card p-4 text-sm">
        <div className="text-muted">E-posta</div>
        <div className="font-medium">{user.email}</div>
      </div>
      <form onSubmit={changePassword} className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold">Şifre değiştir</h2>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Yeni şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {msg && <p className={`text-sm ${msg.ok ? "text-up" : "text-down"}`}>{msg.text}</p>}
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Kaydet
        </button>
      </form>
      <button onClick={signOut} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-2">
        Çıkış yap
      </button>
    </div>
  );
}
