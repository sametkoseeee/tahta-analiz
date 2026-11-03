import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** iPhone'da bildirim yalnızca Ana Ekran'a eklenmiş web uygulamasında çalışır; bunun için uygulama tanımı gerekir */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tahta Analiz",
    short_name: "Tahta Analiz",
    description: "BIST hisse analizi, bilanço, temettü, KAP bildirimleri ve fonlar",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    lang: "tr",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
