"use client";

import { getSupabase } from "./supabase/client";

/** Web Push: site kapalıyken bile bildirim için tarayıcı aboneliği (giriş yapmış kullanıcılar) */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const ACTIVE_KEY = "push-aktif";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(VAPID_PUBLIC_KEY) &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Push açıkken sekme içi bildirimler kapatılır ki aynı bildirim iki kez gelmesin */
export function pushActive(): boolean {
  try {
    return localStorage.getItem(ACTIVE_KEY) === "1";
  } catch {
    return false;
  }
}

function setActive(on: boolean) {
  try {
    if (on) localStorage.setItem(ACTIVE_KEY, "1");
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* yok say */
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js");
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** İzin ister, aboneliği oluşturur ve sunucuya kaydeder. Hata mesajı ya da null döner. */
export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return "Bu tarayıcı Web Push desteklemiyor.";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "Bildirim izni verilmedi. Adres çubuğundaki site ayarlarından izin verebilirsin.";

  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }));

  // Site statik: abonelik doğrudan Supabase'e yazılır; RLS yalnızca kullanıcının kendi satırına izin verir
  const supabase = getSupabase();
  if (!supabase) return "Üyelik ayarlanmamış.";
  const { data } = await supabase.auth.getUser();
  if (!data.user) return "Önce giriş yapmalısın.";
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "Geçersiz abonelik.";
  const { error } = await supabase.from("push_subscriptions").upsert({
    endpoint: json.endpoint,
    user_id: data.user.id,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent.slice(0, 300),
  });
  if (error) return "Abonelik kaydedilemedi.";
  setActive(true);
  return null;
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (sub) {
    await getSupabase()?.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
  setActive(false);
}
