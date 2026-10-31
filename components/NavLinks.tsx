"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const LINKS = [
  { href: "/", label: "Hisseler", match: (p: string) => p === "/" || p.startsWith("/sirketler") },
  { href: "/radar", label: "Hisse Radar" },
  { href: "/karsilastir", label: "Karşılaştır" },
  { href: "/fonlar", label: "Fonlar" },
  { href: "/bilancolar", label: "Bilançolar" },
  { href: "/temettu", label: "Temettü" },
  { href: "/viop", label: "VİOP" },
  { href: "/tedbirli-hisseler", label: "Tedbirli" },
  { href: "/sermaye-artirimi", label: "Sermaye Artırımı" },
  { href: "/halka-arz", label: "Halka Arz" },
  { href: "/endeksler", label: "Endeksler" },
  { href: "/hesaplama", label: "Hesaplama" },
  { href: "/portfoy", label: "Portföyüm" },
  { href: "/izleme-listesi", label: "İzleme Listesi" },
];

/** Üst menü; bulunulan bölüm vurgulanır. Telefonda yatay kaydırılır. */
export default function NavLinks() {
  const path = usePathname();
  const nav = useRef<HTMLElement>(null);
  // Telefonda menü kaydırılıyor: açık bölümün bağlantısı görünür olsun
  useEffect(() => {
    const el = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && nav.current) nav.current.scrollLeft = el.offsetLeft - 16;
  }, [path]);
  return (
    <nav
      ref={nav}
      className="no-scrollbar -mx-4 flex items-center gap-1 overflow-x-auto whitespace-nowrap px-4 text-sm lg:mx-0 lg:px-0"
    >
      {LINKS.map((l) => {
        const active = l.match ? l.match(path) : path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-md px-2.5 py-1.5 ${
              active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
