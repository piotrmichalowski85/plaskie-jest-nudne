import dataset from "@/data/races.json";
import regInfo from "@/data/regulamin_info.json";
import regFit from "@/data/regulamin_fit.json";
import type { Dataset, Race, RegInfo } from "./types";
import { niceName, expandAbbrev } from "./seo";

const ds = dataset as Dataset;
const info = regInfo as Record<string, RegInfo>;
const fit = regFit as Record<string, { url: string; fit: boolean }>;
export const generatedAt = ds.generatedAt;

/** dystans z regulaminu pasuje do dystansu biegu (nazwy dystansów bywają zaokrąglone: 140 vs 144 km) */
const sameKm = (a: number, b: number) => Math.abs(a - b) <= Math.max(1.5, b * 0.06);

/**
 * Bramka regulaminu: robot potrafi przypisać biegowi regulamin innej imprezy tego samego organizatora (12.11.2026: 40 ze 101 par).
 * Regulamin liczy się dopiero po potwierdzeniu w data/regulamin_fit.json (scripts/regulamin_fit.ts), że dotyczy tego biegu i tego adresu.
 * Brak wpisu albo fit === false: zdejmujemy wszystko, co z niego pochodzi (link, źródło, sprzęt, zapisy z regulaminu), a wyciąg się nie nakłada.
 */
function regulaminOk(r: Race): boolean {
  const v = fit[r.id];
  return !!r.regulaminUrl && v?.url === r.regulaminUrl && v.fit === true;
}
function withoutRegulamin(r: Race): Race {
  const { regulaminUrl: _u, gear: _g, ...rest } = r;
  void _u; void _g;
  return { ...rest, sources: r.sources.filter((s) => s.name !== "regulamin"), ...(r.signup && (r.signup.source === "regulamin" || r.signup.sourceUrl === r.regulaminUrl) ? { signup: undefined } : {}) };
}

