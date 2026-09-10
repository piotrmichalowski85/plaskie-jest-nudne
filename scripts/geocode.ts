/** Geokodowanie miejscowości startu przez Nominatim (OSM), 1 zapytanie/s, cache data/geo.json. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
type Geo = { lat: number; lng: number; display: string; at: string };
const races = (JSON.parse(readFileSync("data/races.json", "utf8")) as { races: { city: string; region: string }[] }).races;
const cache: Record<string, Geo | null> = existsSync("data/geo.json") ? JSON.parse(readFileSync("data/geo.json", "utf8")) : {};
const key = (c: string) => c.trim().toLowerCase();
const clean = (c: string) => c.replace(/\b(k\/|koło|k\.)\s*\S+/gi, "").replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const cities = [...new Set(races.map((r) => r.city).filter(Boolean))];
  let n = 0, miss = 0;
  for (const city of cities) {
    if (key(city) in cache) continue;
    const variants = [clean(city), clean(city).split(" ").slice(0, 2).join(" "), clean(city).split(/\s|-/)[0]].filter((v, i, a) => v && a.indexOf(v) === i);
    let got: Geo | null = null;
    for (const q of variants) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pl&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { "user-agent": "plaskiejestnudne-bot/0.1 (piotr.michalowski85@gmail.com)", "accept-language": "pl" } });
      await sleep(1100);
      if (!r.ok) continue;
      const j = (await r.json()) as { lat: string; lon: string; display_name: string }[];
      if (j[0]) { got = { lat: +j[0].lat, lng: +j[0].lon, display: j[0].display_name.split(",").slice(0, 3).join(","), at: new Date().toISOString().slice(0, 10) }; break; }
    }
    cache[key(city)] = got; got ? n++ : miss++;
    writeFileSync("data/geo.json", JSON.stringify(cache, null, 1));
  }
  const total = Object.values(cache).filter(Boolean).length;
  console.log(`geo: nowe ${n}, brak ${miss}, łącznie ${total}/${cities.length} miejscowości; brakujące:`, cities.filter((c) => !cache[key(c)]).slice(0, 15));
})();
