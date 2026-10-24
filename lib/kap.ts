import "server-only";
import type { Disclosure } from "./news";

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
const TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: Disclosure[] }>();

/** "24.10.2026 17:08:16" (Türkiye saati) → ISO */
function parseKapDate(s: string): string {
  const [d, t] = s.split(" ");
  const [day, month, year] = d.split(".");
  return `${year}-${month}-${day}T${t ?? "00:00:00"}+03:00`;
}

const ymd = (d: Date) => new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 10);

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

/** Son `days` gündeki tüm şirket bildirimleri (yeniden eskiye), 1 dakika önbellekli */
export async function getDisclosures(days: number): Promise<Disclosure[]> {
  const now = new Date();
  const from = ymd(new Date(now.getTime() - (days - 1) * 86_400_000));
  const to = ymd(now);
  const key = `${from}_${to}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept-Language": "tr" },
    body: JSON.stringify({
      fromDate: from,
      toDate: to,
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
  const data = raw.map(toDisclosure).sort((a, b) => b.id - a.id);
  cache.set(key, { at: Date.now(), data });
  return data;
}
