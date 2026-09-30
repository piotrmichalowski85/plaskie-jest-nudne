"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Race } from "@/lib/types";
import { predictMinutes, fmtH, type FlatRef, type Experience } from "@/lib/predict";
import { fmtDate, fmtKm } from "@/lib/format";

const REFS: { km: FlatRef["km"]; label: string; example: string }[] = [
  { km: 5, label: "5 km", example: "np. 28:00" }, { km: 10, label: "10 km", example: "np. 58:00" },
  { km: 21.1, label: "półmaraton", example: "np. 2:05:00" }, { km: 42.2, label: "maraton", example: "np. 4:20:00" },
];
const parseTime = (s: string): number | null => { const p = s.trim().split(":").map(Number); if (p.some((x) => isNaN(x))) return null; if (p.length === 2) return p[0] + p[1] / 60; if (p.length === 3) return p[0] * 60 + p[1] + p[2] / 60; return null; };

export function CzyDamRade({ races, today, initialRaceId }: { races: Race[]; today: string; initialRaceId?: string }) {
  const upcoming = useMemo(() => races.filter((r) => r.dateEnd >= today && r.distancesKm.length), [races, today]);
  const [refKm, setRefKm] = useState<FlatRef["km"]>(10);
  const [time, setTime] = useState("");
  const [exp, setExp] = useState<Experience>("some");
  const [raceId, setRaceId] = useState(initialRaceId && upcoming.some((r) => r.id === initialRaceId) ? initialRaceId : "");
  const [q, setQ] = useState("");
  const race = upcoming.find((r) => r.id === raceId);
  const minutes = parseTime(time);
  const options = useMemo(() => upcoming.filter((r) => !q || (r.eventName + " " + r.city + " " + r.region).toLowerCase().includes(q.toLowerCase())).slice(0, 60), [upcoming, q]);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-start">
      <div className="card space-y-4">
        <div>
          <label>Twój czas na płaskim</label>
          <div className="mt-1 flex gap-2">
            <select value={refKm} onChange={(e) => setRefKm(Number(e.target.value) as FlatRef["km"])}>{REFS.map((r) => <option key={r.km} value={r.km}>{r.label}</option>)}</select>
            <input type="text" inputMode="numeric" placeholder={REFS.find((r) => r.km === refKm)?.example} value={time} onChange={(e) => setTime(e.target.value)} className="flex-1" />
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">Format mm:ss albo h:mm:ss. Najlepiej z ostatnich 3 miesięcy, z zawodów albo mocnego treningu.</p>
        </div>
        <div>
          <label>Doświadczenie w terenie</label>
          <div className="mt-1 grid gap-1">
            {([["zero", "Biegam tylko po asfalcie"], ["some", "Czasem las, park, pagórki"], ["regular", "Regularnie biegam w górach"]] as const).map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-sm font-normal cursor-pointer"><input type="radio" name="exp" checked={exp === v} onChange={() => setExp(v)} /> {l}</label>
            ))}
          </div>
        </div>
        <div>
          <label>Bieg</label>
          <input type="text" placeholder="szukaj: nazwa, miasto, pasmo" value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 w-full" />
          <select className="mt-2 w-full" value={raceId} onChange={(e) => setRaceId(e.target.value)} size={Math.min(8, Math.max(3, options.length))}>
            {options.map((r) => <option key={r.id} value={r.id}>{fmtDate(r.dateStart, r.dateEnd)}: {r.eventName} ({r.city})</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3 min-w-0">
        {!race || minutes === null ? (
          <div className="card text-[var(--muted)]">Wpisz czas i wybierz bieg, a policzymy szacowany czas na każdym dystansie i porównamy z limitem.</div>
        ) : (
          <>
            <h2 className="text-xl font-bold">{race.eventName} <span className="text-[var(--muted)] font-normal text-base">{fmtDate(race.dateStart, race.dateEnd)}, {race.city}</span></h2>
            {race.elevations.map((e) => {
              const p = predictMinutes({ km: refKm, minutes }, e.km, e.dplus, race.surface, exp);
              const limitM = e.limitH ? e.limitH * 60 : undefined;
              const margin = limitM ? limitM - p.high : undefined;
              const verdict = limitM === undefined ? "nolimit" : margin! >= 0 ? "ok" : limitM - p.minutes >= 0 ? "tight" : "no";
              const cls = verdict === "ok" ? "lvl-good" : verdict === "tight" ? "lvl-ok" : verdict === "no" ? "lvl-bad" : "";
              return (
                <div key={e.km} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{fmtKm(e.km)}{e.dplus ? `, +${e.dplus} m` : p.assumedDplus ? `, przewyższenie nieznane (zakładamy ok. +${p.assumedDplus} m)` : ""}</p>
                      <p className="text-2xl font-extrabold mt-1">{fmtH(p.minutes)}</p>
                      <p className="text-xs text-[var(--muted)]">realnie między {fmtH(p.low)} a {fmtH(p.high)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {limitM !== undefined ? <>
                        <p className="text-xs text-[var(--muted)]">limit {e.limitH} h</p>
                        <span className={`lvl ${cls}`}><span className="dot" />{verdict === "ok" ? "mieści się z zapasem" : verdict === "tight" ? "na styk" : "za mało czasu"}</span>
                        {verdict === "ok" && <p className="text-xs text-[var(--muted)] mt-1">zapas ok. {fmtH(margin!)}</p>}
                      </> : <p className="text-xs text-[var(--muted)]">limit czasu nieznany,<br />sprawdź w regulaminie</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-[var(--muted)]">Jak liczymy: czas z płaskiego przeliczony na dystans (wykładnik Riegela 1,06), każde 100 m przewyższenia liczone jak dodatkowy kilometr (jak w km-effort ITRA), mnożnik terenu (przełaj 1,05, trail 1,15, górski 1,25) i mnożnik doświadczenia w terenie. To szacunek na pierwszy start, nie plan na życiówkę. Limity pośrednie na punktach bywają ostrzejsze niż limit mety.</p>
            <p className="text-sm"><Link className="underline font-semibold text-[var(--moss)]" href={`/bieg/${race.id}`}>Strona biegu</Link>: regulamin, sprzęt obowiązkowy, mapa.</p>
          </>
        )}
      </div>
    </div>
  );
}
