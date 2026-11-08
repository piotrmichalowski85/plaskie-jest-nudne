import dataset from "@/data/races.json";
import regInfo from "@/data/regulamin_info.json";
import type { Dataset, Race, RegInfo } from "./types";
import { niceName, expandAbbrev } from "./seo";

const ds = dataset as Dataset;
const info = regInfo as Record<string, RegInfo>;
export const generatedAt = ds.generatedAt;

/** dystans z regulaminu pasuje do dystansu biegu (nazwy dystansów bywają zaokrąglone: 140 vs 144 km) */
const sameKm = (a: number, b: number) => Math.abs(a - b) <= Math.max(1.5, b * 0.06);

/** nakłada szerszy wyciąg z regulaminu (scripts/regulamin_llm.ts): limity uzupełniają brakujące, reszta trafia do r.info */
function withInfo(r: Race): Race {
  const x = r.regulaminUrl ? info[r.regulaminUrl] : undefined;
  if (!x) return r;
  const { limits, at: _at, ...rest } = x;
  void _at;
  const stale = x.year !== undefined && String(x.year) !== r.dateStart.slice(0, 4);
  const elevations = limits?.length ? r.elevations.map((e) => {
    if (e.limitH) return e;
    const l = limits.find((y) => sameKm(y.km, e.km));
    return l && l.limitH / e.km <= 1.2 ? { ...e, limitH: l.limitH } : e;
  }) : r.elevations;
  const hasMore = Object.keys(rest).some((k) => k !== "year");
  return { ...r, elevations, ...(hasMore ? { info: { ...rest, ...(stale ? { stale } : {}) } } : {}) };
}

export const allRaces: Race[] = ds.races.map((r) => withInfo({ ...r, eventName: expandAbbrev(niceName(r.eventName), r.name), name: niceName(r.name) }));
export const today = () => new Date().toISOString().slice(0, 10);
export const upcomingRaces = () => allRaces.filter((r) => r.dateEnd >= today());
export const raceById = (id: string) => allRaces.find((r) => r.id === id);
export const regions = () => [...new Set(allRaces.map((r) => r.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"));
