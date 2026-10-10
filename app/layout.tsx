import type { Metadata } from "next";
import Link from "next/link";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { Analytics } from "@/components/Analytics";
import { siteJsonLd } from "@/lib/seo";

const display = Bebas_Neue({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-display" });
const body = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL("https://plaskiejestnudne.pl"),
  title: { default: "Płaskie jest nudne: biegi górskie i trailowe w Polsce", template: "%s | Płaskie jest nudne" },
  description: "Kalendarz biegów górskich, trailowych i przełajowych w Polsce z filtrami po przewyższeniu, dystansie i regionie oraz kreator pierwszego niepłaskiego biegu.",
  openGraph: { type: "website", locale: "pl_PL", siteName: "Płaskie jest nudne" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--line)]">
          <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
            <Link href="/" aria-label="Płaskie jest nudne, strona główna"><Logo /></Link>
            <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold text-[var(--moss-dark)]">
              <Link href="/biegi">Biegi</Link>
              <Link href="/kreator" className="hidden sm:inline">Pierwszy bieg</Link>
              <Link href="/czy-dam-rade" className="hidden sm:inline">Czy dam radę?</Link>
              <Link href="/slownik" className="hidden md:inline">Słownik trailowy</Link>
              <a href="mailto:kontakt@plaskiejestnudne.pl?subject=Dodaj%20bieg" className="btn !py-2 !px-4 text-sm whitespace-nowrap">Dodaj bieg</a>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 flex-1">{children}</main>
        <footer className="border-t border-[var(--line)] text-sm text-[var(--muted)]">
          <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row gap-2 justify-between">
            <span>Płaskie jest nudne: wejdź w trail, zacznij od podbiegu. Serwis niekomercyjny.</span>
            <span className="flex gap-3"><Link href="/o-serwisie" className="underline">O serwisie</Link><Link href="/prywatnosc" className="underline">Prywatność</Link><Link href="/slownik" className="underline md:hidden">Słownik</Link></span>
          </div>
        </footer>
        <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      </body>
    </html>
  );
}
