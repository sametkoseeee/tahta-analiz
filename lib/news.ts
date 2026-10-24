export type Disclosure = {
  id: number;
  /** ISO tarih */
  date: string;
  codes: string[];
  company: string;
  subject: string;
  summary: string | null;
  kind: string;
  url: string;
};

/** KAP bildirim sınıfları */
export const KIND_LABELS: Record<string, string> = {
  ODA: "Özel Durum",
  FR: "Finansal Rapor",
  DG: "Diğer",
  DKB: "Düzenleyici Kurum",
};

export async function fetchNews(codes: string[], days: number, signal?: AbortSignal): Promise<Disclosure[]> {
  if (codes.length === 0) return [];
  const res = await fetch(`/api/haberler?codes=${encodeURIComponent(codes.join(","))}&days=${days}`, { signal });
  const json = (await res.json()) as { items: Disclosure[]; error?: string };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.items;
}
