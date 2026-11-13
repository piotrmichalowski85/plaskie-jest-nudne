/** Dane do pobrania (JSON, CSV), kanał RSS i llms.txt: jedno miejsce z opisem zbioru, licencją i mapowaniem biegu na rekord publiczny. */
import reports from "@/data/zmiany.json";
import { allRaces, generatedAt, today, upcomingRaces } from "./data";
import { scoreLabel } from "./format";
import { priceFrom } from "./fees";
import type { Race } from "./types";

export const BASE = "https://plaskiejestnudne.pl";
export const DATASET = {
  name: "Kalendarz biegów górskich i trailowych w Polsce",
  description: "Nadchodzące biegi górskie, trailowe i przełajowe w Polsce: termin, miejsce, dystanse, przewyższenia, limity czasu, status zapisów i ocena dla początkujących. Fakty zebrane ze stron organizatorów, regulaminów i kalendarzy.",
  license: "https://creativecommons.org/licenses/by/4.0/deed.pl",
  licenseName: "CC BY 4.0",
  attribution: "Źródło: plaskiejestnudne.pl",
};

export type OpenRace = {
  id: string; url: string; name: string; dateStart: string; dateEnd: string; city: string; region: string; voivodeship?: string;
  distances: { km: number; elevationGainM?: number; timeLimitH?: number }[];
  beginnerRating: string; beginnerScore: number; signup?: string; signupUntil?: string; priceFromPln?: number;
  organizerUrl?: string; rulesUrl?: string; provisional?: boolean;
};

export function openRace(r: Race, t: string): OpenRace {
  return {
    id: r.id, url: `${BASE}/bieg/${r.id}`, name: r.eventName, dateStart: r.dateStart, dateEnd: r.dateEnd, city: r.city, region: r.region, ...(r.voivodeship ? { voivodeship: r.voivodeship } : {}),
    distances: r.elevations.map((e) => ({ km: e.km, ...(e.dplus ? { elevationGainM: e.dplus } : {}), ...(e.limitH ? { timeLimitH: e.limitH } : {}) })),
    beginnerRating: scoreLabel(r.beginnerScore), beginnerScore: r.beginnerScore,
    ...(r.signup && r.signup.status !== "unknown" ? { signup: r.signup.status === "open" ? "otwarte" : "zamknięte" } : {}), ...(r.signup?.until ? { signupUntil: r.signup.until } : {}),
    ...(priceFrom(r, t) !== undefined ? { priceFromPln: priceFrom(r, t) } : {}),
    ...(r.url ? { organizerUrl: r.url } : {}), ...(r.regulaminUrl ? { rulesUrl: r.regulaminUrl } : {}), ...(r.provisional ? { provisional: true } : {}),
  };
}
export const openRaces = () => { const t = today(); return upcomingRaces().sort((a, b) => a.dateStart.localeCompare(b.dateStart)).map((r) => openRace(r, t)); };
export const openMeta = () => ({ ...DATASET, generatedAt, count: upcomingRaces().length, source: BASE, documentation: `${BASE}/o-serwisie#dane` });

/** wpisy kanału RSS: nowe biegi z raportów zmian z ostatnich 60 dni, najnowsze pierwsze, bez powtórek */
export function feedItems() {
  const byId = new Map(allRaces.map((r) => [r.id, r]));
  const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const seen = new Set<string>();
  const out: { race: Race; date: string }[] = [];
  for (const rep of reports as { date: string; added: { id: string }[] }[]) {
    if (rep.date < since) continue;
    for (const a of rep.added) { const r = byId.get(a.id); if (r && !seen.has(r.id)) { seen.add(r.id); out.push({ race: r, date: rep.date }); } }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);
}
