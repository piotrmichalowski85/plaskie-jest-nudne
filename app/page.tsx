import Link from "next/link";
import { upcomingRaces, today, allRaces } from "@/lib/data";
import { PosterCard } from "@/components/PosterCard";
import { Ticker } from "@/components/Ticker";
import type { Metadata } from "next";
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const t = today();
  const up = upcomingRaces();
  const next = up.slice(0, 6);
  const forStart = up.filter((r) => r.beginnerScore >= 4 && !next.includes(r)).slice(0, 3);
  return (
    <div className="space-y-10">
      <section className="grid gap-8 md:grid-cols-[1fr_1fr] items-end pt-2">
        <h1 className="display text-[5.2rem] sm:text-[7rem] md:text-[8.5rem] leading-[.86] text-[var(--ink)]" aria-label="Płaskie jest nudne: kalendarz biegów górskich i trailowych w Polsce">Płaskie<br />jest<br /><span className="text-[var(--moss)]">nudne ;)</span></h1>
        <div className="md:pb-3">
          <p className="text-[1.05rem] leading-relaxed text-[#3d4d34] max-w-[30rem]">Po płaskim biegasz na czas. W górach biegasz na widok. Zamiast asfaltu masz korzenie, błoto i ścieżkę, która co chwilę zmienia kierunek. Tempo przestaje mieć znaczenie, liczy się to, że jesteś wyżej niż wczoraj. Na podbiegu wolno iść, na szczycie wolno stanąć, na zbiegu wolno się bać, na punktach wolno jeść. A meta w górach smakuje inaczej niż każda inna.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/kreator" className="btn">Wybierz swój pierwszy bieg</Link>
            <Link href="/biegi" className="btn btn-ghost">{up.length} biegów w kalendarzu</Link>
          </div>
        </div>
      </section>

      <Ticker races={up} today={t} />

      <section>
        <div className="flex flex-wrap gap-2 mb-4">
          <Link href="/biegi" className="qchip on">Wszystkie</Link>
          <Link href="/biegi/dla-poczatkujacych" className="qchip">Dobry na start</Link>
          <Link href="/biegi/do-15-km" className="qchip">Do 15 km</Link>
          <Link href="/biegi/ultra" className="qchip">Ultra</Link>
          <Link href="/biegi/zapisy-otwarte" className="qchip">Zapisy otwarte</Link>
          <Link href="/biegi?view=mapa" className="qchip">Mapa</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{next.map((r) => <PosterCard key={r.id} race={r} today={t} />)}</div>
      </section>

      {forStart.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-3"><h2 className="text-[2.2rem]">Dobre na pierwszy start</h2><Link href="/biegi/dla-poczatkujacych" className="text-sm font-bold text-[var(--moss)]">więcej →</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{forStart.map((r) => <PosterCard key={r.id} race={r} today={t} />)}</div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between mb-3"><h2 className="text-[2.2rem]">Narzędzia na pierwszy start</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/kreator" className="card block hover:border-[var(--moss)]"><h3 className="text-[1.7rem]">Pierwszy niepłaski bieg</h3><p className="mt-1 text-sm text-[var(--muted)]">Pięć pytań i trzy biegi na Twój staż.</p></Link>
          <Link href="/czy-dam-rade" className="card block hover:border-[var(--moss)]"><h3 className="text-[1.7rem]">Czy dam radę?</h3><p className="mt-1 text-sm text-[var(--muted)]">Czas z 10 km na płaskim, wybrany bieg, szacunek na każdym dystansie i porównanie z limitem.</p></Link>
          <Link href="/slownik" className="card block hover:border-[var(--moss)]"><h3 className="text-[1.7rem]">Słownik trailowy</h3><p className="mt-1 text-sm text-[var(--muted)]">D+, cutoff, sprzęt obowiązkowy, kije, ITRA i UTMB. Jak tłumaczy się je na podbiegu.</p></Link>
        </div>
      </section>
      <p className="text-xs text-[var(--muted)]">{allRaces.length} biegów w bazie, odświeżane co tydzień. Fakty pochodzą z kalendarzy, platform zapisów i stron organizatorów.</p>
    </div>
  );
}
