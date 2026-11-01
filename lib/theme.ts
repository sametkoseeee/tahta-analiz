export type Theme = "light" | "dark";

export const THEME_KEY = "tema";

/**
 * Sayfa boyanmadan önce <head> içinde çalışır. Varsayılan koyu tema; ziyaretçi düğmeyle açık temayı
 * seçtiyse (localStorage) o kullanılır.
 */
export const THEME_SCRIPT = `(function(){var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}document.documentElement.dataset.theme=t==="light"?"light":"dark"})();`;
