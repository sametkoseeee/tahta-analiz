import type { MetadataRoute } from "next";
import { getFunds, getIndex } from "@/lib/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tahtaanaliz.com";

/** Google için site haritası: sabit sayfalar + tüm hisse ve fon sayfaları (/sitemap.xml) */
export default function sitemap(): MetadataRoute.Sitemap {
  const { companies, updatedAt } = getIndex();
  const now = new Date(updatedAt || Date.now());
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "daily") => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1),
    page("/radar", 0.8),
    page("/fonlar", 0.8),
    page("/bilancolar", 0.8),
    page("/bilancolar/yaklasan", 0.7),
    page("/temettu", 0.8),
    page("/viop", 0.7),
    page("/tedbirli-hisseler", 0.7),
    page("/karsilastir", 0.6, "weekly"),
    page("/fonlar/karsilastir", 0.6, "weekly"),
    page("/kvkk", 0.2, "monthly"),
    ...companies.map((c) => page(`/sirketler/${c.code}`, 0.7)),
    ...getFunds().funds.map((f) => page(`/fonlar/${f.code}`, 0.5)),
  ];
}
