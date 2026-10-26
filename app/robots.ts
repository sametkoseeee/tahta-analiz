import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tahtaanaliz.com";

/** Arama motorları: kişisel ve teknik sayfalar taranmasın (/robots.txt) */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/giris", "/hesap", "/izleme-listesi"] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
