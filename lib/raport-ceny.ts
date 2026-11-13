/**
 * Raport "Ile kosztuje bieg górski i trailowy w Polsce": liczby z zamrożonego, ręcznie zweryfikowanego zbioru data/raport_ceny.json.
 * Te same funkcje liczą stronę /raporty/ile-kosztuje-bieg-gorski, plik CSV i wydruk scripts/raport_ceny.ts, więc liczby nie mogą się rozjechać.
 * Zbiór składa scripts/raport_ceny/zbuduj_zbior.py po weryfikacji regulaminów (scripts/raport_ceny/README.md). Kalendarz (races.json) się zmienia, zbiór raportu nie.
 */
import raw from "@/data/raport_ceny.json";

export type Tier = { pln: number; until?: string; limitPlaces?: number; onsite?: boolean };
export type Rec = {
  raceId: string; event: string; route: string; km: number; kmSource: string; editionYear: number; raceDate: string;
  city: string; region: string | null; woj: string | null; tiers: Tier[]; regulaminUrl: string; readAt: string; check: string; quote: string; note?: string; previousEdition?: boolean;
};
export type ReportData = {
  title: string; generatedAt: string; season: number[]; readFrom: string; readTo: string; rules: string[]; license: string; records: Rec[];
  counts: { records: number; events: number; regulaminy: number; regulaminyChecked: number; autoRowsChecked: number; autoRowsOk: number; autoRowsWrong: number; autoRowsOutOfScope: number; autoRowsNotInText: number; pricelistsRead: number; pricelistsDropped: number };
};
export const report = raw as ReportData;

/** minimalna liczba imprez w grupie (województwo), żeby pokazać jej liczby */
export const MIN_EVENTS = 8;

export const BUCKETS = [
  { id: "do-12", label: "do 12 km", from: 0, to: 13 },
  { id: "13-25", label: "13-25 km", from: 13, to: 26 },
  { id: "26-45", label: "26-45 km", from: 26, to: 46 },
  { id: "46-80", label: "46-80 km", from: 46, to: 81 },
  { id: "ponad-80", label: "ponad 80 km", from: 81, to: Infinity },
] as const;
export type BucketId = (typeof BUCKETS)[number]["id"];
export const bucketOf = (km: number) => BUCKETS.find((b) => km >= b.from && km < b.to)!;

/** progi zapisów internetowych (bez opłaty płatnej dopiero w biurze zawodów), w kolejności terminów */
export const online = (r: Rec) => r.tiers.filter((t) => !t.onsite);
/** cena w pierwszym (najtańszym) progu zapisów */
export const first = (r: Rec) => online(r)[0].pln;
/** cena w ostatnim progu zapisów internetowych */
export const last = (r: Rec) => online(r)[online(r).length - 1].pln;
/** opłata w biurze zawodów, jeśli regulamin ją podaje */
export const onsite = (r: Rec) => r.tiers.find((t) => t.onsite)?.pln;
/** o ile procent ostatni próg internetowy jest droższy od pierwszego; undefined przy jednej cenie albo biegu bezpłatnym */
export const risePct = (r: Rec) => (online(r).length > 1 && first(r) > 0 ? ((last(r) - first(r)) / first(r)) * 100 : undefined);
/** ile dni przed startem kończy się pierwszy próg; undefined, gdy cennik ma jedną cenę albo pierwszy próg nie ma daty */
export function daysBefore(r: Rec): number | undefined {
  const t = online(r)[0];
  if (r.tiers.length < 2 || !t.until) return undefined;
  return Math.round((Date.parse(r.raceDate) - Date.parse(t.until)) / 86400000);
}

