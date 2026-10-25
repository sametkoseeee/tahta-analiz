/**
 * KAP bildirim sorgusu. Hem Next.js sunucusu (lib/kap.ts) hem de zamanlanmış
 * gönderici (scripts/kap_push.mjs, Node ile doğrudan çalışır) kullanır;
 * bu yüzden yalnızca silinebilir TypeScript sözdizimi ve göreli importlar içerir.
 */
import type { Disclosure } from "./news.ts";

type RawDisclosure = {
  publishDate: string;
  kapTitle: string;
  disclosureClass: string;
  summary: string | null;
  subject: string | null;
  disclosureIndex: number;
  stockCodes: string | null;
  /** MKK/Borsa İstanbul duyurularında ilgili hisseler bu alanda gelir */
  relatedStocks: string | null;
};

const ENDPOINT = "https://kap.org.tr/tr/api/disclosure/members/byCriteria";

/** "24.10.2026 17:08:16" (Türkiye saati) → ISO */
function parseKapDate(s: string): string {
  const [d, t] = s.split(" ");
  const [day, month, year] = d.split(".");
  return `${year}-${month}-${day}T${t ?? "00:00:00"}+03:00`;
}

/** Türkiye saatine göre YYYY-MM-DD */
export const kapDay = (d: Date) => new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 10);

function toDisclosure(r: RawDisclosure): Disclosure {
  return {
    id: r.disclosureIndex,
    date: parseKapDate(r.publishDate),
    codes: (r.stockCodes || r.relatedStocks || "").split(",").map((s) => s.trim()).filter(Boolean),
    company: r.kapTitle,
    subject: r.subject ?? r.summary ?? "Bildirim",
    summary: r.summary && r.summary !== r.subject ? r.summary : null,
    kind: r.disclosureClass,
    url: `https://www.kap.org.tr/tr/Bildirim/${r.disclosureIndex}`,
  };
}

/**
 * Son `days` gündeki işlem gören şirket bildirimleri, yeniden eskiye.
 * KAP tek sorguda en fazla 2000 bildirim döndürür; uzun dönemler için `oids` (KAP şirket
 * kimlikleri, data/kap_oids.json) ile şirkete göre filtrelemek gerekir.
 */
export async function fetchKapDisclosures(days: number, oids: string[] = []): Promise<Disclosure[]> {
  if (oids.length <= OIDS_PER_REQUEST) return fetchOnce(days, oids);
  const parts: Disclosure[][] = [];
  for (let i = 0; i < oids.length; i += OIDS_PER_REQUEST) {
    parts.push(await fetchOnce(days, oids.slice(i, i + OIDS_PER_REQUEST)));
  }
  const seen = new Set<number>();
  return parts
    .flat()
    .filter((d) => !seen.has(d.id) && seen.add(d.id))
    .sort((a, b) => b.id - a.id);
}

// KAP'ın yanıt süresi şirket sayısıyla hızla artıyor (20 şirket ~3 sn, 30 şirket ~25 sn)
const OIDS_PER_REQUEST = 15;

async function fetchOnce(days: number, oids: string[]): Promise<Disclosure[]> {
  const now = new Date();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept-Language": "tr" },
    body: JSON.stringify({
      fromDate: kapDay(new Date(now.getTime() - (days - 1) * 86_400_000)),
      toDate: kapDay(now),
      memberType: "IGS", // işlem gören şirketler
      mkkMemberOidList: oids,
      inactiveMkkMemberOidList: [],
      disclosureClass: "",
      subjectList: [],
      isLate: "",
      mainSector: "",
      sector: "",
      subSector: "",
      marketOid: "",
      index: "",
      bdkReview: "",
      bdkMemberOidList: [],
      year: "",
      term: "",
      ruleType: "",
      period: "",
      fromSrc: false,
      srcCategory: "",
      disclosureIndexList: [],
    }),
    signal: AbortSignal.timeout(40_000),
    cache: "no-store",
  });
  if (res.status === 429) throw new Error("KAP çok sık istek nedeniyle geçici olarak yanıt vermiyor");
  if (!res.ok) throw new Error(`KAP ${res.status}`);
  const raw = (await res.json()) as RawDisclosure[];
  return raw.map(toDisclosure).sort((a, b) => b.id - a.id);
}
