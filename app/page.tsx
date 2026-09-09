import Link from "next/link";
import { upcomingRaces, regions } from "@/lib/data";
import { RaceCard } from "@/components/RaceCard";

export default function Home() {
  const up = upcomingRaces();
  const next = up.slice(0, 6);
  const forStart = up.filter((r) => r.beginnerScore >= 4 && r.elevations.length).slice(0, 6);
  return (
    <div className="space-y-12">
      <section className="py-2 grid gap-8 md:grid-cols-[1.1fr_1fr] items-center">
        <div>
          <p className="chip chip-sun mb-3">kalendarz biegów górskich i trail w Polsce</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--moss-dark)]">Płaskie jest nudne.</h1>
          <p className="mt-3 text-lg max-w-2xl">Po płaskim biegasz na czas. W górach biegasz na widok. Zamiast asfaltu masz korzenie, błoto i ścieżkę, która co chwilę zmienia zdanie. Tempo przestaje mieć znaczenie, liczy się to, że wyszedłeś wyżej niż wczoraj. Na podbiegu wolno iść, na szczycie wolno stanąć, na zbiegu wolno się bać. A meta w górach smakuje inaczej niż każda inna.</p>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">{up.length} nadchodzących biegów w {regions().length} pasmach, z filtrami po przewyższeniu, dystansie i limicie czasu. I kreator, który wybierze Twój pierwszy niepłaski bieg.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/kreator" className="btn">Wybierz swój pierwszy bieg</Link>
            <Link href="/biegi" className="btn btn-ghost">Przeglądaj kalendarz</Link>
          </div>
        </div>
        <img src="/hero.svg" alt="Góry o poranku i biegacz na grani" className="w-full rounded-2xl shadow-lg border border-[#e3e7e1]" width={1200} height={700} />
      </section>
      <section>
        <div className="flex items-baseline justify-between mb-4"><h2 className="text-2xl font-bold">Najbliższe starty</h2><Link href="/biegi" className="text-sm font-semibold text-[var(--moss)]">wszystkie</Link></div>
        <div className="grid gap-3 sm:grid-cols-2">{next.map((r) => <RaceCard key={r.id} race={r} />)}</div>
      </section>
      {forStart.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4"><h2 className="text-2xl font-bold">Dobre na start w tym sezonie</h2><Link href="/biegi?start=1" className="text-sm font-semibold text-[var(--moss)]">więcej</Link></div>
          <div className="grid gap-3 sm:grid-cols-2">{forStart.map((r) => <RaceCard key={r.id} race={r} />)}</div>
        </section>
      )}
    </div>
  );
}
