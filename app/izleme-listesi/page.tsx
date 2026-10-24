import type { Metadata } from "next";
import Watchlist from "@/components/Watchlist";
import { getIndex } from "@/lib/data";

export const metadata: Metadata = { title: "İzleme Listesi | Borsa Analiz" };

export default function WatchlistPage() {
  return <Watchlist companies={getIndex().companies} />;
}
