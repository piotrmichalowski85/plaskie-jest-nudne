/** Kolejna edycja: po odbytym biegu zaglądamy co jakiś czas na stronę organizatora i szukamy terminu następnej edycji
 *  (data w oknie "rocznica +/- 75 dni"). Znaleziony termin tworzy wstępny rekord z dystansami poprzedniej edycji,
 *  który kalendarze i tak później potwierdzą (dedup w finalize). */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Race } from "./types";
import { parsePolishDate, eventCore, slugify, cleanCity } from "./normalize";
import { fetchAny } from "./deep";

type Raw = Omit<Race, "id" | "beginnerScore" | "beginnerWhy" | "minKm" | "maxKm" | "surface"> & { surface?: Race["surface"] };
type Entry = { checkedAt: string; prev: string; found?: { start: string; end: string }; hits?: number; title?: string };
const CACHE = "data/next_edition.json";
const PLATFORM = /b4sportonline|datasport|elektronicznezapisy|kalendarzbiegowy|kingrunner|biegigorskie|facebook\.com|fb\.com|instagram|zapisy\.|timekeeper|chronotex|sts-timing|protiming|maratonypolskie|time-sport\.pl\/zapisy/i;
const MON = "stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|wrzesnia|października|pazdziernika|listopada|grudnia|styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień";
const RE = new RegExp(`\\d{1,2}\\s+(?:${MON})\\s*[-–]\\s*\\d{1,2}\\s+(?:${MON})\\s+\\d{4}|\\d{1,2}\\s*[-–]\\s*\\d{1,2}\\s+(?:${MON})\\s+\\d{4}|\\d{1,2}\\s+(?:${MON})\\s+\\d{4}|\\d{1,2}\\s*[-–]\\s*\\d{1,2}[./]\\d{1,2}[./]\\d{4}|\\d{1,2}[./]\\d{1,2}[./]\\d{4}|\\d{4}-\\d{2}-\\d{2}`, "gi");
const pad = (n: number) => String(n).padStart(2, "0");

/** wszystkie daty z tekstu (start/end) */
export function datesInText(text: string): { start: string; end: string }[] {
  const out: { start: string; end: string }[] = [];
  for (const m of text.matchAll(RE)) {
    const s = m[0];
    let d = parsePolishDate(s);
    if (!d) {
      const r = s.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
      const x = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
      if (r) d = { start: `${r[4]}-${pad(+r[3])}-${pad(+r[1])}`, end: `${r[4]}-${pad(+r[3])}-${pad(+r[2])}` };
      else if (x) { const v = `${x[3]}-${pad(+x[2])}-${pad(+x[1])}`; d = { start: v, end: v }; }
    }
    if (d && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(d.start)) out.push(d);
  }
  return out;
}

/** termin kolejnej edycji: data po dziś, k pełnych lat po poprzedniej (k = 1..2), odchyłka od rocznicy <= 75 dni; wybieramy najczęstszą */
export function pickNextEdition(dates: { start: string; end: string }[], prevStart: string, today: string): { start: string; end: string; hits: number } | undefined {
  const prev = new Date(prevStart + "T12:00:00");
  const count = new Map<string, { d: { start: string; end: string }; n: number }>();
  for (const d of dates) {
    if (d.start <= today || d.end < d.start || Date.parse(d.end) - Date.parse(d.start) > 5 * 86400000) continue;
    const t = new Date(d.start + "T12:00:00");
    // biegi startują w piątek-niedzielę (albo trwają kilka dni); data w środku tygodnia to zwykle zapisy, odbiór pakietów albo placeholder
    if (d.start === d.end && ![0, 5, 6].includes(t.getDay())) continue;
    let ok = false;
    for (let k = 1; k <= 2; k++) { const a = new Date(prev); a.setFullYear(prev.getFullYear() + k); if (Math.abs(t.getTime() - a.getTime()) <= 75 * 86400000) ok = true; }
    if (!ok) continue;
    const key = d.start + "_" + d.end;
    const c = count.get(key) || { d, n: 0 }; c.n++; count.set(key, c);
  }
  const best = [...count.values()].sort((a, b) => b.n - a.n || a.d.start.localeCompare(b.d.start))[0];
  if (!best) return undefined;
  // "25 - 26.06.2027" bije pojedyncze "26.06.2027": zakres obejmujący najczęstszą datę wygrywa
  const range = [...count.values()].find((c) => c.d.start !== c.d.end && c.d.start <= best.d.start && c.d.end >= best.d.end);
  return range ? { ...range.d, hits: best.n } : { ...best.d, hits: best.n };
}

