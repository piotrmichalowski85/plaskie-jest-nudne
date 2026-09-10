import * as cheerio from "cheerio";
import { fetchAny } from "./deep";

export type TrasaFound = { km: number; dplus: number; note?: string };
export type TrasaResult = { url?: string; found: TrasaFound[]; years: number[]; checkedAt: string; gpx?: string[] };

const UA = "Mozilla/5.0 (compatible; plaskiejestnudne-bot/0.1; +https://plaskiejestnudne.pl/o-serwisie)";

/** Wyciąga pary (dystans, D+) z tekstu podstrony trasy. Kilka wzorców spotykanych u organizatorów. */
export function extractTrasa(text: string): TrasaFound[] {
  const t = text.replace(/\s+/g, " ");
  const out: TrasaFound[] = [];
  const push = (km: number, d: number) => { if (km >= 3 && km <= 300 && d >= 50 && d <= 20000 && !out.some((x) => Math.abs(x.km - km) < 0.5)) out.push({ km, dplus: d }); };
  const pats: RegExp[] = [
    // "Dystans GUR 79 Przewyższenia +2600 m", "Dystans: 48 km, przewyższenie: 1700 m"
    /dystans\w*:?\s*(?:[A-ZŁŚŻ]{2,6}\s*)?(\d{1,3}(?:[.,]\d)?)\s*(?:km)?[^0-9+\-]{0,30}przewyższeni\w*:?\s*\+?\s*(\d[\d\s]{1,5})\s*m\b/gi,
    // "78 km (+2600 m)", "78 km / +2600 m", "78 km, D+ 2600 m", "78km +2600m", "100 km Przewyższenie: 2450+/-"
    /(\d{1,3}(?:[.,]\d)?)\s*km[^.;\n]{0,25}?(?:\+\s?|D\s?\+\s?|przewyższeni\w*\s*:?\s*\+?\s?)(\d[\d\s]{1,5})\s*(?:m\b|\+|\/)/gi,
    // "+2600 m ... 78 km" (D+ przed dystansem, w tym samym wierszu-opisie)
    /(?:\+\s?|D\s?\+\s?)(\d[\d\s]{1,5})\s*m\b[^.;\n]{0,25}?(\d{1,3}(?:[.,]\d)?)\s*km/gi,
  ];
  pats.forEach((re, i) => {
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      const a = m[1].replace(/\s/g, ""), b = m[2].replace(/\s/g, "");
      const km = parseFloat((i === 2 ? b : a).replace(",", ".")), d = parseInt(i === 2 ? a : b, 10);
      if (isFinite(km) && isFinite(d)) push(km, d);
    }
  });
  return out.sort((a, b) => a.km - b.km);
}

/** Podstrony "Trasa/Dystanse/Profil" z menu strony organizatora (ta sama domena), max 3. */
export function trasaLinks(base: string, $: cheerio.CheerioAPI): string[] {
  const host = new URL(base).hostname.replace(/^www\./, "");
  const out: string[] = [];
  $("a[href]").each((_, a) => {
    const text = $(a).text().replace(/\s+/g, " ").trim();
    const href = $(a).attr("href") || "";
    let u: URL; try { u = new URL(href, base); } catch { return; }
    if (u.hostname.replace(/^www\./, "") !== host) return;
    if (/^(trasa|trasy|dystans|dystanse|profil|route|routes|przebieg|mapa trasy|trasa i profil)/i.test(text) || /\/(trasa|trasy|dystanse|route)[a-z0-9\-]*\/?$/i.test(u.pathname)) {
      const s = u.toString().split("#")[0];
      if (!out.includes(s) && s !== base) out.push(s);
    }
  });
  return out.slice(0, 3);
}

/** Etapówka / challenge: "(79 km + 59 km + 25 km) o sumie przewyższeń +5350 m" -> suma km, suma D+, lista etapów */
export function extractStageSum(text: string): TrasaFound | null {
  const t = text.replace(/\s+/g, " ");
  const m = t.match(/((?:\d{1,3}(?:[.,]\d)?\s*km\s*\+\s*){1,6}\d{1,3}(?:[.,]\d)?\s*km)[^.]{0,60}?(?:sum\w*\s+)?przewyższe\w*\s*\+?\s?(\d[\d\s]{2,5})\s*m/i);
  if (!m) return null;
  const stages = [...m[1].matchAll(/(\d{1,3}(?:[.,]\d)?)\s*km/g)].map((x) => parseFloat(x[1].replace(",", ".")));
  const km = stages.reduce((a, b) => a + b, 0), dplus = parseInt(m[2].replace(/\s/g, ""), 10);
  if (stages.length < 2 || km < 20 || dplus < 100) return null;
  return { km, dplus, note: `${stages.length} etapy: ${stages.join(" + ")} km` };
}

