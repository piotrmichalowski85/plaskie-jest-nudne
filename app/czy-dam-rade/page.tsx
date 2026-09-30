import type { Metadata } from "next";
import { Suspense } from "react";
import { allRaces, today } from "@/lib/data";
import { CzyDamRade } from "@/components/CzyDamRade";
export const metadata: Metadata = { title: "Czy dam radę? Szacowany czas na biegu górskim", description: "Wpisz czas z płaskiego, wybierz bieg górski albo trailowy w Polsce i zobacz szacowany czas na każdym dystansie w porównaniu z limitem." };
export default async function Page({ searchParams }: { searchParams: Promise<{ bieg?: string }> }) {
  const sp = await searchParams;
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-1">Czy dam radę?</h1>
      <p className="text-[var(--muted)] mb-6">Czas z płaskiego, wybrany bieg, szacunek na każdym dystansie i porównanie z limitem czasu. Bez rejestracji.</p>
      <Suspense><CzyDamRade races={allRaces} today={today()} initialRaceId={sp.bieg} /></Suspense>
    </div>
  );
}
