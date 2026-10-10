import type { Metadata } from "next";
import { allRaces, regions, today } from "@/lib/data";
import { RaceList } from "@/components/RaceList";
import { geoFor } from "@/lib/geo";
import Link from "next/link";
import { allHubs, hubPath } from "@/lib/hubs";
export const metadata: Metadata = { title: "Kalendarz biegów górskich i trailowych 2026/2027", description: "Wszystkie biegi górskie, trailowe i przełajowe w Polsce: terminy, dystanse, przewyższenia, status zapisów i ocena dla początkujących. Filtry po paśmie, dacie i dystansie.", alternates: { canonical: "/biegi" } };
export default function Biegi() {
  return (
    <div>
      <h1 className="text-[3rem] mb-1">Kalendarz biegów</h1>
      <p className="text-[var(--muted)] mb-6">Biegi górskie, trailowe i przełajowe w całej Polsce. Zielony = dobry na start, żółty = ujdzie na start, czerwony = zły na start.</p>
      <RaceList races={allRaces.map((r) => { const g = geoFor(r.city); return g ? { ...r, lat: g.lat, lng: g.lng } : r; })} regions={regions()} today={today()} />
      <section className="mt-12 space-y-5">
        <h2 className="text-[1.9rem]">Zestawienia</h2>
        {(["pasmo", "miesiac", "temat"] as const).map((k) => (
          <div key={k}>
            <p className="step mb-1.5">{k === "pasmo" ? "Pasma i regiony" : k === "miesiac" ? "Miesiące" : "Tematycznie"}</p>
            <div className="flex flex-wrap gap-1.5">{allHubs().filter((h) => h.kind === k).map((h) => <Link key={hubPath(h)} href={hubPath(h)} className="qchip">{h.label}</Link>)}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
