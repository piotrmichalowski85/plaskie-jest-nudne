import { existsSync, readFileSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { parseDistances } from "../normalize";

const UA = "Mozilla/5.0 (compatible; plaskiejestnudne-bot/0.1; +https://plaskiejestnudne.pl/o-serwisie)";
const CACHE = "data/kb_cache.json";
const TYPES: Record<number, string> = { 39: "gorski", 56: "ultra", 652: "trail", 40: "przelaj" };
type RestEvent = { id: number; modified: string; date: string; link: string; title: { rendered: string }; event_type: number[]; event_type_2: number[]; event_type_3: number[]; content?: { rendered: string } };
export type KBEvent = { id: number; name: string; url: string; start: string; end: string; city: string; voivodeship?: string; kinds: string[]; distancesKm: number[]; dplus: { km: number; dplus?: number }[]; modified: string };
type Cache = Record<string, KBEvent & { fetchedAt: string }>;

const dec = (s: string) => cheerio.load(`<x>${s}</x>`)("x").text().replace(/\s+/g, " ").trim();
const isoDate = (s: string) => { const m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/); return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : null; };

/** kalendarzbiegowy.pl: lista z WP REST (kategorie: górski, ultra, trailowy), daty i miejsce z JSON-LD strony biegu (cache po id+modified). */
export async function kbEvents(): Promise<KBEvent[]> {
  const cache: Cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
  const list: RestEvent[] = [];
  const cutoff = new Date(Date.now() - 400 * 86400000).toISOString();
  for (let page = 1; page <= 12; page++) {
    const r = await fetch(`https://kalendarzbiegowy.pl/wp-json/wp/v2/ajde_events?per_page=100&page=${page}&event_type_2=39,56,652&_fields=id,modified,date,link,title,event_type,event_type_2,event_type_3`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) break;
    const arr = (await r.json()) as RestEvent[];
    if (!Array.isArray(arr) || !arr.length) break;
    list.push(...arr);
    if (arr[arr.length - 1].date < cutoff) break;
  }
  const todo = list.filter((e) => !cache[e.id] || cache[e.id].modified !== e.modified);
  const queue = [...todo];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const e = queue.shift()!;
      try {
        const html = await (await fetch(e.link, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) })).text();
        const $ = cheerio.load(html);
        let ld: Record<string, unknown> | null = null;
        $('script[type="application/ld+json"]').each((_, s) => { try { const j = JSON.parse($(s).text()); const g = Array.isArray(j) ? j : j["@graph"] ? j["@graph"] : [j]; for (const x of g) if (x && /Event/.test(String(x["@type"]))) ld = x; } catch { /* zły json */ } });
        if (!ld) continue;
        const L = ld as { startDate?: string; endDate?: string; location?: { name?: string; address?: { streetAddress?: string } }[] | { name?: string }; description?: string };
        const start = L.startDate ? isoDate(L.startDate) : null; if (!start) continue;
        const end = (L.endDate && isoDate(L.endDate)) || start;
        const loc = Array.isArray(L.location) ? L.location[0] : L.location;
        const city = (loc?.name || "").replace(/\s+/g, " ").trim();
        const text = dec((L.description || "") + " " + $(".eventon_full_description, .evo_metarow_details, .eventon_desc_in").text());
        const { list: d } = parseDistances(text);
        cache[e.id] = { id: e.id, name: dec(e.title.rendered), url: e.link, start, end, city, kinds: e.event_type_2.map((t) => TYPES[t]).filter(Boolean), distancesKm: d.map((x) => x.km), dplus: d, modified: e.modified, fetchedAt: new Date().toISOString().slice(0, 10) };
      } catch { /* pomijamy */ }
    }
  }));
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  const ids = new Set(list.map((e) => e.id));
  return Object.values(cache).filter((e) => ids.has(e.id)).map(({ fetchedAt: _f, ...e }) => e);
}
