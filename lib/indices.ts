/** KAP'tan gelen resmi BIST endeksleri (scripts/fetch_data.py → MAIN_INDICES ile aynı) */
export const INDEX_NAMES: Record<string, string> = {
  XU030: "BIST 30",
  XU050: "BIST 50",
  XU100: "BIST 100",
  XUTUM: "BIST Tüm",
  XK030: "Katılım 30",
  XK100: "Katılım 100",
  XKTUM: "Katılım Tüm",
  XTM25: "Temettü 25",
  XYLDZ: "Yıldız Pazar",
  XHARZ: "Halka Arz",
  XUSRD: "Sürdürülebilirlik",
};

/** Hızlı seçimde gösterilenler; "all" = filtre yok */
export const QUICK_INDICES = ["XU030", "XU050", "XU100", "all"] as const;

export type IndexFilter = string; // endeks kodu veya "all"

export function indexLabel(code: IndexFilter): string {
  return code === "all" ? "Tümü" : (INDEX_NAMES[code] ?? code);
}

export function filterByIndex<T extends { indices?: string[] }>(list: T[], code: IndexFilter): T[] {
  if (code === "all") return list;
  return list.filter((c) => c.indices?.includes(code));
}
