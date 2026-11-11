/** "Moje biegi": wspólne stałe i walidacja listy identyfikatorów (przeglądarka, link do udostępnienia, eksport .ics). */

/** parametr adresu z listą biegów: /moje?b=<id>,<id> oraz /moje.ics?b=<id>,<id> */
export const SHARE_PARAM = "b";
/** górna granica listy: adres z identyfikatorami musi się zmieścić w linku i w zapytaniu o plik .ics */
export const MAX_SAVED = 60;

const ID_RE = /^[a-z0-9-]{1,120}$/;

/** tylko poprawne identyfikatory biegów, bez powtórzeń, najwyżej MAX_SAVED */
export function cleanIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === "string" && ID_RE.test(x)))].slice(0, MAX_SAVED);
}

/** lista z parametru adresu ("a,b,c") */
export const idsFromParam = (v: string | null | undefined): string[] => cleanIds((v ?? "").split(","));

export const sharePath = (ids: string[]) => `/moje?${SHARE_PARAM}=${ids.join(",")}`;
export const icsPath = (ids: string[]) => `/moje.ics?${SHARE_PARAM}=${ids.join(",")}`;
