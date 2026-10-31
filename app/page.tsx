import type { Metadata } from "next";
import MarketOverview from "@/components/MarketOverview";
import { getIndex } from "@/lib/data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <MarketOverview companies={getIndex().companies} />;
}
