/** DTO karty biegu: tylko to, czego potrzebują listy, filtry, mapa, kreator i kalkulator. Pełny Race zostaje na stronie biegu. */
import type { Race } from "./types";
import type { Signup } from "./zapisy";
import { geoFor } from "./geo";
import { priceFrom } from "./fees";

export type CardRace = {
  id: string; name: string; eventName: string; dateStart: string; dateEnd: string;
  city: string; region: string; surface: Race["surface"]; category?: string;
  distancesKm: number[]; minKm: number; maxKm: number; vertical?: boolean;
  elevations: { km: number; dplus?: number; approx?: boolean; limitH?: number }[];
  beginnerScore: number;
  signup?: Pick<Signup, "status" | "until" | "registered">;
  provisional?: boolean; spark?: number[]; gearN?: number; price?: number;
  poles?: boolean; dogs?: boolean; kids?: boolean;
  lat?: number; lng?: number; woj?: string;
};

const r1 = (v: number) => Math.round(v * 100) / 100;

export function toCard(r: Race, today: string): CardRace {
  const g = geoFor(r.city);
  const c: CardRace = {
    id: r.id, name: r.name, eventName: r.eventName, dateStart: r.dateStart, dateEnd: r.dateEnd,
    city: r.city, region: r.region, surface: r.surface, category: r.category,
    distancesKm: r.distancesKm, minKm: r.minKm, maxKm: r.maxKm, vertical: r.vertical || undefined,
    elevations: r.elevations.map((e) => ({ km: e.km, dplus: e.dplus, approx: e.approx || undefined, limitH: e.limitH })),
    beginnerScore: r.beginnerScore,
    signup: r.signup && r.signup.status !== "unknown" ? { status: r.signup.status, until: r.signup.until, registered: r.signup.registered } : undefined,
    provisional: r.provisional ? true : undefined, spark: r.spark?.map(r1), gearN: r.gear?.length || undefined, price: priceFrom(r, today),
    poles: r.info?.poles === "tak" || undefined, dogs: r.info?.dogs === "tak" || undefined, kids: r.info?.kids || undefined,
    lat: g?.lat, lng: g?.lng, woj: g?.woj,
  };
  // bez pól undefined: JSON w HTML ma być jak najkrótszy
  return JSON.parse(JSON.stringify(c));
}
