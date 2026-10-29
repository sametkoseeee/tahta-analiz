import type { NextConfig } from "next";

// Site tamamen statik dışa aktarılır (out/) ve Cloudflare Pages'te yayınlanır. Sunucu gerektiren tek iş
// (KAP bildirimleri) functions/ altındaki Cloudflare Pages fonksiyonudur.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
