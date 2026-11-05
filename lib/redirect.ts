/** Yalnızca site içi yollara dönülür (açık yönlendirme olmasın). Sunucu ve tarayıcıda kullanılır.
 * Tarayıcılar sekme/satır sonu karakterlerini siler ve ters bölüyü bölü sayar ("/\t/kotu.site" ve
 * "/\\kotu.site" → "//kotu.site"); bu yüzden adres gerçekten çözümlenip aynı sitede kaldığı denetlenir. */
const BASE = "https://site.invalid";

export function safeNext(next: string | null, fallback = "/izleme-listesi"): string {
  if (!next || !next.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  try {
    const u = new URL(next, BASE);
    if (u.origin !== BASE) return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
