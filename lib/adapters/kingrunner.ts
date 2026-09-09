import * as cheerio from "cheerio";
import { extractFromText } from "../enrich";

export type KRRow = { polska: boolean; event: string; variant: string; km: number; date: string; city: string; typ: string; surface: string; difficulty: string; href?: string };

const UA = "Mozilla/5.0 (compatible; plaskiejestnudne-bot/0.1; +https://plaskiejestnudne.pl/o-serwisie)";
async function get(url: string) {
  const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.text();
}

/** kingrunner.com/biegi: tabela, jeden wiersz = jeden dystans; strony ?page=N */
export async function kingrunnerRows(maxPages = 12): Promise<KRRow[]> {
  const out: KRRow[] = [];
  for (let p = 1; p <= maxPages; p++) {
    const $ = cheerio.load(await get(`https://www.kingrunner.com/biegi${p > 1 ? `?page=${p}` : ""}`));
    const rows = $("table.race-list tr").toArray().slice(1);
    if (!rows.length) break;
    for (const tr of rows) {
      const c = $(tr).find("td").toArray().map((td) => $(td).text().replace(/\s+/g, " ").trim());
      if (c.length < 8) continue;
      const [, name, dist, date, place, typ, surface, difficulty] = c;
      const m = date.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      const km = parseFloat((dist.match(/(\d+(?:[.,]\d+)?)\s*km/) || [])[1]?.replace(",", ".") || "");
      if (!m || !isFinite(km)) continue;
      const [event, ...rest] = name.split(/\s+-\s+/);
      out.push({ polska: /^Polska\b/i.test(place), event: event.trim(), variant: rest.join(" - "), km, date: `${m[3]}-${m[2]}-${m[1]}`, city: place.replace(/^Polska,\s*/, "").trim(), typ, surface, difficulty, href: $(tr).find("a[href*='/bieg/']").first().attr("href") });
    }
  }
  return out;
}

/** strona biegu na kingrunner: link "Strona biegu" do organizatora + ewentualne D+ z tekstu */
export async function kingrunnerDetail(href: string): Promise<{ url?: string; dplus?: number }> {
  try {
    const $ = cheerio.load(await get(href));
    const a = $("a").filter((_, el) => /strona biegu/i.test($(el).text())).first().attr("href");
    $("script,style,nav,footer").remove();
    const f = extractFromText($("body").text());
    return { url: a && /^https?:/.test(a) ? a : undefined, dplus: f?.dplusMax };
  } catch { return {}; }
}
