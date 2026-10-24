import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import NewsBell from "@/components/NewsBell";
import Search from "@/components/Search";
import { getIndex } from "@/lib/data";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Borsa Analiz",
  description: "BIST şirketlerinin mali tabloları, oranları ve hisse tarama aracı",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { companies, updatedAt } = getIndex();
  const items = companies.map((c) => ({ code: c.code, name: c.name }));

  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm font-bold text-white">B</span>
              <span className="hidden sm:inline">Borsa Analiz</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="rounded-md px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-text">
                Hisseler
              </Link>
              <Link href="/radar" className="rounded-md px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-text">
                Hisse Radar
              </Link>
              <Link
                href="/izleme-listesi"
                className="hidden rounded-md px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-text md:block"
              >
                İzleme Listesi
              </Link>
            </nav>
            <div className="ml-auto flex w-full max-w-xs items-center gap-2">
              <Search items={items} />
              <NewsBell />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-muted">
          Veriler Yahoo Finance üzerinden alınır, gecikmeli olabilir ve yatırım tavsiyesi değildir. Son güncelleme:{" "}
          {new Date(updatedAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
        </footer>
      </body>
    </html>
  );
}