/** Linki z menu, których tekst zawiera dystans ("Orli 25 km", "PUT 100 Km", "JuraRun ULTRA 42+", "40 KM Long Trail"). */
export function distanceLinks(base: string, $: cheerio.CheerioAPI): { km: number; url: string }[] {
  const host = new URL(base).hostname.replace(/^www\./, "");
  const out: { km: number; url: string }[] = [];
  $("a[href]").each((_, a) => {
    const text = $(a).text().replace(/\s+/g, " ").trim();
    if (text.length > 40) return;
    const m = text.match(/(?:^|\s)(\d{1,3}(?:[.,]\d)?)\s*(?:km|k\b|\+)/i);
    if (!m) return;
    const km = parseFloat(m[1].replace(",", "."));
    if (km < 3 || km > 300) return;
    let u: URL; try { u = new URL($(a).attr("href") || "", base); } catch { return; }
    if (u.hostname.replace(/^www\./, "") !== host) return;
    const s = u.toString().split("#")[0];
    if (s !== base && !out.some((x) => x.url === s)) out.push({ km, url: s });
  });
  return out.slice(0, 8);
}

/** D+ z pojedynczej podstrony dystansu: pierwsza sensowna liczba przy "przewyższenie" albo "+N m". */
export function extractDplusOnly(text: string): number | undefined {
  const t = text.replace(/\s+/g, " ");
  const m = t.match(/przewyższeni\w*[^0-9]{0,25}?\+?\s?(\d[\d\s]{1,5})\s*(?:m\b|\+|\/)/i) || t.match(/(?:\bD\s?\+|\s\+)\s?(\d[\d\s]{2,5})\s*m\b/);
  if (!m) return undefined;
  const d = parseInt(m[1].replace(/\s/g, ""), 10);
  return d >= 50 && d <= 20000 ? d : undefined;
}

/** Linki do plików GPX/KML na stronie (ta sama lub inna domena). */
export function gpxLinks(base: string, $: cheerio.CheerioAPI): string[] {
  const out: string[] = [];
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href") || "";
    if (!/\.(gpx|kml)(\?|$)/i.test(href)) return;
    try { const u = new URL(href, base).toString(); if (!out.includes(u)) out.push(u); } catch { /* zły href */ }
  });
  return out.slice(0, 12);
}

export async function findTrasa(startUrl: string, raceKms: number[] = []): Promise<TrasaResult> {
  const res: TrasaResult = { found: [], years: [], checkedAt: new Date().toISOString() };
  const page = await fetchAny(startUrl);
  if (!page || page.kind !== "html" || !page.$) return res;
  const gpx = new Set(gpxLinks(startUrl, page.$));
  const collectGpx = async (u: string, $?: cheerio.CheerioAPI) => { if ($) for (const g of gpxLinks(u, $)) gpx.add(g); };
  const years = (t: string) => [...new Set((t.match(/\b20\d{2}\b/g) || []).map(Number))].filter((y) => y >= 2020 && y <= 2030);
  const covered = (km: number) => res.found.some((f) => Math.abs(f.km - km) <= Math.max(3, km * 0.06));
  // 1) podstrona "Trasa" (najpewniejsza: dotyczy tej imprezy)
  for (const u of trasaLinks(startUrl, page.$)) {
    const p = await fetchAny(u); if (!p) continue;
    await collectGpx(u, p.$);
    const found = extractTrasa(p.text);
    if (found.length) { res.url = u; res.found = found; res.years = years(p.text); break; }
  }
  // 2) podstrony per dystans z menu: dokładają dystanse, których nie było na podstronie Trasa (np. Challenge = suma etapów)
  const dl = distanceLinks(startUrl, page.$).filter((l) => !covered(l.km) && !/faq|regulamin|wyniki/i.test(l.url)).slice(0, 4);
  for (const l of dl) {
    const p = await fetchAny(l.url); if (!p) continue;
    await collectGpx(l.url, p.$);
    const stage = extractStageSum(p.text);
    if (stage && Math.abs(stage.km - l.km) <= Math.max(5, l.km * 0.08)) { if (!covered(l.km)) res.found.push({ km: l.km, dplus: stage.dplus, note: stage.note }); continue; }
    const d = extractDplusOnly(p.text);
    if (d && !covered(l.km)) res.found.push({ km: l.km, dplus: d });
    if (!res.url) { res.url = l.url; res.years = years(page.text); }
  }
  if (res.found.length) { res.found.sort((a, b) => a.km - b.km); res.gpx = [...gpx]; return res; }
  // 3) strona główna, tylko gdy liczba trafień nie przekracza liczby dystansów imprezy + 2 (inaczej to lista wielu imprez, np. seria)
  const home = extractTrasa(page.text);
  if (home.length && (!raceKms.length || home.length <= raceKms.length + 2)) { res.url = startUrl; res.found = home; res.years = years(page.text); }
  res.gpx = [...gpx];
  return res;
}
