/**
 * İzleme listesinde hisseler ve fonlar birlikte tutulur. BIST hisse kodları en az 4,
 * TEFAS fon kodları tam 3 karakter; KAP bildirimleri yalnızca hisseler için sorgulanır.
 * Sunucu, tarayıcı ve scripts/kap_push.mjs birlikte kullanır.
 */
export const isFundCode = (code: string) => code.length === 3;
export const stockCodes = (codes: string[]) => codes.filter((c) => !isFundCode(c));
