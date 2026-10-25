import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SubscriptionJSON = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

async function currentUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return { supabase: null, userId: null };
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

const isPushEndpoint = (s: unknown): s is string => typeof s === "string" && s.startsWith("https://") && s.length < 1000;

/** Tarayıcının push aboneliğini oturum açmış kullanıcıya kaydeder */
export async function POST(req: NextRequest) {
  const { supabase, userId } = await currentUser();
  if (!supabase) return NextResponse.json({ error: "Üyelik ayarlanmamış." }, { status: 503 });
  if (!userId) return NextResponse.json({ error: "Önce giriş yapmalısın." }, { status: 401 });

  const sub = (await req.json().catch(() => null)) as SubscriptionJSON | null;
  if (!sub || !isPushEndpoint(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Geçersiz abonelik." }, { status: 400 });
  }
  const { error } = await supabase.from("push_subscriptions").upsert({
    endpoint: sub.endpoint,
    user_id: userId,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
  });
  if (error) return NextResponse.json({ error: "Abonelik kaydedilemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Aboneliği siler */
export async function DELETE(req: NextRequest) {
  const { supabase, userId } = await currentUser();
  if (!supabase || !userId) return NextResponse.json({ ok: true });
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!isPushEndpoint(body?.endpoint)) return NextResponse.json({ error: "Geçersiz abonelik." }, { status: 400 });
  await supabase.from("push_subscriptions").delete().eq("endpoint", body.endpoint).eq("user_id", userId);
  return NextResponse.json({ ok: true });
}
