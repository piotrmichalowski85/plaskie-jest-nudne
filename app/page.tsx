import Link from "next/link";
import { upcomingRaces, allRaces, regions, generatedAt } from "@/lib/data";
import { RaceCard } from "@/components/RaceCard";

export default function Home() {
  const up = upcomingRaces();
  const next = up.slice(0, 6);
  const forStart = up.filter((r) => r.beginnerScore >= 4 && r.elevations.length).slice(0, 6);
  return (
    <div className="space-y-12">
      <section className="py-6">
        <p className="chip chip-sun mb-3">kalendarz biegów górskich i trail w Polsce</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--moss-dark)]">Płaskie jest nudne.</h1>
        <p className="mt-3 text-lg max-w-2xl">Wejdź w trail, zacznij od podbiegu. {up.length} nadchodzących biegów w {regions().length} pasmach, z filtrami po przewyższeniu, dystansie i limicie czasu. I kreator, który wybierze Twój pierwszy niepłaski bieg.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/kreator" className="btn">Wybierz mój pierwszy bieg</Link>
          <Link href="/biegi" className="btn btn-ghost">Przeglądaj kalendarz</Link>
        </div>
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
      <p className="text-xs text-[var(--muted)]">Baza: {allRaces.length} biegów, odświeżona {generatedAt.slice(0, 10)}. Fakty (nazwa, data, miejsce, dystans) pochodzą z kalendarzy organizatorów i portali, zawsze z linkiem do źródła.</p>
    </div>
  );
}
