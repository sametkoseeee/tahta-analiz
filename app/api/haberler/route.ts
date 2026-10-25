import { NextResponse, type NextRequest } from "next/server";
import { getDisclosuresFor } from "@/lib/kap";

export const dynamic = "force-dynamic";

/** GET /api/haberler?codes=THYAO,ASELS&days=7 → izlenen şirketlerin KAP bildirimleri */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const codes = [
    ...new Set(
      (params.get("codes") ?? "")
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => /^[A-Z0-9]{2,8}$/.test(c)),
    ),
  ].slice(0, 200);
  const days = Math.min(Math.max(Number(params.get("days")) || 7, 1), 30);
  const limit = Math.min(Number(params.get("limit")) || 100, 300);

  if (codes.length === 0) return NextResponse.json({ items: [] });

  try {
    const items = (await getDisclosuresFor(codes, days)).slice(0, limit);
    return NextResponse.json({ items });
  } catch (e) {
    const m = (e as Error).message;
    // Node'un ham ağ hatası ("fetch failed", zaman aşımı) kullanıcıya Türkçe gösterilir
    const reason = /fetch failed|timeout|aborted/i.test(m) ? "bağlantı kurulamadı, biraz sonra tekrar deneyin" : m;
    return NextResponse.json({ items: [], error: `KAP'a ulaşılamadı: ${reason}` }, { status: 502 });
  }
}
