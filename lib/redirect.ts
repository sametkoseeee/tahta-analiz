/** Yalnızca site içi yollara dönülür (açık yönlendirme olmasın). Sunucu ve tarayıcıda kullanılır. */
export function safeNext(next: string | null, fallback = "/izleme-listesi"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
