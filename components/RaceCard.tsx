import Link from "next/link";
import type { Race } from "@/lib/types";
import { fmtDate, fmtKm, scoreLabel, surfaceLabel, level } from "@/lib/format";
import { RegionArt } from "./RegionArt";

export function Score({ s }: { s: number }) {
  const l = level(s);
  return <span className={`lvl lvl-${l}`}><span className="dot" aria-hidden="true" />{scoreLabel(s)}</span>;
}

export function SignupChip({ race, long = false }: { race: Race; long?: boolean }) {
  const s = race.signup;
  const d = (iso: string) => `${Number(iso.slice(8, 10))}.${iso.slice(5, 7)}`;
  if (!s || s.status === "unknown") return <span className="chip !bg-transparent !text-[var(--muted)] border border-dashed border-[#cfd6cd]" title="Nie znaleźliśmy informacji o zapisach. Sprawdź u organizatora.">zapisy: brak danych</span>;
  if (s.status === "closed") return <span className="chip !bg-[#ececec] !text-[#555]" title={s.until ? `Termin zapisów minął ${d(s.until)}` : "Organizator zamknął zapisy"}>zapisy zamknięte</span>;
  return <span className="chip chip-sun" title={s.until ? `Ostatni dzień zapisów: ${d(s.until)}` : "Zapisy otwarte"}>{s.until ? `zapisy do ${d(s.until)}` : "zapisy otwarte"}{long && s.registered ? `, ${s.registered} os.` : ""}</span>;
}

export function RaceCard({ race }: { race: Race }) {
  const first = race.elevations.find((e) => e.dplus);
  const dplus = first && !first.approx ? first.dplus : undefined;
  return (
    <Link href={`/bieg/${race.id}`} className={`card hover:border-[var(--moss)] transition-colors block overflow-hidden${race.signup?.status === "closed" ? " opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <RegionArt region={race.region} surface={race.surface} className="w-16 h-12 rounded-lg shrink-0" label="" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--muted)]">{fmtDate(race.dateStart, race.dateEnd)}</p>
          <h3 className="font-bold leading-snug mt-0.5">{race.eventName}</h3>
          <p className="text-sm text-[var(--muted)] mt-0.5">{race.city}{race.region ? `, ${race.region}` : ""}</p>
        </div>
        <span className="shrink-0"><Score s={race.beginnerScore} /></span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip">{surfaceLabel[race.surface]}</span>
        {race.distancesKm.length > 0 && <span className="chip">{race.distancesKm.length > 3 ? `${fmtKm(race.minKm)} - ${fmtKm(race.maxKm)}` : race.distancesKm.map(fmtKm).join(" / ")}</span>}
        {dplus && <span className="chip">+{dplus} m na najkrótszym dystansie</span>}
        <SignupChip race={race} />
      </div>
    </Link>
  );
}
