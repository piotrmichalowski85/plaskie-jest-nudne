import * as cheerio from "cheerio";
const races = (require("../data/races.json") as { races: { url?: string; dateEnd: string; elevations: { dplus?: number }[]; eventName: string }[] }).races;
const today = new Date().toISOString().slice(0, 10);
const up = races.filter((r) => r.url && r.dateEnd >= today && !/elektronicznezapisy|b4sportonline|datasport/.test(r.url!));
(async () => {
  let withTrasa = 0, withGpx = 0, withDplus = 0, withoutDplusHaveTrasa = 0, ok = 0;
  const queue = [...up];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const r = queue.shift()!;
      try {
        const res = await fetch(r.url!, { headers: { "user-agent": "Mozilla/5.0 (compatible; plaskiejestnudne-bot/0.1)" }, signal: AbortSignal.timeout(12000) });
        if (!res.ok) continue; ok++;
        const $ = cheerio.load(await res.text());
        const links = $("a[href]").toArray().map((a) => ({ h: $(a).attr("href") || "", t: $(a).text().trim() }));
        const trasa = links.some((l) => /trasa|trasy|route|dystans|przewyższ/i.test(l.t) || /trasa|route/i.test(l.h));
        const gpx = links.some((l) => /\.gpx|\.kml|mapy\.cz|strava\.com\/routes|komoot|traseo/i.test(l.h));
        const body = $("body").text();
        const dplusOnPage = /(przewyższeni|D\+|\+\s?\d{3,4}\s?m)/i.test(body);
        if (trasa) withTrasa++; if (gpx) withGpx++; if (dplusOnPage) withDplus++;
        const has = r.elevations.some((e) => e.dplus);
        if (!has && (trasa || gpx)) { withoutDplusHaveTrasa++; console.log("kandydat:", r.eventName, "|", r.url, "| trasa:", trasa, "| gpx:", gpx); }
      } catch {}
    }
  }));
  console.log(`\nstrony organizatorów nadchodzących: ${up.length}, odpowiedziało ${ok}; z podstroną Trasa: ${withTrasa}; z GPX/mapą: ${withGpx}; D+ gdziekolwiek na stronie głównej: ${withDplus}; bez D+ u nas, a z Trasą/GPX u organizatora: ${withoutDplusHaveTrasa}`);
})();
