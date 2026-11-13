/** Kanał RSS: nowe biegi w kalendarzu (z dziennika zmian danych), dla czytników, wyszukiwarek i automatów. */
import { BASE, feedItems } from "@/lib/open-data";
import { generatedAt } from "@/lib/data";
import { fmtDate, fmtKm, scoreLabel } from "@/lib/format";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = feedItems().map(({ race: r, date }) => {
    const km = r.distancesKm.length ? ` Dystanse: ${r.distancesKm.map(fmtKm).join(", ")}.` : "";
    return `<item><title>${esc(`${r.eventName}, ${fmtDate(r.dateStart, r.dateEnd)}`)}</title><link>${BASE}/bieg/${r.id}</link><guid isPermaLink="true">${BASE}/bieg/${r.id}</guid><pubDate>${new Date(`${date}T07:00:00Z`).toUTCString()}</pubDate><description>${esc(`Nowy bieg w kalendarzu: ${r.eventName}, ${fmtDate(r.dateStart, r.dateEnd)}, ${r.city}${r.region ? ` (${r.region})` : ""}.${km} Dla początkujących: ${scoreLabel(r.beginnerScore)}.`)}</description></item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Płaskie jest nudne: nowe biegi górskie i trailowe</title><link>${BASE}/zmiany</link><description>Nowe biegi w kalendarzu biegów górskich i trailowych w Polsce.</description><language>pl</language><lastBuildDate>${new Date(generatedAt).toUTCString()}</lastBuildDate>
<atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
${items.join("\n")}
</channel></rss>
`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
