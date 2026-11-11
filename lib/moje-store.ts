/** "Moje biegi" w przeglądarce: lista identyfikatorów w localStorage (bez konta, nic nie idzie na serwer). */
import { useSyncExternalStore } from "react";
import { cleanIds, MAX_SAVED } from "./moje";

const KEY = "pjn-moje"; // JSON: tablica identyfikatorów biegów w kolejności zapisywania
const EVT = "pjn-moje";
const EMPTY: string[] = [];

// migawka musi być tą samą tablicą, dopóki treść się nie zmieni (wymóg useSyncExternalStore)
let cacheRaw: string | null | undefined;
let cacheIds: string[] = EMPTY;
let memOnly = false; // prywatne okno bez localStorage: lista żyje do zamknięcia karty

function read(): string[] {
  if (memOnly) return cacheIds;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { memOnly = true; return cacheIds; }
  if (raw === cacheRaw) return cacheIds;
  cacheRaw = raw;
  try { cacheIds = raw ? cleanIds(JSON.parse(raw)) : EMPTY; } catch { cacheIds = EMPTY; }
  return cacheIds;
}

function write(ids: string[]) {
  const raw = JSON.stringify(ids);
  try { window.localStorage.setItem(KEY, raw); } catch { memOnly = true; }
  cacheRaw = raw; cacheIds = ids;
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb); // zmiana w innej karcie
  window.addEventListener(EVT, cb); // zmiana w tej karcie
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVT, cb); };
}

/** zapisane biegi; na serwerze i przy hydratacji pusta lista, potem stan z przeglądarki */
export function useSaved(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** false na serwerze i przy hydratacji, true w przeglądarce: pozwala nie mignąć pustym stanem przed odczytem listy */
const never = () => () => {};
export function useInBrowser(): boolean {
  return useSyncExternalStore(never, () => true, () => false);
}

/** dopisuje biegi do listy; zwraca false, gdy lista jest pełna i nie wszystko się zmieściło */
export function addSaved(ids: string[]): boolean {
  const cur = read();
  const next = cleanIds([...cur, ...ids]);
  if (next.length !== cur.length) write(next);
  return new Set([...cur, ...cleanIds(ids)]).size <= MAX_SAVED;
}

export function removeSaved(ids: string[]) {
  const cur = read();
  const next = cur.filter((x) => !ids.includes(x));
  if (next.length !== cur.length) write(next);
}

/** serce: zapisuje albo usuwa bieg; zwraca false, gdy lista jest pełna */
export function toggleSaved(id: string): boolean {
  if (read().includes(id)) { removeSaved([id]); return true; }
  return addSaved([id]);
}
