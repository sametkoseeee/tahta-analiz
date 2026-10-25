import { NextResponse } from "next/server";
import { getCompany, getIndex } from "@/lib/data";

/** Hisse kapanış serisi (karşılaştırma grafiği için); yayında statik JSON olarak üretilir */
export const dynamic = "force-static";

export function generateStaticParams() {
  return getIndex().companies.map((c) => ({ kod: c.code }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const c = getCompany(kod);
  if (!c) return NextResponse.json({ error: "Hisse bulunamadı" }, { status: 404 });
  return NextResponse.json({ code: c.code, name: c.name, prices: c.prices.map((p) => ({ d: p.d, c: p.c })) });
}
