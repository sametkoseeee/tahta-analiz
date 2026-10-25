import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import NewsBell from "@/components/NewsBell";
import Search from "@/components/Search";
import UpdatedAt from "@/components/UpdatedAt";
import WatchlistSync from "@/components/WatchlistSync";
import { getFunds, getIndex } from "@/lib/data";
import { LiveProvider } from "@/lib/live";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: "Tahta Analiz", template: "%s | Tahta Analiz" },
  description: "BIST şirketlerinin mali tabloları, oranları, KAP bildirimleri, hisse tarama aracı ve TEFAS fonları",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100"),
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { companies, updatedAt } = getIndex();
  const items = [
    ...companies.map((c) => ({ code: c.code, name: c.name })),
    ...getFunds().funds.map((f) => ({ code: f.code, name: f.name, href: `/fonlar/${f.code}`, tag: "Fon" })),
  ];

  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <LiveProvider dataUpdatedAt={updatedAt}>
          <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
            {/* Telefonda iki satır: üstte logo + hesap, altta menü + arama; masaüstünde tek satır */}
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:h-14 md:flex-nowrap md:py-0">
              <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-tight">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm font-bold text-white">T</span>
                <span>Tahta Analiz</span>
              </Link>
              <div className="ml-auto flex shrink-0 items-center gap-2 md:order-last md:ml-0">
                <NewsBell />
                <AccountMenu />
                <WatchlistSync />
              </div>
              <div className="flex w-full min-w-0 items-center gap-2 md:w-auto md:flex-1">
                <nav className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm">
                  <Link href="/" className="rounded-md px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-text">
                    Hisseler
                  </Link>
                  <Link href="/radar" className="rounded-md px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-text">
                    Hisse Radar
                  </Link>
                  <Link href="/fonlar" className="rounded-md px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-text">
                    Fonlar
                  </Link>                  <Link
                    href="/izleme-listesi"
                    className="hidden rounded-md px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-text md:block"
                  >
                    İzleme Listesi
                  </Link>
                </nav>
                <div className="min-w-0 flex-1 md:ml-auto md:max-w-xs">
                  <Search items={items} />
                </div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-muted">
            Mali tablolar İş Yatırım, fiyatlar Yahoo Finance (yaklaşık 15 dakika gecikmeli), bildirimler KAP kaynaklıdır;
            yatırım tavsiyesi değildir. <UpdatedAt dataUpdatedAt={updatedAt} />
          </footer>
        </LiveProvider>
      </body>
    </html>
  );
}
