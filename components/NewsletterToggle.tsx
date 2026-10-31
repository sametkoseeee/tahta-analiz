"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";

/** Haftalık e-posta bülteni: yalnızca üyenin açıkça işaretlemesiyle (newsletter tablosu) */
export default function NewsletterToggle() {
  const user = useUser();
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    getSupabase()!
      .from("newsletter")
      .select("user_id")
      .maybeSingle()
      .then(({ data, error }) => setOn(error ? null : !!data));
  }, [user]);

  if (!user || on === null) return null;

  const toggle = async () => {
    const db = getSupabase()!;
    const next = !on;
    setOn(next);
    const { error } = next
      ? await db.from("newsletter").upsert({ user_id: user.id })
      : await db.from("newsletter").delete().eq("user_id", user.id);
    if (error) setOn(!next);
  };

  return (
    <section id="bulten" className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <h2 className="font-semibold">Haftalık e-posta bülteni</h2>
        <p className="mt-0.5 text-sm text-muted">
          Her cuma akşamı: haftaya açıklanacak bilançolar, yaklaşan temettü ödemeleri, halka arzlar ve tedbire girenler.
          {on ? ` ${user.email} adresine gönderilir.` : ""}
        </p>
      </div>
      <button
        onClick={toggle}
        role="switch"
        aria-checked={on}
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${
          on ? "border border-border hover:bg-surface-2" : "bg-accent text-white hover:opacity-90"
        }`}
      >
        {on ? "Abonelikten çık" : "Abone ol"}
      </button>
    </section>
  );
}
