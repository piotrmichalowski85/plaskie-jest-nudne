import Link from "next/link";
import type { Race } from "@/lib/types";
import { fmtKm, scoreLabel, level, dayNum, monthShort, dow, untilLabel } from "@/lib/format";
import { RegionArt } from "./RegionArt";
import { SignupChip } from "./RaceCard";

export function PosterCard({ race, today }: { race: Race; today: string }) {
  const lvl = level(race.beginnerScore);
  const first = race.elevations.find((e) => e.dplus && !e.approx);
  const dist = race.distancesKm.length > 3 ? `${fmtKm(race.minKm)} - ${fmtKm(race.maxKm)}` : race.distancesKm.map(fmtKm).join(" / ");
  const until = untilLabel(race.dateStart, race.dateEnd, today);
  const multi = race.dateEnd !== race.dateStart;
  const k = until || (multi ? `${dow(race.dateStart)}-${dow(race.dateEnd)}` : dow(race.dateStart));
  const limit = race.elevations.find((e) => e.limitH)?.limitH;
  return (
    <Link href={`/bieg/${race.id}`} className={`poster${race.signup?.status === "closed" ? " closed" : ""}`}>
      <RegionArt region={race.region} surface={race.surface} className="art" label="" />
      <span className="shade" />
      <span className="d">{dayNum(race.dateStart)}{multi && dayNum(race.dateEnd) !== dayNum(race.dateStart) ? <span className="text-[1.6rem] align-top">-{dayNum(race.dateEnd)}</span> : null}<small>{monthShort(race.dateStart)}</small></span>
      {k && <span className="k">{k}</span>}
      {race.spark && <svg className="spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="#1f4128" strokeOpacity=".55" strokeWidth="1.6" points={race.spark.map((v, i) => `${(i / 23) * 100},${26 - v * 24}`).join(" ")} /></svg>}
      <span className="mid">{[first ? `+${first.dplus} m na ${fmtKm(first.km)}` : null, limit ? `limit ${limit} h` : null, race.gear ? `sprzęt: ${race.gear.length} poz.` : null].filter(Boolean).join(" · ")}</span>
      <span className="in">
        <h3>{race.eventName}</h3>
        <span className="loc">{race.city}{race.region ? ` · ${race.region}` : ""}</span>
        <span className="meta">
          <span className={`lvl lvl-${lvl}`}><span className="dot" />{scoreLabel(race.beginnerScore)}</span>
          {dist && <span className="chip">{dist}</span>}
          {race.provisional ? <span className="chip chip-sun" title={race.provisional}>termin wstępny</span> : <SignupChip race={race} />}
        </span>
      </span>
    </Link>
  );
}
