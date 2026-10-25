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
    codes: (r.stockCodes ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    company: r.kapTitle,
    subject: r.subject ?? r.summary ?? "Bildirim",
    summary: r.summary && r.summary !== r.subject ? r.summary : null,
    kind: r.disclosureClass,
    url: `https://www.kap.org.tr/tr/Bildirim/${r.disclosureIndex}`,
  };
}

/** Son `days` gündeki işlem gören şirket bildirimleri, yeniden eskiye */
export async function fetchKapDisclosures(days: number): Promise<Disclosure[]> {
  const now = new Date();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept-Language": "tr" },
    body: JSON.stringify({
      fromDate: kapDay(new Date(now.getTime() - (days - 1) * 86_400_000)),
      toDate: kapDay(now),
      memberType: "IGS", // işlem gören şirketler
      mkkMemberOidList: [],
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
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KAP ${res.status}`);
  const raw = (await res.json()) as RawDisclosure[];
  return raw.map(toDisclosure).sort((a, b) => b.id - a.id);
}
