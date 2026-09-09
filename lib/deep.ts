import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

const UA = "Mozilla/5.0 (compatible; plaskiejestnudne-bot/0.1; +https://plaskiejestnudne.pl/o-serwisie)";
const SKIP = /facebook|instagram|youtube|twitter|x\.com|tiktok|google|apple|tpay|przelewy24|payu|imoje|linkedin|strava|garmin|wikipedia|allegro|sklep|shop|cookies|polityka|privacy|regulamin_portalu|regulamin-portalu|regulamin_serwisu|regulamin\.php|regapk|rossmann|zaloguj|rejestracja\.php|queue\/|wyniki\.|results/i;

export type DeepResult = { regulaminUrl?: string; regulaminText?: string; organizerUrl?: string; visited: string[] };

export async function fetchAny(url: string, ms = 15000): Promise<{ kind: "html" | "pdf"; text: string; $?: cheerio.CheerioAPI } | null> {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,application/pdf" }, signal: AbortSignal.timeout(ms), redirect: "follow" });
    if (!r.ok) return null;
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("pdf") || /\.pdf(\?|$)/i.test(url)) {
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 25_000_000) return null;
      const p = new PDFParse({ data: buf });
      const t = await p.getText();
      return { kind: "pdf", text: t.text.replace(/\s+/g, " ") };
    }
    if (!ct.includes("html")) return null;
    const $ = cheerio.load(await r.text());
    $("script,style,noscript").remove();
    return { kind: "html", text: $("body").text().replace(/\s+/g, " "), $ };
  } catch { return null; }
}

function abs(base: string, href: string): string | null {
  try { return new URL(href, base).toString(); } catch { return null; }
}

/** Kandydaci z jednej strony: linki do regulaminu (pdf/html) i do zewnętrznej strony organizatora */
function candidates(base: string, $: cheerio.CheerioAPI): { regulamin: string[]; external: string[]; internal: string[] } {
  const baseHost = new URL(base).hostname.replace(/^www\./, "");
  const regulamin: string[] = [], external: string[] = [], internal: string[] = [];
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href") || "";
    const text = $(a).text().replace(/\s+/g, " ").trim();
    const u = abs(base, href);
    if (!u || !/^https?:/.test(u) || SKIP.test(u) || u.startsWith("mailto:")) return;
    const host = new URL(u).hostname.replace(/^www\./, "");
    if ((/regulamin|rules/i.test(text) && !/serwisu|portalu|aplikacji|płatno|platno/i.test(text)) || /regulamin|rules|zasady/i.test(u)) { if (!regulamin.includes(u)) regulamin.push(u); return; }
    if (host !== baseHost && (/strona|www|organizator|zapisy|zapisz|rejestr|więcej|wiecej|bieg|trail|szczegół|info/i.test(text) || /\.pl\/?$|\.com\/?$|\.eu\/?$/i.test(u))) {
      if (!external.includes(u)) external.push(u);
    } else if (host === baseHost && u !== base && /zapisz|zapisy|rejestracja|strona biegu|szczegóły|więcej/i.test(text) && !/^(#|javascript)/.test(href)) {
      if (!internal.includes(u)) internal.push(u);
    }
  });
  regulamin.sort((a, b) => Number(/\.pdf/i.test(b)) - Number(/\.pdf/i.test(a)));
  return { regulamin, external: external.slice(0, 4), internal: internal.slice(0, 2) };
}

const looksLikeRegulamin = (t: string) => /regulamin/i.test(t) && /(dystans|km)/i.test(t) && /(limit|organizator|uczestnik)/i.test(t) && t.length > 1500;

