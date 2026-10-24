"use client";

/** Bildirim durumu da tarayıcıda tutulur: hangi KAP bildirimleri için uyarı gösterildi / okundu. */
const NOTIFIED = "bildirim-gonderilenler";
const READ = "okunan-bildirimler";
const ENABLED = "bildirimler-acik";
export const READ_EVENT = "bildirimler-okundu";
const MAX_IDS = 1000;

function getIds(key: string): Set<number> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as number[]) : null;
  } catch {
    return null;
  }
}

function addIds(key: string, ids: number[]) {
  const set = getIds(key) ?? new Set<number>();
  ids.forEach((id) => set.add(id));
  try {
    localStorage.setItem(key, JSON.stringify([...set].slice(-MAX_IDS)));
  } catch {
    /* yok say */
  }
}

export const getNotified = () => getIds(NOTIFIED);
export const markNotified = (ids: number[]) => addIds(NOTIFIED, ids);
export const getRead = () => getIds(READ) ?? new Set<number>();

export function markRead(ids: number[]) {
  addIds(READ, ids);
  window.dispatchEvent(new Event(READ_EVENT));
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationsEnabled() {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  try {
    return localStorage.getItem(ENABLED) !== "0";
  } catch {
    return true;
  }
}

/** Açarken tarayıcı izni ister; izin verilmezse false döner */
export async function setNotificationsEnabled(on: boolean): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (on && Notification.permission !== "granted") {
    const p = await Notification.requestPermission();
    if (p !== "granted") return false;
  }
  try {
    localStorage.setItem(ENABLED, on ? "1" : "0");
  } catch {
    /* yok say */
  }
  return on;
}
