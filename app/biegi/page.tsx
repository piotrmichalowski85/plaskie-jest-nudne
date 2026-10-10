import type { Metadata } from "next";
import { allRaces, regions, today } from "@/lib/data";
import { RaceList } from "@/components/RaceList";
import { geoFor } from "@/lib/geo";
export const metadata: Metadata = { title: "Kalendarz biegów górskich i trailowych 2026/2027", description: "Wszystkie biegi górskie, trailowe i przełajowe w Polsce: terminy, dystanse, przewyższenia, status zapisów i ocena dla początkujących. Filtry po paśmie, dacie i dystansie.", alternates: { canonical: "/biegi" } };
export default function Biegi() {
  return (
    <div>
      <h1 className="text-[3rem] mb-1">Kalendarz biegów</h1>
      <p className="text-[var(--muted)] mb-6">Biegi górskie, trailowe i przełajowe w całej Polsce. Zielony = dobry na start, żółty = ujdzie na start, czerwony = zły na start.</p>
      <RaceList races={allRaces.map((r) => { const g = geoFor(r.city); return g ? { ...r, lat: g.lat, lng: g.lng } : r; })} regions={regions()} today={today()} />
    </div>
  );
}
