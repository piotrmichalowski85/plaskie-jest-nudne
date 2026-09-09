import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://plaskiejestnudne.pl"),
  title: { default: "Płaskie jest nudne: biegi górskie i trail w Polsce", template: "%s | Płaskie jest nudne" },
  description: "Kalendarz biegów górskich, trailowych i przełajowych w Polsce z filtrami po przewyższeniu, dystansie i regionie oraz kreator pierwszego niepłaskiego biegu.",
  openGraph: { type: "website", locale: "pl_PL", siteName: "Płaskie jest nudne" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-[#e3e7e1] bg-white/80 backdrop-blur sticky top-0 z-10">
          <nav className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="font-extrabold tracking-tight text-[var(--moss-dark)]">płaskie<span className="text-[var(--sun)]">jest</span>nudne</Link>
            <div className="flex gap-4 text-sm font-semibold text-[var(--moss-dark)]">
              <Link href="/biegi">Biegi</Link>
              <Link href="/kreator">Pierwszy bieg</Link>
              <Link href="/slownik">Słownik</Link>
              <Link href="/o-serwisie" className="hidden sm:inline">O serwisie</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 flex-1">{children}</main>
        <footer className="border-t border-[#e3e7e1] text-sm text-[var(--muted)]">
          <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row gap-2 justify-between">
            <span>Płaskie jest nudne: wejdź w trail, zacznij od podbiegu. Serwis niekomercyjny.</span>
            <span><Link href="/o-serwisie" className="underline">Skąd dane i kto to robi</Link></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
