import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import NavLinks from "@/components/NavLinks";
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
          {/* Telefonda üç satırlık başlık ekranı kaplamasın diye yalnızca geniş ekranda sabit */}
          <header className="z-30 border-b border-border bg-surface/90 backdrop-blur lg:sticky lg:top-0">
            {/* Telefonda üç satır: logo + hesap, arama, kaydırılabilir menü; geniş ekranda tek satır */}
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-1 pt-2 lg:h-14 lg:flex-nowrap lg:py-0">
              <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-tight">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm font-bold text-white">T</span>
                <span>Tahta Analiz</span>
              </Link>
              <div className="ml-auto flex shrink-0 items-center gap-2 lg:order-last lg:ml-0">
                <NewsBell />
                <AccountMenu />
                <WatchlistSync />
              </div>
              <div className="order-2 w-full lg:ml-auto lg:w-72 lg:shrink-0">
                <Search items={items} />
              </div>
              <div className="order-3 w-full min-w-0 lg:order-1 lg:w-auto">
                <NavLinks />
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
