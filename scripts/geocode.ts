/** Geokodowanie miejscowości startu przez Nominatim (OSM), 1 zapytanie/s, cache data/geo.json. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { REGION_CENTER } from "../lib/regions";
type Geo = { lat: number; lng: number; display: string; at: string; woj?: string };
const UA = "plaskiejestnudne-bot/0.1 (piotr.michalowski85@gmail.com)";
const normWoj = (s?: string) => s ? s.toLowerCase().replace(/^województwo\s+/, "").trim() : undefined;
const races = (JSON.parse(readFileSync("data/races.json", "utf8")) as { races: { city: string; region: string }[] }).races;
const cache: Record<string, Geo | null> = existsSync("data/geo.json") ? JSON.parse(readFileSync("data/geo.json", "utf8")) : {};
const key = (c: string) => c.trim().toLowerCase();
const clean = (c: string) => c.replace(/\b(k\/|koło|k\.)\s*\S+/gi, "").replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const cities = [...new Set(races.map((r) => r.city).filter(Boolean))];
  const regionOf: Record<string, string> = {}; for (const r of races) if (r.city && r.region && !regionOf[key(r.city)]) regionOf[key(r.city)] = r.region;
  const force = process.argv.includes("--all");
  const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], (a[1] - b[1]) * 0.65);
  let n = 0, miss = 0;
  for (const city of cities) {
    if (key(city) in cache && !force) continue;
    const variants = [clean(city), clean(city).split(" ").slice(0, 2).join(" "), clean(city).split(/\s|-/)[0]].filter((v, i, a) => v && a.indexOf(v) === i);
    let got: Geo | null = null;
    for (const q of variants) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=pl&addressdetails=1&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { "user-agent": UA, "accept-language": "pl" } });
      await sleep(1100);
      if (!r.ok) continue;
      let j = (await r.json()) as { lat: string; lon: string; display_name: string; type?: string; class?: string; address?: { state?: string } }[];
      j = j.filter((x) => !/river|stream|waterway/i.test(x.type || "") && x.class !== "waterway");
      if (!j.length) continue;
      // przy znanym pasmie wybierz wynik najbliższy jego środka (rozstrzyga "Wisła" miasto vs inne "Wisła")
      const rc = REGION_CENTER[regionOf[key(city)] || ""];
      const best = rc ? j.slice().sort((a, b) => dist([+a.lat, +a.lon], rc) - dist([+b.lat, +b.lon], rc))[0] : j[0];
      if (rc && dist([+best.lat, +best.lon], rc) > 1.5 && q !== variants[variants.length - 1]) continue; // za daleko od pasma: spróbuj kolejnego wariantu
      got = { lat: +best.lat, lng: +best.lon, display: best.display_name.split(",").slice(0, 3).join(","), at: new Date().toISOString().slice(0, 10), woj: normWoj(best.address?.state) }; break;
    }
    cache[key(city)] = got; got ? n++ : miss++;
    writeFileSync("data/geo.json", JSON.stringify(cache, null, 1));
  }
  // województwo dla wpisów sprzed addressdetails: reverse geocoding po współrzędnych
  let w = 0;
  for (const [k, g] of Object.entries(cache)) {
    if (!g || g.woj) continue;
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=8&addressdetails=1&lat=${g.lat}&lon=${g.lng}`, { headers: { "user-agent": UA, "accept-language": "pl" } });
    await sleep(1100);
    if (!r.ok) continue;
    const j = (await r.json()) as { address?: { state?: string } };
    const woj = normWoj(j.address?.state);
    if (woj) { cache[k] = { ...g, woj }; w++; writeFileSync("data/geo.json", JSON.stringify(cache, null, 1)); }
  }
  if (w) console.log(`województwa uzupełnione: ${w}`);
  const total = Object.values(cache).filter(Boolean).length;
  console.log(`geo: nowe ${n}, brak ${miss}, łącznie ${total}/${cities.length} miejscowości; brakujące:`, cities.filter((c) => !cache[key(c)]).slice(0, 15));
})();
