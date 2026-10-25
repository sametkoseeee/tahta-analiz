import type { Metadata } from "next";
import Watchlist from "@/components/Watchlist";
import { getFunds, getIndex } from "@/lib/data";

export const metadata: Metadata = { title: "İzleme Listesi" };

export default function WatchlistPage() {
  return <Watchlist companies={getIndex().companies} funds={getFunds().funds} />;
}
