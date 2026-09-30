import * as cheerio from "cheerio";
import type { Signup } from "../zapisy";

const UA = "Mozilla/5.0 (compatible; plaskiejestnudne-bot/0.1; +https://plaskiejestnudne.pl/o-serwisie)";
type Child = { id: number; name: string; category: string; date_start: string; registration_start?: string; registration_end?: string; distance?: string; city?: string; country?: string; p_limit?: number | null; link: string; reg_link?: string; organizer?: string; participants_count?: number; is_registration_active?: boolean; original_id?: number; parent_id?: number };
type Page = { events: string; nextUrl?: string | null; children?: Record<string, Child[]>; exceededLimit?: boolean; noEvents?: boolean };

export type B4Event = { parentId: string; name: string; city: string; organizer: string; slug: string; www?: string; dateStart: string; dateEnd: string; children: Child[]; signup: Signup };

const MOUNTAIN_CAT = new Set(["SportMountainRaces", "SportCrossCountryRaces"]);
const KW = /trail|górsk|gorsk|ultra|skyrun|vertical|przełaj|przelaj|cross|maraton\s+g/i;

/** Publiczny kalendarz b4sportonline: JSON (HTML stron + strukturalne "children"). Zwraca imprezy górskie/trailowe. */
export async function b4Events(): Promise<B4Event[]> {
  const blocks = new Map<string, { name: string; city: string; www?: string; regIds: number[] }>();
  let children: Record<string, Child[]> = {};
  let url: string | null = "/kalendarz/searching/offset/10?lang=pl";
  for (let i = 0; i < 20 && url; i++) {
    const r = await fetch(`https://b4sportonline.pl${url}`, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) break;
    let j: Page; try { j = (await r.json()) as Page; } catch { break; }
    if (j.children && Object.keys(j.children).length > Object.keys(children).length) children = j.children;
    const $ = cheerio.load(j.events || "");
    $(".single-search-result-container").each((_, el) => {
      const id = $(el).attr("data-event-id") || ""; if (!id) return;
      const text = $(el).text().replace(/\s+/g, " ");
      const name = $(el).find("h5").first().text().replace(/\s+/g, " ").trim();
      if (!name) return;
      const www = $(el).find("a").filter((_, a) => /strona www/i.test($(a).text())).first().attr("href") || undefined;
      const regIds = $(el).find("a[href*='/zapisy_na_']").toArray().map((a) => Number(($(a).attr("href") || "").split("/").pop())).filter((n) => n > 0);
      void text;
      blocks.set(id, { name, city: "", www: www && /^https?:/.test(www) && !/b4sportonline/.test(www) ? www : undefined, regIds });
    });
    if (j.noEvents || j.exceededLimit) break;
    url = j.nextUrl || null;
  }
  // grupowanie po rodzicu z JSON (children), nazwa rodzica z bloku HTML (po id zapisów)
  const byParent = new Map<string, Child[]>();
  for (const [pid, arr] of Object.entries(children)) byParent.set(pid, arr.filter((c) => (c.country || "PL") === "PL"));
  const out: B4Event[] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const [pid, arr] of byParent) {
    const kids = arr.filter((c) => MOUNTAIN_CAT.has(c.category) || (KW.test(c.name) && c.category === "Running"));
    if (!kids.length) continue;
    const ids = new Set(kids.map((c) => c.original_id ?? -1));
    const block = [...blocks.values()].find((b) => b.regIds.some((x) => ids.has(x)));
    const dates = kids.map((c) => c.date_start.slice(0, 10)).sort();
    const active = kids.filter((c) => c.is_registration_active);
    const ends = kids.map((c) => c.registration_end?.slice(0, 10)).filter(Boolean).sort() as string[];
    const limit = kids.reduce((a, c) => a + (c.p_limit || 0), 0) || undefined;
    const registered = kids.reduce((a, c) => a + (c.participants_count || 0), 0);
    const slug = kids[0].link;
    const b4url = `https://b4sportonline.pl/${slug}/`;
    const status: Signup["status"] = active.length ? "open" : ends.length && ends[ends.length - 1] >= today ? "open" : "closed";
    const name = (block?.name || kids.map((c) => c.name).sort((a, b) => a.length - b.length)[0]).replace(/\s+\d{1,3}\s*(km)?$/i, "").replace(/\s+20\d{2}$/, "").trim();
    const rawCity = (kids.find((c) => c.city)?.city || "").trim();
    const city = rawCity.toLowerCase().replace(/(^|[\s\-])(\p{L})/gu, (m) => m.toUpperCase());
    out.push({ parentId: pid, name, city, organizer: kids[0].organizer || "", slug, www: block?.www, dateStart: dates[0], dateEnd: dates[dates.length - 1], children: kids,
      signup: { status, until: ends.length ? ends[ends.length - 1] : undefined, limit, registered, source: "zapisy", sourceUrl: b4url, checkedAt: today } });
  }
  return out;
}
