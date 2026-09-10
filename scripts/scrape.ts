import * as cheerio from "cheerio";
import { writeFileSync } from "node:fs";
import type { Race, Dataset } from "../lib/types";
import { parsePolishDate, parseDistances, splitPlace, slugify, guessSurface, beginnerScore, dedupKey, eventCore, cleanCity } from "../lib/normalize";
import { extractFromText, fetchText } from "../lib/enrich";
import organizers from "../data/organizers.json";
import { kingrunnerRows, kingrunnerDetail } from "../lib/adapters/kingrunner";
import { findRegulamin, extractLimits, extractGear, fetchAny } from "../lib/deep";
import { findTrasa, type TrasaResult } from "../lib/trasa";
import overrides from "../data/overrides.json";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";

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
  $("br").replaceWith(" | ");
  const out: Raw[] = [];
  $("tr").each((_, tr) => {
    const tds = $(tr).find("td,th");
    if (tds.length < 6) return;
    const cell = (i: number) => $(tds[i]).text().replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim();
    // znajdź kolumnę daty (pierwsza komórka, która parsuje się jako data)
    let di = -1;
    for (let i = 0; i < Math.min(3, tds.length); i++) if (parsePolishDate(cell(i))) { di = i; break; }
    if (di < 0) return;
    const dateTxt = cell(di), place = cell(di + 1), distTxt = cell(di + 2), nameCell = $(tds[di + 3]), category = cell(di + 4);
    const d = parsePolishDate(dateTxt);
    if (!d) return;
    // komórka nazwy: pierwszy wiersz = impreza, kolejne = biegi/dystanse (w źródle rozdzielone <br>)
    const segs = nameCell.text().replace(/\s+/g, " ").split("|").map((x) => x.trim()).filter(Boolean);
    if (!segs.length) return;
    const head = segs[0].replace(/[:\-–]\s*$/, "").trim();
    const rawName = segs.length > 1 ? `${head}: ${segs.slice(1).join(", ")}` : head;
    const link = nameCell.find("a[href]").first().attr("href") || $(tds[di + 1]).find("a[href]").first().attr("href");
    const { city, region } = splitPlace(place.replace(/\s*\|\s*/g, " "));
    const { list, vertical } = parseDistances(distTxt);
    // impreza = pierwszy wiersz komórki (bez nawiasu, dwukropka, ukośnika i końcowej liczby dystansu)
    let eventName = (head.split(/\s[–-]\s|\(|:|\//)[0].trim() || head).replace(/\s+\d{1,3}(?:[.,]\d)?\s*(km)?$/i, "").trim() || head;
    if (eventName.length > 60) eventName = eventName.slice(0, 60).replace(/\s\S*$/, "");
    out.push({
      name: rawName, eventName, dateStart: d.start, dateEnd: d.end, city, region,
      distancesKm: list.map((x) => x.km), elevations: list.map((x) => ({ ...x, dplusSource: x.dplus ? ("kalendarz" as const) : undefined, dplusSourceUrl: x.dplus ? url : undefined })), vertical,
      category: category.replace(/\s*\|\s*/g, " ") || undefined, url: link && /^https?:/.test(link) ? link : undefined,
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
      url: href ? new URL(href, "https://elektronicznezapisy.pl/").toString() : undefined,
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
      if (!r.distancesKm.length && f.distances.length) { r.distancesKm = f.distances.map((d) => d.km); r.elevations = f.distances.map((d) => ({ ...d, dplusSource: d.dplus ? ("organizator" as const) : undefined, dplusSourceUrl: d.dplus ? r.url : undefined })); changed = true; }
      else if (f.structured && f.distances.length) {
        // scal: D+ i limity ze strony organizatora dokładamy do dystansów z kalendarza, nic nie tracimy
        for (const d of f.distances) {
          const e = r.elevations.find((x) => Math.abs(x.km - d.km) < 0.6);
          if (e) { if (!e.dplus && d.dplus) { e.dplus = d.dplus; e.dplusSource = "organizator"; e.dplusSourceUrl = r.url; changed = true; } if (d.limitH) { e.limitH = d.limitH; changed = true; } }
        }
      }
      if (f.dplusMax && !r.elevations.some((e) => e.dplus) && r.elevations.length && !changed) {
        const longest = r.elevations[r.elevations.length - 1]; longest.dplus = f.dplusMax; longest.dplusSource = "organizator"; longest.dplusSourceUrl = r.url; if (r.elevations.length > 1) longest.approx = true; changed = true;
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

type RegCache = Record<string, { trasa?: TrasaResult; regulaminUrl?: string; organizerUrl?: string; distances: { km: number; dplus?: number }[]; limits: { km: number; limitH: number }[]; gear: string[]; gearSource?: "llm"; gearAt?: string; fetchedAt: string; visited: number }>;
const CACHE_PATH = "data/regulaminy.json";
export const TEXT_DIR = "data/.regulaminy_text"; // lokalny cache tekstu regulaminów (poza git)
export const textPath = (u: string) => `${TEXT_DIR}/${createHash("sha1").update(u).digest("hex")}.txt`;
const TTL_DAYS = 30;

/** Regulamin do 2 poziomów w głąb (zapisy -> organizator -> pdf). Cache 30 dni, tylko nadchodzące biegi z linkiem. */
async function regulaminy(raws: Raw[]): Promise<number> {
  const cache: RegCache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : {};
  const todayS = new Date().toISOString().slice(0, 10);
  mkdirSync(TEXT_DIR, { recursive: true });
  const fresh = (u: string) => cache[u] && (Date.now() - Date.parse(cache[u].fetchedAt)) / 86400000 < TTL_DAYS && (!cache[u].regulaminUrl || existsSync(textPath(cache[u].regulaminUrl!)));
  // ręczne nadpisania (data/overrides.json): link organizatora i/lub regulamin, gdy źródło ich nie ma
  for (const o of overrides as { match: string; url?: string; regulaminUrl?: string }[]) {
    const re = new RegExp(o.match, "i");
    for (const r of raws.filter((x) => re.test(x.name))) { if (o.url) r.url = o.url; if (o.regulaminUrl) r.regulaminUrl = o.regulaminUrl; }
  }
  const todo = raws.filter((r) => r.url && r.dateEnd >= todayS && !fresh(r.url!));
  let n = 0;
  const queue = [...todo];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const r = queue.shift()!;
      const res = r.regulaminUrl
        ? await (async () => { const pg = await fetchAny(r.regulaminUrl!); return { regulaminUrl: pg ? r.regulaminUrl : undefined, regulaminText: pg?.text, organizerUrl: undefined, visited: [r.regulaminUrl!] } as Awaited<ReturnType<typeof findRegulamin>>; })()
        : await findRegulamin(r.url!);
      const text = res.regulaminText || "";
      if (res.regulaminUrl && text) writeFileSync(textPath(res.regulaminUrl), text.slice(0, 60000));
      const prevGear = cache[r.url!]?.gearSource === "llm" ? { gear: cache[r.url!].gear, gearSource: "llm" as const, gearAt: cache[r.url!].gearAt } : {};
      cache[r.url!] = {
        regulaminUrl: res.regulaminUrl, organizerUrl: res.organizerUrl,
        distances: text ? (extractFromText(text)?.distances ?? []) : [],
        limits: text ? extractLimits(text) : [], gear: [], ...prevGear,
        fetchedAt: new Date().toISOString(), visited: res.visited.length,
      };
      if (res.regulaminUrl) n++;
    }
  }));
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));
  // zastosuj do biegów
  for (const r of raws) {
    const c = r.url ? cache[r.url] : undefined;
    if (!c) continue;
    if (c.regulaminUrl) r.regulaminUrl = c.regulaminUrl;
    if (c.organizerUrl && /elektronicznezapisy|b4sportonline|datasport|kingrunner|zapisy/i.test(r.url!)) r.url = c.organizerUrl;
    if (!r.distancesKm.length) {
      // dystanse z regulaminu: najpewniejsze są te, przy których stoi limit czasu; reszta tekstu bywa o punktach kontrolnych
      const fromLimits = c.limits.filter((l) => l.limitH / l.km >= 0.1 && l.limitH / l.km <= 0.5).map((l) => ({ km: l.km, limitH: l.limitH })).sort((a, b) => a.km - b.km);
      const list = fromLimits.length ? fromLimits : c.distances.length <= 8 ? c.distances : [];
      if (list.length) { r.distancesKm = list.map((d) => d.km); r.elevations = list; }
    }
    for (const l of c.limits) {
      const e = r.elevations.find((x) => Math.abs(x.km - l.km) < 0.6);
      const hPerKm = l.limitH / l.km;
      if (e && !e.limitH && hPerKm >= 0.1 && hPerKm <= 0.5) e.limitH = l.limitH;
    }
    if (c.gearSource === "llm" && c.gear.length >= 1 && !r.gear) r.gear = c.gear;
    if (c.regulaminUrl && !r.sources.some((s) => s.name === "regulamin")) r.sources.push({ name: "regulamin", url: c.regulaminUrl });
  }
  return n;
}

const PLATFORM = /elektronicznezapisy|b4sportonline|datasport|kingrunner|zapisy\.|e-gepard|dostartu|zmierzymyczas/i;

/** Poziom B drabiny: podstrona "Trasa" / podstrony dystansów u organizatora. Cache w regulaminy.json (pole trasa, TTL 30 dni). */
async function trasy(raws: Raw[]): Promise<{ hits: number; conflicts: string[] }> {
  const cache: RegCache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : {};
  const todayS = new Date().toISOString().slice(0, 10);
  const fresh = (u: string) => cache[u]?.trasa && (Date.now() - Date.parse(cache[u].trasa!.checkedAt)) / 86400000 < TTL_DAYS;
  const todo = raws.filter((r) => r.url && !PLATFORM.test(r.url) && r.dateEnd >= todayS && !fresh(r.url!));
  const queue = [...todo];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const r = queue.shift()!;
      const t = await findTrasa(r.url!, r.distancesKm);
      cache[r.url!] = { ...(cache[r.url!] ?? { distances: [], limits: [], gear: [], fetchedAt: new Date(0).toISOString(), visited: 0 }), trasa: t };
    }
  }));
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));
  let hits = 0; const conflicts: string[] = [];
  for (const r of raws) {
    const t = r.url ? cache[r.url]?.trasa : undefined;
    if (!t?.found.length) continue;
    const raceYear = Number(r.dateStart.slice(0, 4));
    const stale = t.years.length > 0 && !t.years.includes(raceYear);
    let changed = false;
    for (const f of t.found) {
      const tol = Math.max(3, f.km * 0.06);
      const near = r.elevations.filter((e) => Math.abs(e.km - f.km) <= tol).sort((a, b) => Math.abs(a.km - f.km) - Math.abs(b.km - f.km));
      const e = near[0];
      if (!e) continue;
      // niejednoznaczność: dwa źródłowe wpisy celują w ten sam dystans z różnymi wartościami
      const rivals = t.found.filter((g) => g !== f && Math.abs(g.km - e.km) <= tol);
      if (rivals.some((g) => Math.abs(g.dplus - f.dplus) / f.dplus > 0.2)) continue;
      const rank: Record<string, number> = { gpx: 5, trasa: 4, organizator: 3, regulamin: 2, kalendarz: 1 };
      const cur = e.dplusSource ? rank[e.dplusSource] : 0;
      if (e.dplus && cur >= rank.trasa) continue;
      if (e.dplus && Math.abs(e.dplus - f.dplus) / e.dplus > 0.15) conflicts.push(`${r.eventName} ${e.km} km: ${e.dplusSource} ${e.dplus} m vs trasa ${f.dplus} m (${t.url})`);
      e.dplus = f.dplus; e.dplusSource = "trasa"; e.dplusSourceUrl = t.url; e.dplusCheckedAt = t.checkedAt.slice(0, 10); e.dplusStale = stale || undefined; e.approx = undefined;
      changed = true;
    }
    if (changed) { hits++; if (!r.sources.some((s) => s.name === "trasa (organizator)")) r.sources.push({ name: "trasa (organizator)", url: t.url! }); }
  }
  writeFileSync("data/_konflikty.json", JSON.stringify({ generatedAt: new Date().toISOString(), conflicts }, null, 1));
  return { hits, conflicts };
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
  const tr = await trasy(raws);
  console.log(`trasa: D+ dołożone/zaktualizowane w ${tr.hits} biegach, konflikty: ${tr.conflicts.length}`);
  const regs = await regulaminy(raws);
  console.log(`regulaminy found this run: ${regs}, with regulamin total: ${raws.filter((r) => r.regulaminUrl).length}, with gear: ${raws.filter((r) => r.gear).length}`);
  const races = finalize(raws);
  const ds: Dataset = { generatedAt: new Date().toISOString(), count: races.length, races };
  if (races.length < 100 && !process.env.FORCE) { console.error(`STOP: tylko ${races.length} biegów, nie nadpisuję data/races.json (FORCE=1, żeby wymusić)`); process.exit(2); }
  mkdirSync("data", { recursive: true });
  writeFileSync("data/races.json", JSON.stringify(ds, null, 1));
  const today = new Date().toISOString().slice(0, 10);
  console.log(`total ${races.length}, upcoming ${races.filter((r) => r.dateEnd >= today).length}, with D+ ${races.filter((r) => r.elevations.some((e) => e.dplus)).length}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
