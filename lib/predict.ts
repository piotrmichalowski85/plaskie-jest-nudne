import type { Race } from "./types";

export type FlatRef = { km: 5 | 10 | 21.1 | 42.2; minutes: number };
export type Experience = "zero" | "some" | "regular";

/** Szacunek czasu na dystansie górskim z czasu na płaskim. Model jawny i prosty, do pokazania użytkownikowi:
 *  1) Riegel: czas rośnie z dystansem szybciej niż liniowo (wykładnik 1,06);
 *  2) km-effort (jak ITRA): każde 100 m przewyższenia liczy się jak dodatkowy kilometr;
 *  3) mnożnik terenu: przełaj 1,05, trail 1,15, górski 1,25;
 *  4) mnożnik doświadczenia w terenie: brak 1,15, trochę 1,07, regularnie 1,0. */
export function predictMinutes(ref: FlatRef, km: number, dplus: number | undefined, surface: Race["surface"], exp: Experience): { minutes: number; low: number; high: number; assumedDplus?: number } {
  const flatAtKm = ref.minutes * Math.pow(km / ref.km, 1.06);
  const pace = flatAtKm / km; // min/km na płaskim dla tego dystansu
  const assumed = dplus === undefined ? Math.round(km * (surface === "gorski" ? 60 : surface === "trail" ? 35 : 15)) : undefined;
  const d = dplus ?? assumed ?? 0;
  const effortKm = km + d / 100;
  const terrain = surface === "gorski" ? 1.25 : surface === "trail" ? 1.15 : 1.05;
  const experience = exp === "zero" ? 1.15 : exp === "some" ? 1.07 : 1.0;
  const minutes = pace * effortKm * terrain * experience;
  return { minutes: Math.round(minutes), low: Math.round(minutes * 0.9), high: Math.round(minutes * 1.15), assumedDplus: assumed };
}

export const fmtH = (m: number) => `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, "0")} min`;
