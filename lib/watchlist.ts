"use client";

import { useSyncExternalStore } from "react";

/** İzleme listesi tarayıcıda (localStorage) tutulur; üyelik sistemi olmadığı için cihaza özeldir. */
const KEY = "izleme-listesi";
const EVENT = "izleme-listesi-degisti";
const EMPTY: string[] = [];

let cached: { raw: string | null; list: string[] } = { raw: null, list: EMPTY };

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cached.raw) return cached.list;
  let list = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) list = parsed.filter((x) => typeof x === "string");
  } catch {
    /* bozuk veri: boş liste */
  }
  cached = { raw, list };
  return list;
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* gizli pencere vb. */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb); // diğer sekmeler
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useWatchlist() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    list,
    has: (code: string) => list.includes(code),
    toggle: (code: string) => write(list.includes(code) ? list.filter((c) => c !== code) : [...list, code]),
    remove: (code: string) => write(list.filter((c) => c !== code)),
  };
}
