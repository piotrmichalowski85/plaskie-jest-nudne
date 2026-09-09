import * as cheerio from "cheerio";

export type Found = { distances: { km: number; dplus?: number; limitH?: number }[]; dplusMax?: number; structured?: boolean };

const KM_CTX = /(dystans|trasa|trasy|bieg|ultra|maraton|półmaraton|polmaraton|km\b)/i;

/** Wyciąga dystanse i przewyższenie z tekstu strony organizatora (heurystyka, bez LLM). */
export function extractFromText(text: string): Found | null {
  const t = text.replace(/\s+/g, " ");
  // wzorzec strukturalny (karty dystansów na stronach organizatorów): Dystans 30km Przewyższenie +740m ... Limit 5 godz.
  const st: { km: number; dplus?: number; limitH?: number }[] = [];
  const reS = /dystans:?\s*(\d{1,3}(?:[.,]\d)?)\s*km(?:[^0-9]{0,40}przewyższeni\w*:?\s*\+?\s*(\d[\d\s]{1,5})\s*m)?(?:[^a-z0-9]{0,60}limit(?:\s*czasu)?:?\s*(\d{1,2}(?:[.,]\d)?)\s*(?:godz|h))?/gi;
  let ms: RegExpExecArray | null;
  while ((ms = reS.exec(t))) {
    const km = parseFloat(ms[1].replace(",", "."));
    if (km < 1 || km > 300 || st.some((x) => Math.abs(x.km - km) < 0.05)) continue;
    st.push({ km, dplus: ms[2] ? parseInt(ms[2].replace(/\s/g, ""), 10) : undefined, limitH: ms[3] ? parseFloat(ms[3].replace(",", ".")) : undefined });
  }
  if (st.length >= 1 && st.length <= 12) { st.sort((a, b) => a.km - b.km); return { distances: st, dplusMax: Math.max(0, ...st.map((x) => x.dplus || 0)) || undefined, structured: true }; }
  const kms = new Set<number>();
  const re = /(\d{1,3}(?:[.,]\d)?)\s*(?:km|kilometr)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const km = parseFloat(m[1].replace(",", "."));
    const ctx = t.slice(Math.max(0, m.index - 80), m.index + 20);
    if (km >= 3 && km <= 250 && KM_CTX.test(ctx) && !/od (centrum|miasta|dworca)|w promieniu|godzin|zł\/km|\/h/i.test(ctx)) kms.add(km);
  }
  const dplus: number[] = [];
  const re2 = /(?:\+\s?|D\s?\+\s?|przewyższeni\w*[^0-9]{0,25}|suma podejść[^0-9]{0,25})(\d[\d\s]{2,5})\s*m\b/gi;
  while ((m = re2.exec(t))) {
    const v = parseInt(m[1].replace(/\s/g, ""), 10);
    if (v >= 100 && v <= 15000) dplus.push(v);
  }
  const list = [...kms].sort((a, b) => a - b);
  if (list.length === 0 || list.length > 8) return dplus.length ? { distances: [], dplusMax: Math.max(...dplus) } : null;
  const found: Found = { distances: list.map((km) => ({ km })), dplusMax: dplus.length ? Math.max(...dplus) : undefined };
  if (found.dplusMax && list.length === 1) found.distances[0].dplus = found.dplusMax;
  return found;
}

export async function fetchText(url: string, ms = 12000): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; plaskiejestnudne-bot/0.1; +https://plaskiejestnudne.pl/o-serwisie)" }, signal: AbortSignal.timeout(ms), redirect: "follow" });
    if (!r.ok || !/text\/html/i.test(r.headers.get("content-type") || "")) return null;
    const $ = cheerio.load(await r.text());
    $("script,style,noscript,nav,footer").remove();
    return $("body").text();
  } catch { return null; }
}
