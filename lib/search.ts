/** Arama için: şirket adları KAP'ta Türkçe karaktersiz de yazılabiliyor ("Sekerbank"), harfler eşitlenir */
export const norm = (s: string) =>
  s
    .toLocaleUpperCase("tr")
    .replace(/[ŞĞÜÖÇİ]/g, (c) => ({ Ş: "S", Ğ: "G", Ü: "U", Ö: "O", Ç: "C", İ: "I" })[c]!);

/** Kod ya da şirket adı aramayı içeriyor mu (q önceden norm'dan geçmiş olmalı) */
export const matchesQuery = (d: { code: string; name: string }, q: string) =>
  norm(d.code).includes(q) || norm(d.name).includes(q);
