"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Race } from "@/lib/types";
import { predictMinutes, fmtH, type FlatRef, type Experience } from "@/lib/predict";
import { fmtDate, fmtKm, dayNum, monthShort } from "@/lib/format";

const REFS: { km: FlatRef["km"]; label: string; example: string }[] = [
  { km: 5, label: "5 km", example: "28:00" }, { km: 10, label: "10 km", example: "58:00" },
  { km: 21.1, label: "półmaraton", example: "2:05:00" }, { km: 42.2, label: "maraton", example: "4:20:00" },
];
const EXPS: [Experience, string][] = [["zero", "Tylko asfalt"], ["some", "Czasem las i pagórki"], ["regular", "Regularnie w górach"]];
const parseTime = (s: string): number | null => { const p = s.trim().split(":").map(Number); if (!s.trim() || p.some((x) => isNaN(x))) return null; if (p.length === 2) return p[0] + p[1] / 60; if (p.length === 3) return p[0] * 60 + p[1] + p[2] / 60; return null; };
const hm = (m: number) => `${Math.floor(m / 60)}:${String(Math.round(m % 60)).padStart(2, "0")}`;

export function CzyDamRade({ races, today, initialRaceId }: { races: Race[]; today: string; initialRaceId?: string }) {
  const upcoming = useMemo(() => races.filter((r) => r.dateEnd >= today && r.distancesKm.length), [races, today]);
  const [refKm, setRefKm] = useState<FlatRef["km"]>(10);
  const [time, setTime] = useState("");
  const [exp, setExp] = useState<Experience>("some");
  const [raceId, setRaceId] = useState(initialRaceId && upcoming.some((r) => r.id === initialRaceId) ? initialRaceId : "");
  const [q, setQ] = useState("");
  const race = upcoming.find((r) => r.id === raceId);
  const minutes = parseTime(time);
  const options = useMemo(() => upcoming.filter((r) => !q || (r.eventName + " " + r.city + " " + r.region).toLowerCase().includes(q.toLowerCase())).slice(0, 40), [upcoming, q]);
  const example = REFS.find((r) => r.km === refKm)!.example;
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => { const el = listRef.current?.querySelector(".pick.on"); if (el && initialRaceId) el.scrollIntoView({ block: "center" }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start">
      <div className="card p-5 space-y-6">
        <div>
          <p className="step">1 · Twój czas na płaskim</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{REFS.map((r) => <button key={r.km} type="button" className={`qchip ${refKm === r.km ? "on" : ""}`} onClick={() => setRefKm(r.km)}>{r.label}</button>)}</div>
          <input type="text" inputMode="numeric" placeholder={`np. ${example}`} value={time} onChange={(e) => setTime(e.target.value)} aria-label="Czas na płaskim" className="bigtime mt-3 w-full" />
          <p className="mt-1.5 text-xs text-[var(--muted)]">Format mm:ss albo h:mm:ss. Najlepiej z ostatnich 3 miesięcy, z zawodów albo mocnego treningu.</p>
        </div>
        <div>
          <p className="step">2 · Ile biegasz w terenie</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{EXPS.map(([v, l]) => <button key={v} type="button" className={`qchip ${exp === v ? "on" : ""}`} onClick={() => setExp(v)}>{l}</button>)}</div>
        </div>
        <div>
          <p className="step">3 · Bieg</p>
          <input type="text" placeholder="szukaj: nazwa, miasto, pasmo" value={q} onChange={(e) => setQ(e.target.value)} className="mt-2 w-full" />
          <ul ref={listRef} className="picklist mt-2" role="listbox" aria-label="Wybierz bieg">
            {options.length === 0 && <li className="px-3 py-3 text-sm text-[var(--muted)]">Nic nie pasuje. Spróbuj innej nazwy albo miasta.</li>}
            {options.map((r) => (
              <li key={r.id}>
                <button type="button" role="option" aria-selected={r.id === raceId} className={`pick ${r.id === raceId ? "on" : ""}`} onClick={() => setRaceId(r.id)}>
                  <span className="pick-d">{dayNum(r.dateStart)} {monthShort(r.dateStart)}</span>
                  <span className="min-w-0"><span className="block font-semibold truncate">{r.eventName}</span><span className="block text-xs opacity-75 truncate">{r.city}{r.region ? `, ${r.region}` : ""} · {r.distancesKm.length > 3 ? `${fmtKm(r.minKm)} - ${fmtKm(r.maxKm)}` : r.distancesKm.map(fmtKm).join(" / ")}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="min-w-0">
        {!race || minutes === null ? (
          <div className="empty">
            <p className="display text-[2.4rem] leading-none text-[var(--ink)]">{!race && minutes === null ? "Czas i bieg" : !race ? "Wybierz bieg" : "Wpisz czas"}</p>
            <p className="mt-2 text-[var(--muted)] max-w-[28rem]">{!race && minutes === null ? "Wpisz czas z płaskiego i wybierz bieg z listy. Policzymy szacowany czas na każdym dystansie i porównamy z limitem organizatora." : !race ? `Czas ${time.trim()} z dystansu ${REFS.find((r) => r.km === refKm)!.label} zapisany. Teraz wybierz bieg z listy.` : `Wybrany bieg: ${race.eventName}. Wpisz jeszcze czas z płaskiego w kroku 1.`}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <header>
              <p className="text-sm font-semibold text-[var(--muted)]">{fmtDate(race.dateStart, race.dateEnd)} · {race.city}{race.region ? `, ${race.region}` : ""}</p>
              <h2 className="text-[2.2rem] sm:text-[2.8rem]">{race.eventName}</h2>
            </header>
            {race.elevations.map((e) => {
              const p = predictMinutes({ km: refKm, minutes }, e.km, e.dplus, race.surface, exp);
              const limitM = e.limitH ? e.limitH * 60 : undefined;
              const margin = limitM ? limitM - p.high : undefined;
              const verdict = limitM === undefined ? "nolimit" : margin! >= 0 ? "ok" : limitM - p.minutes >= 0 ? "tight" : "no";
              const cls = verdict === "ok" ? "lvl-good" : verdict === "tight" ? "lvl-ok" : verdict === "no" ? "lvl-bad" : "";
              const scale = Math.max(limitM ?? 0, p.high) * 1.08;
              const pct = (m: number) => `${Math.min(100, (m / scale) * 100).toFixed(1)}%`;
              return (
                <div key={e.km} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="display text-[1.6rem] leading-none text-[var(--muted)]">{fmtKm(e.km)}{e.dplus ? ` · +${e.dplus} m` : ""}</p>
                      <p className="display text-[3.4rem] leading-none mt-2 text-[var(--ink)]">{hm(p.minutes)}<span className="text-[1.2rem] text-[var(--muted)] ml-2 tracking-wider">H</span></p>
                      <p className="text-xs text-[var(--muted)] mt-1">realnie między {fmtH(p.low)} a {fmtH(p.high)}{!e.dplus && p.assumedDplus ? `; przewyższenie nieznane, zakładamy ok. +${p.assumedDplus} m` : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {limitM !== undefined ? <>
                        <span className={`lvl ${cls}`}><span className="dot" />{verdict === "ok" ? "z zapasem" : verdict === "tight" ? "na styk" : "za mało czasu"}</span>
                        <p className="text-xs text-[var(--muted)] mt-1.5">limit {e.limitH} h{verdict === "ok" ? `, zapas ok. ${fmtH(margin!)}` : ""}</p>
                      </> : <span className="lvl bg-[#eef2ec] text-[var(--moss-dark)]">limit nieznany</span>}
                    </div>
                  </div>
                  <div className="bar mt-4" aria-hidden>
                    <span className="bar-range" style={{ left: pct(p.low), width: `calc(${pct(p.high)} - ${pct(p.low)})` }} />
                    <span className="bar-fill" style={{ width: pct(p.minutes) }} />
                    {limitM !== undefined && <span className="bar-limit" style={{ left: pct(limitM) }}><i>limit</i></span>}
                  </div>
                  {limitM === undefined && <p className="text-xs text-[var(--muted)] mt-2">Organizator nie podał limitu albo nie znaleźliśmy go w regulaminie. Sprawdź limity pośrednie na punktach, bywają ostrzejsze niż na mecie.</p>}
                </div>
              );
            })}
            <p className="text-xs text-[var(--muted)]">Jak liczymy: czas z płaskiego przeliczony na dystans (wykładnik Riegela 1,06), każde 100 m przewyższenia liczone jak dodatkowy kilometr (jak w km-effort ITRA), mnożnik terenu (przełaj 1,05, trail 1,15, górski 1,25) i mnożnik doświadczenia w terenie. To szacunek na pierwszy start, nie plan na życiówkę.</p>
            <p className="text-sm"><Link className="btn btn-ghost" href={`/bieg/${race.id}`}>Strona biegu: regulamin, sprzęt, mapa</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