/** nakłada szerszy wyciąg z regulaminu (scripts/regulamin_llm.ts): limity uzupełniają brakujące, reszta trafia do r.info */
function withInfo(r: Race): Race {
  if (r.regulaminUrl && !regulaminOk(r)) return withoutRegulamin(r);
  const x = r.regulaminUrl ? info[r.regulaminUrl] : undefined;
  if (!x) return r;
  const { limits, at: _at, ...rest } = x;
  void _at;
  // regulamin innej edycji: rok z wyciągu różni się od roku biegu albo (gdy wyciąg nie ma roku) ostatni termin opłaty kończy się ponad 240 dni przed startem.
  // Wtedy opłaty i godziny są pokazywane jako dane tamtej edycji (strona biegu), cena "od" znika (lib/fees.ts), a termin zapisów wzięty z regulaminu nie jest pokazywany
  const lastUntil = (x.fees ?? []).map((f) => f.until ?? "").sort().pop() || "";
  const byDates = x.year === undefined && !!lastUntil && (Date.parse(r.dateStart) - Date.parse(lastUntil)) / 86400000 > 240;
  const stale = (x.year !== undefined && String(x.year) !== r.dateStart.slice(0, 4)) || byDates;
  const elevations = limits?.length ? r.elevations.map((e) => {
    if (e.limitH) return e;
    const l = limits.find((y) => sameKm(y.km, e.km));
    return l && l.limitH / e.km <= 1.2 ? { ...e, limitH: l.limitH } : e;
  }) : r.elevations;
  // wspólny regulamin festiwalu przy rekordzie jednego biegu: zostają wiersze dla dystansów tego biegu (i bez dystansu).
  // Tniemy tylko wtedy, gdy każdy dystans biegu ma swój wiersz; inaczej organizator nazywa dystanse inaczej niż kalendarz i zostaje wszystko
  const mine = <T extends { km?: number }>(rows?: T[]) => {
    if (!rows?.length || !r.distancesKm.length) return rows;
    const covered = r.distancesKm.every((d) => rows.some((x) => x.km !== undefined && sameKm(x.km, d)));
    return covered ? rows.filter((x) => x.km === undefined || r.distancesKm.some((d) => sameKm(x.km!, d))) : rows;
  };
  // regulamin cyklu (np. X-RUN: sześć imprez w jednym tekście): etykiety cenników to nazwy imprez. Zostają wiersze tej imprezy,
  // której wyróżniające słowo (takie, którego nie ma w innych etykietach) stoi w nazwie albo miejscowości biegu; etykieta wtedy znika, bo jest nazwą tego biegu
  if (rest.fees) {
    const plain = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
    const labels = [...new Set(rest.fees.filter((f) => !f.kind && f.label).map((f) => f.label!))];
    const words = (l: string) => plain(l).split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
    const hay = plain(`${r.name} ${r.eventName} ${r.city}`);
    const own = labels.filter((l) => words(l).some((w) => hay.includes(w) && !labels.some((o) => o !== l && words(o).includes(w))));
    if (labels.length > 1 && own.length === 1) rest.fees = rest.fees.filter((f) => !f.label || f.label === own[0]).map((f) => (f.label === own[0] ? { ...f, label: undefined } : f));
  }
  // regulamin kilku imprez bez pewnych etykiet: cennik, którego ostatni termin wypada po tym biegu, należy do późniejszej imprezy cyklu,
  // a gdy do jednego dystansu pasuje kilka cenników, zostaje ten z terminami najbliżej biegu. Nie dotyczy regulaminu innej edycji (tam terminy z definicji się nie zgadzają)
  if (rest.fees && !stale) {
    const gk = (f: { km?: number; kind?: string; label?: string }) => `${f.km ?? ""}|${f.kind ?? ""}|${f.label ?? ""}`;
    const lastOf = new Map<string, string>();
    for (const f of rest.fees) if (f.until && f.until > (lastOf.get(gk(f)) ?? "")) lastOf.set(gk(f), f.until);
    const limit = new Date(Date.parse(r.dateEnd) + 3 * 86400000).toISOString().slice(0, 10);
    const kept = rest.fees.filter((f) => (lastOf.get(gk(f)) ?? "") <= limit);
    const perKm = r.distancesKm.map((d) => [...new Set(kept.filter((f) => !f.kind && f.km !== undefined && sameKm(f.km, d)).map(gk))]);
    const multi = kept.length < rest.fees.length || perKm.some((keys) => new Set(keys.map((k) => lastOf.get(k) ?? "")).size > 1);
    if (kept.length && multi) {
      const drop = new Set<string>();
      // cenniki kończące się ponad 3 tygodnie przed najpóźniejszym to wcześniejsze imprezy cyklu
      const latest = [...new Set(kept.map(gk))].map((k) => lastOf.get(k) ?? "").sort().pop() ?? "";
      const early = latest ? new Date(Date.parse(latest) - 21 * 86400000).toISOString().slice(0, 10) : "";
      for (const k of new Set(kept.map(gk))) if (lastOf.get(k) && lastOf.get(k)! < early) drop.add(k);
      for (const keys of perKm) {
        const best = keys.filter((k) => !drop.has(k)).map((k) => lastOf.get(k) ?? "").sort().pop() ?? "";
        for (const k of keys) if ((lastOf.get(k) ?? "") < best) drop.add(k);
      }
      rest.fees = kept.filter((f) => !drop.has(gk(f)));
    }
  }
  if (rest.fees) rest.fees = mine(rest.fees);
  if (rest.startTimes) rest.startTimes = mine(rest.startTimes);
  const hasMore = Object.keys(rest).some((k) => k !== "year");
  const oldSignup = stale && r.signup && (r.signup.source === "regulamin" || r.signup.sourceUrl === r.regulaminUrl);
  return { ...r, elevations, ...(oldSignup ? { signup: undefined } : {}), ...(hasMore ? { info: { ...rest, ...(stale ? { stale, year: rest.year ?? Number(lastUntil.slice(0, 4)) } : {}) } } : {}) };
}

/** nazwa imprezy do wyświetlenia; gdy źródło podaje sam skrót cyklu ("X-RUN" przy sześciu biegach roku), bierzemy pierwszy człon pełnej nazwy ("X-RUN - Tajemnicze Kopce") */
function displayEvent(r: Race): string {
  const ev = expandAbbrev(niceName(r.eventName), r.name);
  const full = niceName(r.name).split(": ")[0].trim();
  return ev.length <= 6 && full.length > ev.length && full.length <= 60 ? full : ev;
}
export const allRaces: Race[] = ds.races.map((r) => withInfo({ ...r, eventName: displayEvent(r), name: niceName(r.name) }));
export const today = () => new Date().toISOString().slice(0, 10);
export const upcomingRaces = () => allRaces.filter((r) => r.dateEnd >= today());
export const raceById = (id: string) => allRaces.find((r) => r.id === id);
export const regions = () => [...new Set(allRaces.map((r) => r.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"));