export async function nextEditions(raws: Raw[], limit = Number(process.env.NEXT_LIMIT || 40)): Promise<{ added: Raw[]; checked: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const cache: Record<string, Entry> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
  const w1 = (r: Raw) => eventCore(r.eventName).split("-")[0] || "";
  const ck = (r: Raw) => slugify(r.city).split("-")[0];
  const future = raws.filter((r) => r.dateEnd >= today);
  const hasFuture = (r: Raw) => future.some((f) => w1(f) === w1(r) && w1(r).length >= 4 && (ck(f) === ck(r) || eventCore(f.eventName) === eventCore(r.eventName)));
  // najnowsza odbyta edycja per impreza (klucz: rdzeń nazwy + miasto), tylko z własną stroną organizatora
  const latest = new Map<string, Raw>();
  for (const r of raws) {
    if (r.dateEnd >= today || !r.url || PLATFORM.test(r.url) || hasFuture(r)) continue;
    const k = w1(r) + "|" + ck(r); const p = latest.get(k);
    if (!p || p.dateStart < r.dateStart) latest.set(k, r);
  }
  const stale = (e?: Entry) => !e || (Date.now() - Date.parse(e.checkedAt)) / 86400000 > (e.found && e.found.start >= today ? 30 : 14);
  const todo = [...latest.values()].filter((r) => stale(cache[r.url!])).sort((a, b) => (cache[a.url!]?.checkedAt || "").localeCompare(cache[b.url!]?.checkedAt || "")).slice(0, limit);
  let checked = 0;
  for (const r of todo) {
    const url = r.url!;
    const page = await fetchAny(url, 15000);
    checked++;
    const e: Entry = { checkedAt: today, prev: r.dateStart };
    if (page) {
      const title = page.$ ? page.$("title").text().replace(/\s+/g, " ").trim().slice(0, 120) : "";
      const text = (title + " " + page.text).slice(0, 200000);
      const hit = pickNextEdition(datesInText(text), r.dateStart, today);
      if (hit) { e.found = { start: hit.start, end: hit.end }; e.hits = hit.hits; e.title = title; }
    }
    cache[url] = e;
    writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  }
  // rekordy wstępne z cache (także z poprzednich przebiegów), dopóki termin nie minął i kalendarze go nie potwierdziły
  const added: Raw[] = [];
  for (const r of latest.values()) {
    const e = cache[r.url!];
    if (!e?.found || e.found.start < today || e.prev !== r.dateStart) continue;
    // ta sama data i miejscowość już w przyszłych rekordach = to termin innej imprezy tego organizatora (np. festiwal), nie tej
    if (future.some((f) => f.dateStart === e.found!.start && ck(f) === ck(r))) continue;
    const ev = r.eventName.replace(/^(\d{1,2}\.|[IVXL]{1,5}\.?)\s+(?=\p{L})/u, "").trim(); // "5. Festiwal..." / "XII Zimowy..." - numer edycji należy do poprzedniego roku
    added.push({
      name: ev, eventName: ev, dateStart: e.found.start, dateEnd: e.found.end, city: cleanCity(r.city), region: r.region, url: r.url,
      distancesKm: r.distancesKm, elevations: r.elevations.map((x) => ({ km: x.km, dplus: x.dplus, dplusSource: x.dplusSource, dplusSourceUrl: x.dplusSourceUrl, dplusStale: x.dplus ? true : undefined, note: x.note })),
      vertical: r.vertical, surface: r.surface, sources: [{ name: "strona organizatora (termin kolejnej edycji)", url: r.url! }],
      provisional: "termin ze strony organizatora, dystanse z poprzedniej edycji",
    } as Raw);
  }
  return { added, checked };
}
