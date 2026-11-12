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

/** jeden cennik = dystans + wariant (solo, sztafeta, w parze); bez wariantu sam dystans */
const groupKey = (f: Fee) => `${f.km ?? ""}|${f.label ?? ""}`;
const byDate = (a: Fee, b: Fee) => (a.until ?? "9999").localeCompare(b.until ?? "9999");
/** cenniki z regulaminu: grupy progów wg dystansu i wariantu, w kolejności dystansów */
function feeGroups(r: Race): Fee[][] {
  const m = new Map<string, Fee[]>();
  for (const f of r.info?.fees ?? []) m.set(groupKey(f), [...(m.get(groupKey(f)) ?? []), f]);
  return [...m.values()].map((g) => [...g].sort(byDate)).sort((a, b) => (a[0].km ?? Infinity) - (b[0].km ?? Infinity)); // opłaty bez dystansu (zniżki, biegi towarzyszące) na końcu
}
/** cennik nieregularny: dwa progi z tym samym terminem (warianty, których wyciąg nie rozróżnił) albo kwoty nie rosną z terminem; wtedy pokazujemy tylko "od X zł" */
const mixed = (g: Fee[]) => new Set(g.map((f) => f.until ?? "")).size < g.length || g.some((f, i) => i > 0 && f.pln < g[i - 1].pln);
/** najniższa kwota, która może dziś obowiązywać w nieregularnym cenniku; próg bez daty tańszy od wszystkich datowanych to pierwszy próg ze zgubioną datą, więc go pomijamy */
function lowestOpen(g: Fee[], today: string, past: boolean): number {
  const dated = g.filter((f) => f.until);
  const floor = dated.length ? Math.min(...dated.map((f) => f.pln)) : 0;
  const open = g.filter((f) => (f.until ? past || f.until >= today : f.pln >= floor));
  return Math.min(...(open.length ? open : g).map((f) => f.pln));
}

/** kwota obowiązująca dziś dla dystansu; undefined, gdy wszystkie progi minęły i nie ma progu bez daty */
export function currentFee(tiers: Fee[], today: string): Fee | undefined {
  return tiers.find((f) => !f.until || f.until >= today);
}

/** najniższa kwota obowiązująca dziś na jakimkolwiek dystansie (do offers.price i opisu) */
export function priceFrom(r: Race, today: string): number | undefined {
  if (!r.info?.fees?.length || r.info.stale) return undefined;
  const all = feeGroups(r);
  const groups = all.some((g) => g[0].km !== undefined) ? all.filter((g) => g[0].km !== undefined) : all; // "od X zł" liczymy z cenników dystansów, nie ze zniżek bez dystansu
  const now = groups.map((g) => (mixed(g) ? lowestOpen(g, today, false) : currentFee(g, today)?.pln)).filter((v): v is number => v !== undefined && isFinite(v));
  return now.length ? Math.min(...now) : undefined;
}

export const fmtPln = (v: number) => (v === 0 ? "bezpłatnie" : `${v} zł`);

/** opłata per dystans i wariant: "180 zł do 15.01, 200 zł do 28.02, potem 240 zł" plus kwota obowiązująca dziś; pary [dystans z wariantem albo "", opis] */
export function feeLines(r: Race, past: boolean, today: string): [string, string][] {
  const d = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
  return feeGroups(r).map((tiers) => {
    const { km, label } = tiers[0];
    const head = [km === undefined ? "" : fmtKm(km), label ?? ""].filter(Boolean).join(", ");
    if (mixed(tiers)) return [head, `od ${fmtPln(lowestOpen(tiers, today, past))} (progi i warianty w regulaminie)`];
    const now = past ? undefined : currentFee(tiers, today);
    const txt = tiers.length === 1 ? fmtPln(tiers[0].pln) : tiers.map((f, j) => (f.until ? `${fmtPln(f.pln)} do ${d(f.until)}` : `${j ? "potem " : ""}${fmtPln(f.pln)}`)).join(", ");
    return [head, now && tiers.length > 1 && !r.info?.stale ? `${txt} (dziś ${fmtPln(now.pln)})` : txt];
  });
}
