export type Metrics = {
  price: number | null;
  change: number | null;
  change1y: number | null;
  high52: number | null;
  low52: number | null;
  marketCap: number | null;
  ev: number | null;
  pe: number | null;
  pb: number | null;
  evEbitda: number | null;
  ps: number | null;
  roe: number | null;
  roa: number | null;
  grossMargin: number | null;
  ebitdaMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  currentRatio: number | null;
  debtToEquity: number | null;
  netDebtEbitda: number | null;
  revenueGrowth: number | null;
  netIncomeGrowth: number | null;
  dividendYield: number | null;
  fcfYield: number | null;
  netIncomeTtm: number | null;
  revenueTtm: number | null;
  ebitdaTtm: number | null;
  equity: number | null;
  netDebt: number | null;
};

export type MetricKey = keyof Metrics;

export type CompanySummary = {
  code: string;
  name: string;
  sector: string;
  industry: string | null;
  /** Üyesi olduğu resmi endeksler (KAP), ör. ["XU030", "XU100"] */
  indices?: string[];
  metrics: Metrics;
  spark: number[];
};

export type IndexFile = {
  updatedAt: string;
  companies: CompanySummary[];
};

export type Statement = {
  periods: string[];
  rows: { label: string; values: (number | null)[] }[];
};

export type StatementSet = {
  balance: Statement;
  income: Statement;
  cashflow: Statement;
};

export type PricePoint = { d: string; c: number; v: number };

export type CompanyDetail = {
  code: string;
  name: string;
  sector: string;
  industry: string | null;
  summary: string | null;
  /** "tr" = content/ozetler çevirisi, "en" = Yahoo'nun İngilizce metni */
  summaryLang?: "tr" | "en";
  website: string | null;
  employees: number | null;
  city: string | null;
  financialCurrency: string;
  indices?: string[];
  metrics: Metrics;
  prices: PricePoint[];
  statements: { quarterly: StatementSet; annual: StatementSet };
};

/** Mali tablo bileşenlerine giden kısım (fiyat geçmişi olmadan) */
export type Financials = Pick<CompanyDetail, "code" | "financialCurrency" | "statements">;
