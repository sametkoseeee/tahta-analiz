/** TEFAS "Portföy Dağılımı" alan kodları → ad ve grafik grubu */
type Group = "Hisse" | "Yabancı hisse" | "Devlet borçlanma" | "Dış borçlanma (Eurobond)" | "Özel sektör borçlanma" | "Kira sertifikası" | "Mevduat / katılım" | "Repo / para piyasası" | "Kıymetli maden" | "Fon payları" | "Diğer";

export const ALLOCATION: Record<string, [label: string, group: Group]> = {
  hs: ["Hisse Senedi", "Hisse"],
  yhs: ["Yabancı Hisse Senedi", "Yabancı hisse"],
  dt: ["Devlet Tahvili", "Devlet borçlanma"],
  hb: ["Hazine Bonosu", "Devlet borçlanma"],
  dot: ["Döviz Ödemeli Tahvil", "Devlet borçlanma"],
  db: ["Döviz Ödemeli Bono", "Devlet borçlanma"],
  kibd: ["Döviz Cinsi Kamu İç Borçlanma Araçları", "Devlet borçlanma"],
  kba: ["Kamu Dış Borçlanma Araçları", "Dış borçlanma (Eurobond)"],
  eut: ["Eurobond", "Dış borçlanma (Eurobond)"],
  osdb: ["Özel Sektör Dış Borçlanma Araçları", "Dış borçlanma (Eurobond)"],
  ybosb: ["Yabancı Özel Sektör Borçlanma Araçları", "Dış borçlanma (Eurobond)"],
  yba: ["Yabancı Borçlanma Araçları", "Dış borçlanma (Eurobond)"],
  ost: ["Özel Sektör Tahvili", "Özel sektör borçlanma"],
  fb: ["Finansman Bonosu", "Özel sektör borçlanma"],
  bb: ["Banka Bonosu", "Özel sektör borçlanma"],
  vdm: ["Varlığa Dayalı Menkul Kıymetler", "Özel sektör borçlanma"],
  kks: ["Kamu Kira Sertifikaları", "Kira sertifikası"],
  kkstl: ["Kamu Kira Sertifikaları (TL)", "Kira sertifikası"],
  kksd: ["Kamu Kira Sertifikaları (Döviz)", "Kira sertifikası"],
  kksyd: ["Kamu Yurt Dışı Kira Sertifikaları", "Kira sertifikası"],
  osks: ["Özel Sektör Kira Sertifikaları", "Kira sertifikası"],
  oksyd: ["Özel Sektör Yurt Dışı Kira Sertifikaları", "Kira sertifikası"],
  kmkks: ["Kıymetli Maden Cinsinden Kamu Kira Sertifikaları", "Kira sertifikası"],
  vm: ["Mevduat", "Mevduat / katılım"],
  vmtl: ["Mevduat (TL)", "Mevduat / katılım"],
  vmd: ["Mevduat (Döviz)", "Mevduat / katılım"],
  vmau: ["Mevduat (Altın)", "Mevduat / katılım"],
  kh: ["Katılım Hesabı", "Mevduat / katılım"],
  khtl: ["Katılım Hesabı (TL)", "Mevduat / katılım"],
  khd: ["Katılım Hesabı (Döviz)", "Mevduat / katılım"],
  khau: ["Katılım Hesabı (Altın)", "Mevduat / katılım"],
  tr: ["Ters-Repo", "Repo / para piyasası"],
  r: ["Repo", "Repo / para piyasası"],
  tpp: ["Takasbank Para Piyasası", "Repo / para piyasası"],
  bpp: ["Borsa Para Piyasası", "Repo / para piyasası"],
  btaa: ["BİST Taahhütlü İşlem Pazarı Alım", "Repo / para piyasası"],
  btas: ["BİST Taahhütlü İşlem Pazarı Satım", "Repo / para piyasası"],
  km: ["Kıymetli Madenler", "Kıymetli maden"],
  kmbyf: ["Kıymetli Madenler Borsa Yatırım Fonu", "Kıymetli maden"],
  kmkba: ["Kıymetli Maden Cinsinden Kamu Borçlanma Araçları", "Kıymetli maden"],
  byf: ["Borsa Yatırım Fonları Katılma Payları", "Fon payları"],
  ybyf: ["Yabancı Borsa Yatırım Fonları", "Fon payları"],
  fkb: ["Yatırım Fonları Katılma Payları", "Fon payları"],
  yyf: ["Yabancı Yatırım Fonları", "Fon payları"],
  ybkb: ["Yabancı Fon Katılma Belgeleri", "Fon payları"],
  gykb: ["Gayrimenkul Yatırım Fonları Katılma Payları", "Fon payları"],
  gsykb: ["Girişim Sermayesi Yatırım Fonları Katılma Payları", "Fon payları"],
  ymk: ["Yabancı Menkul Kıymetler", "Diğer"],
  gas: ["Gayrimenkul Sertifikaları", "Diğer"],
  gyy: ["Gayrimenkul Yatırımları", "Diğer"],
  gsyy: ["Girişim Sermayesi Yatırımları", "Diğer"],
  vint: ["Vadeli İşlemler Nakit Teminatları", "Diğer"],
  t: ["Türev Araçlar", "Diğer"],
  d: ["Diğer", "Diğer"],
};

export type AllocationItem = { key: string; label: string; group: Group; pct: number };

/** Sıfır olmayan kalemler, büyükten küçüğe */
export function allocationItems(alloc: Record<string, number> | undefined): AllocationItem[] {
  if (!alloc) return [];
  return Object.entries(alloc)
    .filter(([, v]) => v > 0)
    .map(([key, pct]) => {
      const [label, group] = ALLOCATION[key] ?? [key.toUpperCase(), "Diğer" as Group];
      return { key, label, group, pct };
    })
    .sort((a, b) => b.pct - a.pct);
}

/** Grafikteki gruplar (aynı türden kalemler toplanır) */
export function allocationGroups(items: AllocationItem[]): { group: string; pct: number }[] {
  const m = new Map<string, number>();
  items.forEach((i) => m.set(i.group, (m.get(i.group) ?? 0) + i.pct));
  return [...m.entries()].map(([group, pct]) => ({ group, pct: Math.round(pct * 100) / 100 })).sort((a, b) => b.pct - a.pct);
}
