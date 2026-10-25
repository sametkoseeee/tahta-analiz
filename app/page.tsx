import MarketOverview from "@/components/MarketOverview";
import { getIndex } from "@/lib/data";

export default function Home() {
  return <MarketOverview companies={getIndex().companies} />;
}
