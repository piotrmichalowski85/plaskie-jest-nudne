import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { Analytics } from "@/components/Analytics";
import { MojeNav } from "@/components/MojeNav";
import { siteJsonLd } from "@/lib/seo";
import { generatedAt } from "@/lib/data";

const display = Bebas_Neue({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-display" });
const body = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL("https://plaskiejestnudne.pl"),
  title: { default: "Płaskie jest nudne: biegi górskie i trailowe w Polsce", template: "%s | Płaskie jest nudne" },
  description: "Kalendarz biegów górskich, trailowych i przełajowych w Polsce z filtrami po przewyższeniu, dystansie i regionie oraz kreator pierwszego niepłaskiego biegu.",
  openGraph: { type: "website", locale: "pl_PL", siteName: "Płaskie jest nudne" },
  robots: { index: true, follow: true, "max-image-preview": "large", googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export const viewport: Viewport = { themeColor: "#2f5d3a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${display.variable} ${body.variable}`}>
      <head>
        {/* kanał RSS jawnie, bo strony z własnym "alternates" (canonical) nadpisują wpis z metadanych układu */}
        <link rel="alternate" type="application/rss+xml" title="Płaskie jest nudne: nowe biegi" href="/feed.xml" />
      </head>
      <body className="min-h-screen flex flex-col">
        <a href="#tresc" className="skip-link">Przejdź do treści</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--line)]">
          <nav aria-label="Główna nawigacja" className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
            <Link href="/" aria-label="Płaskie jest nudne, strona główna"><Logo /></Link>
            {/* odstępy i skrócony przycisk na telefonie: z sercem "Moje biegi" pełna nawigacja nie mieści się w 375 px */}
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 text-sm font-semibold text-[var(--moss-dark)]">
              <Link href="/biegi">Biegi</Link>
              <Link href="/kreator" className="hidden sm:inline">Pierwszy bieg</Link>
              <Link href="/czy-dam-rade" className="hidden sm:inline">Czy dam radę?</Link>
              <Link href="/slownik" className="hidden md:inline">Słownik trailowy</Link>
              <MojeNav />
              <a href="mailto:kontakt@plaskiejestnudne.pl?subject=Dodaj%20bieg" aria-label="Dodaj bieg" className="btn !py-2 !px-3 sm:!px-4 text-sm whitespace-nowrap"><span className="sm:hidden" aria-hidden="true">+ bieg</span><span className="hidden sm:inline">Dodaj bieg</span></a>
            </div>
          </nav>
        </header>
        <main id="tresc" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 flex-1 outline-none">{children}</main>
        <footer className="border-t border-[var(--line)] text-sm text-[var(--muted)]">
          <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row gap-2 justify-between">
<<<<<<< HEAD
            <span>Płaskie jest nudne: wejdź w trail, zacznij od podbiegu. Serwis niekomercyjny.</span>
            <span className="flex flex-wrap gap-x-3 gap-y-1"><Link href="/zmiany" className="underline">Co nowego</Link><Link href="/newsletter" className="underline">Newsletter</Link><Link href="/dla-organizatorow" className="underline">Dla organizatorów</Link><Link href="/o-serwisie" className="underline">O serwisie</Link><Link href="/prywatnosc" className="underline">Prywatność</Link><Link href="/slownik" className="underline md:hidden">Słownik</Link></span>
=======
            <span>Płaskie jest nudne: wejdź w trail, zacznij od podbiegu. Serwis niekomercyjny. Stan danych: {generatedAt.slice(0, 10).split("-").reverse().join(".")}.</span>
            <span className="flex flex-wrap gap-x-3 gap-y-1"><Link href="/zmiany" className="underline">Co nowego</Link><Link href="/dla-organizatorow" className="underline">Dla organizatorów</Link><Link href="/o-serwisie" className="underline">O serwisie</Link><Link href="/prywatnosc" className="underline">Prywatność</Link><Link href="/slownik" className="underline md:hidden">Słownik</Link></span>
>>>>>>> origin/main
          </div>
        </footer>
        <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      </body>
    </html>
  );
}
