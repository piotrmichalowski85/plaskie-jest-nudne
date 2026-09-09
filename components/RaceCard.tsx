import Link from "next/link";
import type { Race } from "@/lib/types";
import { fmtDate, fmtKm, scoreLabel, surfaceLabel } from "@/lib/format";

export function Score({ s }: { s: number }) {
  return <span className="score" title={scoreLabel[s]}><span className="text-[var(--sun)]">{"●".repeat(s)}</span><span className="text-[#d8dcd6]">{"●".repeat(5 - s)}</span></span>;
}

export function RaceCard({ race }: { race: Race }) {
  const dplus = race.elevations.find((e) => e.dplus)?.dplus;
  return (
    <Link href={`/bieg/${race.id}`} className="card hover:border-[var(--moss)] transition-colors block">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[var(--muted)]">{fmtDate(race.dateStart, race.dateEnd)}</p>
          <h3 className="font-bold leading-snug mt-0.5">{race.eventName}</h3>
          <p className="text-sm text-[var(--muted)] mt-0.5">{race.city}{race.region ? `, ${race.region}` : ""}</p>
        </div>
        <Score s={race.beginnerScore} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip">{surfaceLabel[race.surface]}</span>
        {race.distancesKm.length > 0 && <span className="chip">{race.distancesKm.length > 3 ? `${fmtKm(race.minKm)} - ${fmtKm(race.maxKm)}` : race.distancesKm.map(fmtKm).join(" / ")}</span>}
        {dplus && <span className="chip">+{dplus} m na najkrótszym</span>}
        {race.beginnerScore >= 4 && <span className="chip chip-sun">{scoreLabel[race.beginnerScore]}</span>}
      </div>
    </Link>
  );
}
