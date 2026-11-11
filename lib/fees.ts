/** Opłata startowa z progów cenowych regulaminu: kwota obowiązująca dziś (pierwszy próg z datą >= dziś albo próg bez daty). */
import type { Race } from "./types";
import { fmtKm } from "./format";

type Fee = NonNullable<NonNullable<Race["info"]>["fees"]>[number];

/** progi dla jednego dystansu (km) albo wspólne (km brak), posortowane wg daty, próg bez daty na końcu */
export function feeTiers(r: Race, km?: number): Fee[] {
  const fees = r.info?.fees ?? [];
  const sel = fees.filter((f) => (km === undefined ? true : f.km === undefined || Math.abs(f.km - km) <= Math.max(1.5, km * 0.06)));
  return [...sel].sort((a, b) => (a.until ?? "9999").localeCompare(b.until ?? "9999"));
}

/** kwota obowiązująca dziś dla dystansu; undefined, gdy wszystkie progi minęły i nie ma progu bez daty */
export function currentFee(tiers: Fee[], today: string): Fee | undefined {
  return tiers.find((f) => !f.until || f.until >= today);
}

/** najniższa kwota obowiązująca dziś na jakimkolwiek dystansie (do offers.price i opisu) */
export function priceFrom(r: Race, today: string): number | undefined {
  if (!r.info?.fees?.length || r.info.stale) return undefined;
  const kms = [...new Set(r.info.fees.map((f) => f.km))];
  const now = kms.map((k) => currentFee(feeTiers(r, k), today)?.pln).filter((v): v is number => v !== undefined);
  return now.length ? Math.min(...now) : undefined;
}

export const fmtPln = (v: number) => (v === 0 ? "bezpłatnie" : `${v} zł`);

/** opłata per dystans: "180 zł do 15.01, 200 zł do 28.02, potem 240 zł" plus kwota obowiązująca dziś; pary [dystans albo "", opis] */
export function feeLines(r: Race, past: boolean, today: string): [string, string][] {
  const fees = r.info?.fees ?? [];
  const kms = [...new Set(fees.map((f) => f.km))].sort((a, b) => (a ?? 0) - (b ?? 0));
  const d = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
  return kms.map((k) => {
    const tiers = feeTiers(r, k).filter((f) => f.km === k);
    const now = past ? undefined : currentFee(tiers, today);
    const txt = tiers.length === 1 ? fmtPln(tiers[0].pln) : tiers.map((f, j) => (f.until ? `${fmtPln(f.pln)} do ${d(f.until)}` : `${j ? "potem " : ""}${fmtPln(f.pln)}`)).join(", ");
    return [k === undefined ? "" : fmtKm(k), now && tiers.length > 1 && !r.info?.stale ? `${txt} (dziś ${fmtPln(now.pln)})` : txt];
  });
}