/** Szuka regulaminu zawodów do 2 poziomów w głąb od strony startowej (zapisy -> strona organizatora -> regulamin.pdf). */
export async function findRegulamin(startUrl: string): Promise<DeepResult> {
  const visited: string[] = [];
  const tryUrl = async (u: string): Promise<DeepResult | null> => {
    if (visited.includes(u) || visited.length > 12) return null;
    visited.push(u);
    const page = await fetchAny(u);
    if (!page) return null;
    if (page.kind === "pdf") return looksLikeRegulamin(page.text) ? { regulaminUrl: u, regulaminText: page.text, visited } : null;
    // sama strona jest regulaminem?
    if (/regulamin/i.test(u) && looksLikeRegulamin(page.text)) return { regulaminUrl: u, regulaminText: page.text, visited };
    return { visited, ...(page.$ ? { _c: candidates(u, page.$) } : {}) } as DeepResult & { _c?: ReturnType<typeof candidates> };
  };
  const first = (await tryUrl(startUrl)) as (DeepResult & { _c?: ReturnType<typeof candidates> }) | null;
  if (!first) return { visited };
  if (first.regulaminText) return first;
  const c1 = first._c ?? { regulamin: [], external: [], internal: [] };
  for (const inl of c1.internal) {
    const mid = (await tryUrl(inl)) as (DeepResult & { _c?: ReturnType<typeof candidates> }) | null;
    if (mid?.regulaminText) return mid;
    for (const r of mid?._c?.regulamin ?? []) if (!c1.regulamin.includes(r)) c1.regulamin.push(r);
    for (const e of mid?._c?.external ?? []) if (!c1.external.includes(e)) c1.external.push(e);
  }
  for (const r of c1.regulamin.slice(0, 3)) { const res = await tryUrl(r); if (res?.regulaminText) return { ...res, organizerUrl: undefined }; }
  for (const ext of c1.external) {
    const second = (await tryUrl(ext)) as (DeepResult & { _c?: ReturnType<typeof candidates> }) | null;
    if (!second) continue;
    if (second.regulaminText) return { ...second, organizerUrl: ext };
    for (const r of (second._c?.regulamin ?? []).slice(0, 3)) { const res = await tryUrl(r); if (res?.regulaminText) return { ...res, organizerUrl: ext }; }
  }
  return { visited, organizerUrl: c1.external[0] };
}

/** Limity czasu z regulaminu: "dystansie 26 km – 5 godzin", "16 km – 2,5 godziny", "limit czasu ... 8 h" */
export function extractLimits(text: string): { km: number; limitH: number }[] {
  const out: { km: number; limitH: number }[] = [];
  const re = /(\d{1,3}(?:[.,]\d)?)\s*km[^.;]{0,60}?(\d{1,2}(?:[.,]\d)?)\s*(?:godzin|godz|h\b)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const km = parseFloat(m[1].replace(",", ".")), h = parseFloat(m[2].replace(",", "."));
    if (km >= 3 && km <= 300 && h >= 0.5 && h <= 60 && !out.some((x) => x.km === km)) out.push({ km, limitH: h });
  }
  return out;
}

/** Sprzęt obowiązkowy: sekcja "WYPOSAŻENIE/SPRZĘT OBOWIĄZKOWY" -> lista pozycji */
export function extractGear(text: string): string[] {
  const m = text.match(/(?:wyposa[żz]enie|sprz[ęe]t|ekwipunek)\s+obowi[ąa]zkow[ye][^.]{0,40}?[:.]?\s*(.{80,1500}?)(?=\s(?:\d{1,2}\.\s*[A-ZŁŚŻ]{3,}|[A-ZŁŚŻ]{4,}\s+[A-ZŁŚŻ]{3,}|wyposa[żz]enie\s+zalecane|sprz[ęe]t\s+zalecany|zaleca(?:my|ne)|§|$))/i);
  if (!m) return [];
  let body = m[1];
  const items = body
    .split(/\s[-–•●▪·]\s|\s[a-z]\)\s|\s\d{1,2}\)\s|,\s(?=[a-ząćęłńóśźż])|;\s/i)
    .map((x) => x.replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, "").replace(/\s+/g, " "))
    .filter((x) => x.length >= 4 && x.length <= 120 && !/^(każdy|uczestnik|zawodnik|organizator)/i.test(x));
  const uniq = items.filter((x, i, a) => a.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
  return uniq.slice(0, 15);
}
