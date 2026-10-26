export type Theme = "light" | "dark";

export const THEME_KEY = "tema";

/**
 * Sayfa boyanmadan önce <head> içinde çalışır: kayıtlı seçim yoksa cihaz ayarı kullanılır.
 * Seçim yapılmamışsa cihaz ayarı değiştiğinde tema da değişir.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");function s(){var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}d.dataset.theme=t==="dark"||t==="light"?t:m.matches?"dark":"light"}s();m.addEventListener("change",s)})();`;