/** kwantyl metodą interpolacji liniowej (jak w arkuszach: PERCENTYL); mediana = q(0.5) */
export function quantile(xs: number[], q: number): number {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export const median = (xs: number[]) => quantile(xs, 0.5);
const defined = <T,>(v: T | undefined): v is T => v !== undefined;

export type Summary = { n: number; median: number; min: number; max: number; q1: number; q3: number };
export const summary = (xs: number[]): Summary => ({ n: xs.length, median: median(xs), min: Math.min(...xs), max: Math.max(...xs), q1: quantile(xs, 0.25), q3: quantile(xs, 0.75) });

export type BucketStats = {
  id: BucketId; label: string; n: number; events: number;
  first: Summary; last: Summary; perKmFirst: Summary; perKmLast: Summary;
  rise: Summary; riseZl: Summary; days: Summary;
  cheapest: Rec[]; priciest: Rec[];
};

function bucketStats(b: (typeof BUCKETS)[number], rs: Rec[]): BucketStats {
  const paid = rs.filter((r) => first(r) > 0);
  const tiered = rs.filter((r) => risePct(r) !== undefined);
  const byFirst = [...rs].sort((a, c) => first(a) - first(c) || a.km - c.km);
  return {
    id: b.id, label: b.label, n: rs.length, events: new Set(rs.map((r) => r.raceId)).size,
    first: summary(rs.map(first)), last: summary(rs.map(last)),
    perKmFirst: summary(paid.map((r) => first(r) / r.km)), perKmLast: summary(paid.map((r) => last(r) / r.km)),
    rise: summary(tiered.map((r) => risePct(r)!)), riseZl: summary(tiered.map((r) => last(r) - first(r))),
    days: summary(rs.map(daysBefore).filter(defined)),
    cheapest: byFirst.slice(0, 3), priciest: byFirst.slice(-3).reverse(),
  };
}

export type Stats = ReturnType<typeof computeStats>;
export function computeStats(d: ReportData = report) {
  const rs = d.records;
  const buckets = BUCKETS.map((b) => bucketStats(b, rs.filter((r) => bucketOf(r.km).id === b.id)));
  const tiered = rs.filter((r) => risePct(r) !== undefined);
  const withOnsite = rs.filter((r) => onsite(r) !== undefined && first(r) > 0);
  const days = rs.map(daysBefore).filter(defined);
  const tiersCount = rs.map((r) => online(r).length);
  // województwa: grupa pokazywana od MIN_EVENTS imprez; porównujemy cenę za kilometr w pierwszym progu i medianę w przedziałach, w których województwo ma co najmniej MIN_EVENTS cenników
  const wojNames = [...new Set(rs.map((r) => r.woj).filter((w): w is string => !!w))].sort((a, b) => a.localeCompare(b, "pl"));
  const woj = wojNames.map((w) => {
    const g = rs.filter((r) => r.woj === w);
    return {
      woj: w, n: g.length, events: new Set(g.map((r) => r.raceId)).size, perKmFirst: summary(g.filter((r) => first(r) > 0).map((r) => first(r) / r.km)),
      buckets: BUCKETS.map((b) => { const x = g.filter((r) => bucketOf(r.km).id === b.id); return { id: b.id, label: b.label, n: x.length, first: x.length >= MIN_EVENTS ? summary(x.map(first)) : undefined }; }),
    };
  });
  return {
    n: rs.length, events: new Set(rs.map((r) => r.raceId)).size, regulaminy: new Set(rs.map((r) => r.regulaminUrl)).size,
    byYear: d.season.map((y) => ({ year: y, n: rs.filter((r) => r.editionYear === y).length })),
    buckets,
    rise: summary(tiered.map((r) => risePct(r)!)), riseZl: summary(tiered.map((r) => last(r) - first(r))), nTiered: tiered.length, nSinglePrice: rs.length - tiered.length,
    onsiteRise: summary(withOnsite.map((r) => ((onsite(r)! - first(r)) / first(r)) * 100)), onsiteVsLast: summary(withOnsite.map((r) => onsite(r)! - last(r))),
    days: summary(days), tiersCount: summary(tiersCount),
    woj: woj.filter((w) => w.events >= MIN_EVENTS), wojSkipped: woj.filter((w) => w.events < MIN_EVENTS).map((w) => ({ woj: w.woj, events: w.events })),
  };
}

/** zaokrąglenia do tekstu: złotówki bez groszy, zł/km z jednym miejscem po przecinku, procenty bez miejsc */
export const zl = (v: number) => `${Math.round(v).toLocaleString("pl-PL")} zł`;
export const zlKm = (v: number) => `${v.toFixed(1).replace(".", ",")} zł`;
export const pct = (v: number) => `${Math.round(v)}%`;
export const kmTxt = (v: number) => `${String(Math.round(v * 10) / 10).replace(".", ",")} km`;

/** plik CSV z całym zbiorem: jeden wiersz na cennik (bieg i dystans) */
export function toCsv(d: ReportData = report): string {
  const esc = (v: string | number | undefined | null) => { const s = v === undefined || v === null ? "" : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = ["impreza", "trasa", "km", "przedzial", "edycja", "data_startu", "miejscowosc", "wojewodztwo", "cena_pierwszy_prog_zl", "pierwszy_prog_do", "cena_ostatni_prog_online_zl", "cena_biuro_zawodow_zl", "liczba_progow_online", "wzrost_proc", "dni_przed_startem_koniec_pierwszego_progu", "zl_za_km_pierwszy_prog", "progi", "regulamin", "data_odczytu", "weryfikacja"];
  const rows = d.records.map((r) => {
    const rp = risePct(r), db = daysBefore(r);
    return [r.event, r.route, r.km, bucketOf(r.km).label, r.editionYear, r.raceDate, r.city, r.woj, first(r), online(r)[0].until, last(r), onsite(r), online(r).length, rp === undefined ? "" : rp.toFixed(1), db, first(r) > 0 ? (first(r) / r.km).toFixed(2) : "",
      r.tiers.map((t) => `${t.pln}${t.onsite ? " (biuro zawodów)" : t.until ? ` do ${t.until}` : ""}${t.limitPlaces ? ` (limit ${t.limitPlaces} miejsc)` : ""}`).join(" | "), r.regulaminUrl, r.readAt, r.check].map(esc).join(",");
  });
  return [head.join(","), ...rows].join("\n") + "\n";
}
