import { NextResponse } from "next/server";
import { getFund, getFunds } from "@/lib/data";

/** Fon fiyat serisi (karşılaştırma grafiği için); yayında statik JSON olarak üretilir */
export const dynamic = "force-static";

export function generateStaticParams() {
  return getFunds().funds.map((f) => ({ kod: f.code }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const f = getFund(kod);
  if (!f) return NextResponse.json({ error: "Fon bulunamadı" }, { status: 404 });
  return NextResponse.json({ code: f.code, name: f.name, prices: f.prices });
}
