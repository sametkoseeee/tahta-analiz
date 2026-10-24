const nf = (digits: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const n0 = nf(0);
const n1 = nf(1);
const n2 = nf(2);

export function num(v: number | null | undefined, digits = 2): string {
  if (v == null || !isFinite(v)) return "–";
  return (digits === 0 ? n0 : digits === 1 ? n1 : n2).format(v);
}

export function pct(v: number | null | undefined, digits = 1): string {
  if (v == null || !isFinite(v)) return "–";
  return `%${(digits === 0 ? n0 : digits === 1 ? n1 : n2).format(v * 100)}`;
}

export function signedPct(v: number | null | undefined, digits = 2): string {
  if (v == null || !isFinite(v)) return "–";
  const s = pct(Math.abs(v), digits);
  return v > 0 ? `+${s}` : v < 0 ? `-${s}` : s;
}

/** 75.265.405.622 → "75,3 Mr" */
export function compact(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return "–";
  const a = Math.abs(v);
  if (a >= 1e12) return `${n2.format(v / 1e12)} Tr`;
  if (a >= 1e9) return `${n1.format(v / 1e9)} Mr`;
  if (a >= 1e6) return `${n1.format(v / 1e6)} Mn`;
  if (a >= 1e3) return `${n1.format(v / 1e3)} B`;
  return n0.format(v);
}

/** Mali tablolar için: milyon cinsinden, ondalıksız */
export function millions(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return "–";
  return n0.format(v / 1e6);
}

/** "2026-06" → "2026/6" */
export function periodLabel(p: string, annual = false): string {
  const [y, m] = p.split("-");
  return annual ? y : `${y}/${Number(m)}`;
}

export function changeClass(v: number | null | undefined): string {
  if (v == null || v === 0) return "text-muted";
  return v > 0 ? "text-up" : "text-down";
}
