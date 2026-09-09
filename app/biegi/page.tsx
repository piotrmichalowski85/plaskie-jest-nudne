import type { Metadata } from "next";
import { Suspense } from "react";
import { allRaces, regions, today } from "@/lib/data";
import { RaceList } from "@/components/RaceList";
export const metadata: Metadata = { title: "Kalendarz biegów górskich i trail", description: "Wszystkie biegi górskie, trailowe i przełajowe w Polsce z filtrami po pasmie, miesiącu, dystansie i ocenie dla początkujących." };
export default function Biegi() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-1">Kalendarz biegów</h1>
      <p className="text-[var(--muted)] mb-6">Górskie, trail i przełaje w całej Polsce. Zielony = dobry na start, żółty = ujdzie, czerwony = zły na start.</p>
      <Suspense><RaceList races={allRaces} regions={regions()} today={today()} /></Suspense>
    </div>
  );
}
