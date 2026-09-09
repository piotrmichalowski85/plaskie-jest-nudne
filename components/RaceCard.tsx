import Link from "next/link";
import type { Race } from "@/lib/types";
import { fmtDate, fmtKm, scoreLabel, surfaceLabel, level } from "@/lib/format";

export function Score({ s }: { s: number }) {
  const l = level(s);
  return <span className={`lvl lvl-${l}`}><span className="dot" aria-hidden="true" />{scoreLabel(s)}</span>;
}

export function RaceCard({ race }: { race: Race }) {
  const first = race.elevations.find((e) => e.dplus);
  const dplus = first && !first.approx ? first.dplus : undefined;
  return (
    <Link href={`/bieg/${race.id}`} className="card hover:border-[var(--moss)] transition-colors block">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--muted)]">{fmtDate(race.dateStart, race.dateEnd)}</p>
          <h3 className="font-bold leading-snug mt-0.5">{race.eventName}</h3>
          <p className="text-sm text-[var(--muted)] mt-0.5">{race.city}{race.region ? `, ${race.region}` : ""}</p>
        </div>
        <span className="shrink-0"><Score s={race.beginnerScore} /></span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip">{surfaceLabel[race.surface]}</span>
        {race.distancesKm.length > 0 && <span className="chip">{race.distancesKm.length > 3 ? `${fmtKm(race.minKm)} - ${fmtKm(race.maxKm)}` : race.distancesKm.map(fmtKm).join(" / ")}</span>}
        {dplus && <span className="chip">+{dplus} m na najkrótszym</span>}
      </div>
    </Link>
  );
}
