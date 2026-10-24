import { NextResponse, type NextRequest } from "next/server";
import { getDisclosures } from "@/lib/kap";

export const dynamic = "force-dynamic";

/** GET /api/haberler?codes=THYAO,ASELS&days=7 → izlenen şirketlerin KAP bildirimleri */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const codes = new Set(
    (params.get("codes") ?? "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean),
  );
  const days = Math.min(Math.max(Number(params.get("days")) || 7, 1), 30);
  const limit = Math.min(Number(params.get("limit")) || 100, 300);

  if (codes.size === 0) return NextResponse.json({ items: [] });

  try {
    const all = await getDisclosures(days);
    const items = all.filter((d) => d.codes.some((c) => codes.has(c))).slice(0, limit);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: `KAP'a ulaşılamadı: ${(e as Error).message}` }, { status: 502 });
  }
}
