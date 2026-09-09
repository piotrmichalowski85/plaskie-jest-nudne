import * as cheerio from "cheerio";
import { writeFileSync, mkdirSync } from "node:fs";
import type { Race, Dataset } from "../lib/types";
import { parsePolishDate, parseDistances, splitPlace, slugify, guessSurface, beginnerScore, dedupKey, eventCore, cleanCity } from "../lib/normalize";
import { extractFromText, fetchText } from "../lib/enrich";
import organizers from "../data/organizers.json";
import { kingrunnerRows, kingrunnerDetail } from "../lib/adapters/kingrunner";

const UA = "Mozilla/5.0 (compatible; plaskiejestnudne-bot/0.1; +https://plaskiejestnudne.pl/o-serwisie)";
async function get(url: string): Promise<string> {
  const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return await r.text();
}
type Raw = Omit<Race, "id" | "beginnerScore" | "beginnerWhy" | "minKm" | "maxKm" | "surface"> & { surface?: Race["surface"] };

/** biegigorskie.pl kalendarz: tabela [ '', Data, Miejsce, Dystans, Nazwa, Kategoria, Fb, Wyniki ] */
async function biegigorskie(year: number): Promise<Raw[]> {
  const url = `https://www.biegigorskie.pl/kalendarz-${year}/`;
  const $ = cheerio.load(await get(url));
  $("br").replaceWith(" ");
  const out: Raw[] = [];
  $("tr").each((_, tr) => {
    const tds = $(tr).find("td,th");
    if (tds.length < 6) return;
    const cell = (i: number) => $(tds[i]).text().replace(/\s+/g, " ").trim();
    // znajdź kolumnę daty (pierwsza komórka, która parsuje się jako data)
    let di = -1;
    for (let i = 0; i < Math.min(3, tds.length); i++) if (parsePolishDate(cell(i))) { di = i; break; }
    if (di < 0) return;
    const dateTxt = cell(di), place = cell(di + 1), distTxt = cell(di + 2), nameCell = $(tds[di + 3]), category = cell(di + 4);
    const d = parsePolishDate(dateTxt);
    if (!d) return;
    const rawName = nameCell.text().replace(/\s+/g, " ").trim();
    if (!rawName) return;
    const link = nameCell.find("a[href]").first().attr("href") || $(tds[di + 1]).find("a[href]").first().attr("href");
    const { city, region } = splitPlace(place);
    const { list, vertical } = parseDistances(distTxt);
    // pierwszy człon nazwy = impreza (przed nawiasem albo przed drugim tytułem)
    let eventName = (rawName.split(/\s[–-]\s|\(|:|\//)[0].trim() || rawName).replace(/\s+\d{1,3}(?:[.,]\d)?\s*(km)?$/i, "").trim() || rawName;
    if (eventName.length > 60) eventName = eventName.slice(0, 60).replace(/\s\S*$/, "");
    out.push({
      name: rawName, eventName, dateStart: d.start, dateEnd: d.end, city, region,
      distancesKm: list.map((x) => x.km), elevations: list, vertical,
      category: category || undefined, url: link && /^https?:/.test(link) ? link : undefined,
      sources: [{ name: "biegigorskie.pl", url }],
    });
  });
  return out;
}

/** elektronicznezapisy.pl sekcja biegi górskie: tabela [#, Nazwa, Data, Zawodnicy, Zapisani, ''] */
async function elektronicznezapisy(): Promise<Raw[]> {
  const url = "https://elektronicznezapisy.pl/62/bieg-gorski.html";
  const $ = cheerio.load(await get(url));
  $("br").replaceWith(" ");
  const out: Raw[] = [];
  $("tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 3) return;
    const nameTxt = $(tds[1]).text().replace(/\s+/g, " ").trim();
    const dateTxt = $(tds[2]).text().trim();
    const d = parsePolishDate(dateTxt);
    if (!d) return;
    const m = nameTxt.match(/^([^,]+),\s*"?(.+?)"?\s*-\s*\d{4}-\d{2}-\d{2}/);
    const city = m ? m[1].trim() : "";
    const name = (m ? m[2] : nameTxt).replace(/"/g, "").replace(/\s+/g, " ").trim();
    const href = $(tds[1]).find("a[href]").first().attr("href");
    const signed = parseInt($(tds[4]).text().replace(/\D/g, ""), 10);
    const { list, vertical } = parseDistances(name);
    out.push({
      name, eventName: name, dateStart: d.start, dateEnd: d.end, city, region: "",
      distancesKm: list.map((x) => x.km), elevations: list, vertical,
      url: href ? new URL(href, url).toString() : undefined,
      sources: [{ name: "elektronicznezapisy.pl", url }],
      signupOpen: true, participants: isFinite(signed) ? signed : undefined,
    });
  });
  return out;
}

/** Dla biegów bez dystansu albo bez D+ zagląda na stronę organizatora (heurystyka regex, bez LLM). */
async function enrich(raws: Raw[]): Promise<number> {
  const todo = raws.filter((r) => r.url && (!r.distancesKm.length || !r.elevations.some((e) => e.dplus)));
  let hits = 0;
  const queue = [...todo];
  const worker = async () => {
    while (queue.length) {
      const r = queue.shift()!;
      const text = await fetchText(r.url!);
      if (!text) continue;
      const f = extractFromText(text);
      if (!f) continue;
      let changed = false;
      if (!r.distancesKm.length && f.distances.length) { r.distancesKm = f.distances.map((d) => d.km); r.elevations = f.distances; changed = true; }
      else if (f.structured && f.distances.length) {
        // scal: D+ i limity ze strony organizatora dokładamy do dystansów z kalendarza, nic nie tracimy
        for (const d of f.distances) {
          const e = r.elevations.find((x) => Math.abs(x.km - d.km) < 0.6);
          if (e) { if (!e.dplus && d.dplus) { e.dplus = d.dplus; changed = true; } if (d.limitH) { e.limitH = d.limitH; changed = true; } }
        }
      }
      if (f.dplusMax && !r.elevations.some((e) => e.dplus) && r.elevations.length && !changed) {
        const longest = r.elevations[r.elevations.length - 1]; longest.dplus = f.dplusMax; if (r.elevations.length > 1) longest.approx = true; changed = true;
      }
      if (changed) { hits++; r.sources.push({ name: "strona organizatora", url: r.url! }); }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return hits;
}

/** kingrunner.com: wiersze per dystans -> grupujemy w imprezy (ta sama nazwa, daty w oknie 3 dni) */
async function kingrunner(): Promise<Raw[]> {
  const rows = (await kingrunnerRows()).filter((r) => r.polska && (/górski|terenowy|vertical/i.test(r.typ) && !/uliczny/i.test(r.typ)));
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${eventCore(r.event) || slugify(r.event)}|${r.date.slice(0, 7)}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
  }
  const out: Raw[] = [];
  const src = "https://www.kingrunner.com/biegi";
  for (const g of groups.values()) {
    g.sort((a, b) => a.km - b.km);
    const dates = g.map((x) => x.date).sort();
    const detail = g[0].href ? await kingrunnerDetail(g[0].href) : {};
    const list = g.map((x) => ({ km: x.km, dplus: undefined as number | undefined }));
    if (detail.dplus && list.length === 1) list[0].dplus = detail.dplus;
    // nazwa imprezy = najkrótsza z nazw w grupie, bez końcowej liczby dystansu ("Łemkowyna Trail 150" -> "Łemkowyna Trail")
    const eventName = g.map((x) => x.event).sort((a, b) => a.length - b.length)[0].replace(/\s+\d{1,3}\s*(km)?$/i, "").trim();
    out.push({
      name: g.length > 1 ? `${eventName}: ${g.map((x) => x.variant || x.km + " km").join(", ")}` : `${eventName}${g[0].variant ? " - " + g[0].variant : ""}`,
      eventName, dateStart: dates[0], dateEnd: dates[dates.length - 1], city: cleanCity(g[0].city), region: "",
      distancesKm: g.map((x) => x.km), elevations: list, vertical: g.some((x) => /vertical/i.test(x.typ + x.variant)),
      url: detail.url, sources: [{ name: "kingrunner.com", url: g[0].href || src }],
    });
  }
  return out;
}

/** Flagowce spoza kalendarzy: seed z data/organizers.json + dystanse/D+/limity ze strony organizatora */
async function organizerSeeds(): Promise<Raw[]> {
  const out: Raw[] = [];
  for (const o of organizers as { eventName: string; url: string; city: string; region: string; dateStart: string; dateEnd: string; distancesKm?: number[] }[]) {
    const text = await fetchText(o.url);
    const f = text ? extractFromText(text) : null;
    // seed z ręcznie potwierdzonymi dystansami ma pierwszeństwo; strona organizatora dokłada D+/limity, jeśli je ma
    const list = o.distancesKm
      ? o.distancesKm.map((km) => ({ km, ...(f?.structured ? f.distances.find((d) => Math.abs(d.km - km) < 0.6) ?? {} : {}) }))
      : (f?.structured ? f.distances : []);
    out.push({
      name: o.eventName, eventName: o.eventName, dateStart: o.dateStart, dateEnd: o.dateEnd, city: o.city, region: o.region,
      distancesKm: list.map((x) => x.km), elevations: list, vertical: false, url: o.url,
      sources: [{ name: "strona organizatora", url: o.url }],
    });
  }
  return out;
}

function finalize(raws: Raw[]): Race[] {
  const byKey = new Map<string, Raw>();
  for (const r of raws) {
    const k = dedupKey(r);
    const prev = byKey.get(k);
    if (!prev) { byKey.set(k, r); continue; }
    // scal: więcej dystansów wygrywa, źródła łączymy
    const merged: Raw = {
      ...prev,
      distancesKm: prev.distancesKm.length >= r.distancesKm.length ? prev.distancesKm : r.distancesKm,
      elevations: prev.elevations.length >= r.elevations.length ? prev.elevations : r.elevations,
      region: prev.region || r.region,
      url: prev.url || r.url,
      category: prev.category || r.category,
      signupOpen: prev.signupOpen || r.signupOpen,
      participants: prev.participants ?? r.participants,
      sources: [...prev.sources, ...r.sources.filter((s) => !prev.sources.some((p) => p.name === s.name))],
    };
    byKey.set(k, merged);
  }
  // drugi przebieg: ta sama pierwsza znacząca nazwa + miesiąc i (to samo miasto albo wspólny dystans) = ta sama impreza
  const merged2: Raw[] = [];
  const firstWord = (r: Raw) => (eventCore(r.eventName).split("-")[0] || slugify(r.eventName).slice(0, 8)) + "|" + r.dateStart.slice(0, 7);
  for (const r of byKey.values()) {
    const cand = merged2.find((m) => firstWord(m) === firstWord(r) && (slugify(m.city).split("-")[0] === slugify(r.city).split("-")[0] || (eventCore(m.eventName) === eventCore(r.eventName) && m.distancesKm.some((a) => r.distancesKm.some((b) => Math.abs(a - b) < 0.6)))));
    if (!cand) { merged2.push(r); continue; }
    const rich = cand.distancesKm.length >= r.distancesKm.length ? cand : r, poor = rich === cand ? r : cand;
    for (const e of poor.elevations) { const x = rich.elevations.find((y) => Math.abs(y.km - e.km) < 0.6); if (x) { x.dplus ??= e.dplus; x.limitH ??= e.limitH; } }
    Object.assign(cand, { ...rich, region: cand.region || r.region, url: cand.url || r.url, category: cand.category || r.category, signupOpen: cand.signupOpen || r.signupOpen, participants: cand.participants ?? r.participants, sources: [...cand.sources, ...r.sources.filter((s) => !cand.sources.some((p) => p.name === s.name))] });
  }
  const used = new Set<string>();
  return merged2
    .map((r) => {
      const { score, why } = beginnerScore(r.elevations, r.vertical, r.category);
      let id = `${slugify(r.eventName)}-${r.dateStart}`;
      while (used.has(id)) id += "-2";
      used.add(id);
      const km = r.distancesKm;
      return {
        ...r, id, surface: r.surface ?? guessSurface(r.name, r.region, r.elevations),
        minKm: km.length ? Math.min(...km) : 0, maxKm: km.length ? Math.max(...km) : 0,
        beginnerScore: score, beginnerWhy: why,
      } as Race;
    })
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart));
}

async function main() {
  const year = new Date().getFullYear();
  const results = await Promise.allSettled([biegigorskie(year), biegigorskie(year + 1), elektronicznezapisy(), organizerSeeds(), kingrunner()]);
  const raws: Raw[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") { console.log(`source ${i}: ${r.value.length} rows`); raws.push(...r.value); }
    else console.warn(`source ${i} failed: ${(r.reason as Error).message}`);
  });
  const hits = await enrich(raws);
  console.log(`enriched from organizer pages: ${hits}`);
  const races = finalize(raws);
  const ds: Dataset = { generatedAt: new Date().toISOString(), count: races.length, races };
  mkdirSync("data", { recursive: true });
  writeFileSync("data/races.json", JSON.stringify(ds, null, 1));
  const today = new Date().toISOString().slice(0, 10);
  console.log(`total ${races.length}, upcoming ${races.filter((r) => r.dateEnd >= today).length}, with D+ ${races.filter((r) => r.elevations.some((e) => e.dplus)).length}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
