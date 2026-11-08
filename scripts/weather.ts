/**
 * Pogoda dla nadchodzących biegów (Open-Meteo, bez klucza, CC BY 4.0), liczona w odświeżaniu danych (GitHub Actions), nie w runtime.
 * - prognoza: biegi startujące w ciągu 16 dni (daily: temperatura, opady, prawdopodobieństwo opadów, wiatr, kod pogody),
 * - "typowa pogoda w tym terminie": 10 ostatnich pełnych lat, okno +-7 dni od daty startu, w miejscu startu (cache: liczymy raz na miejsce i termin).
 * Wynik: data/weather.json. Błąd sieci nie psuje danych: zostaje poprzedni wpis.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { Dataset } from "../lib/types";
import type { WeatherFile, Climate, ForecastDay } from "../lib/weather";

const OUT = "data/weather.json";
const ds = JSON.parse(readFileSync("data/races.json", "utf8")) as Dataset;
const geo = JSON.parse(readFileSync("data/geo.json", "utf8")) as Record<string, { lat: number; lng: number } | null>;
const prev: WeatherFile = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { generatedAt: "", races: {} };
const today = new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const UA = { "user-agent": "plaskiejestnudne.pl (kalendarz biegów, niekomercyjny; kontakt@plaskiejestnudne.pl)" };

async function getJson(url: string): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
      if (r.ok) return (await r.json()) as Record<string, unknown>;
      if (r.status === 429) await sleep(5000 * (i + 1)); else return null;
    } catch { await sleep(1500); }
  }
  return null;
}
type Daily = { time: string[]; [k: string]: (number | null)[] | string[] };

async function climate(lat: number, lng: number, date: string): Promise<Climate | null> {
  const thisYear = Number(today.slice(0, 4));
  const years = Array.from({ length: 10 }, (_, i) => thisYear - 10 + i); // 10 pełnych lat przed bieżącym
  const tmax: number[] = [], tmin: number[] = [], pr: number[] = [];
  for (const y of years) {
    const mid = `${y}${date.slice(4)}`.replace(/-02-29$/, "-02-28");
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${addDays(mid, -7)}&end_date=${addDays(mid, 7)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FWarsaw`;
    const j = await getJson(url);
    const d = j?.daily as Daily | undefined;
    if (!d) return null;
    (d.temperature_2m_max as (number | null)[]).forEach((v) => v !== null && tmax.push(v));
    (d.temperature_2m_min as (number | null)[]).forEach((v) => v !== null && tmin.push(v));
    (d.precipitation_sum as (number | null)[]).forEach((v) => v !== null && pr.push(v));
    await sleep(120);
  }
  if (tmax.length < 50) return null;
  const avg = (a: number[]) => Math.round((a.reduce((s, v) => s + v, 0) / a.length) * 10) / 10;
  return {
    key: `${lat},${lng},${date.slice(5)},${years[0]}`, years: `${years[0]}-${years[years.length - 1]}`, days: tmax.length,
    tmax: avg(tmax), tmin: avg(tmin), tmaxHi: Math.max(...tmax), tminLo: Math.min(...tmin),
    rainShare: Math.round((pr.filter((v) => v >= 1).length / pr.length) * 100), precip: avg(pr),
  };
}

async function forecast(lat: number, lng: number, start: string, end: string): Promise<ForecastDay[] | null> {
  const last = addDays(today, 15);
  const s = start < today ? today : start, e = end > last ? last : end;
  if (s > e) return null;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code&timezone=Europe%2FWarsaw`;
  const j = await getJson(url);
  const d = j?.daily as Daily | undefined;
  if (!d) return null;
  const n = (k: string, i: number) => { const v = (d[k] as (number | null)[])[i]; return v === null || v === undefined ? undefined : Math.round(v * 10) / 10; };
  return d.time.map((date, i) => ({ date, tmax: n("temperature_2m_max", i), tmin: n("temperature_2m_min", i), precip: n("precipitation_sum", i), prob: n("precipitation_probability_max", i), wind: n("wind_speed_10m_max", i), code: n("weather_code", i) }));
}

async function main() {
const out: WeatherFile = { generatedAt: new Date().toISOString(), races: {} };
let nc = 0, nf = 0, kept = 0;
for (const r of ds.races.filter((x) => x.dateEnd >= today)) {
  const g = geo[r.city.trim().toLowerCase()];
  if (!g) continue;
  const lat = Math.round(g.lat * 100) / 100, lng = Math.round(g.lng * 100) / 100;
  const old = prev.races[r.id];
  const entry: WeatherFile["races"][string] = {};
  const key = `${lat},${lng},${r.dateStart.slice(5)},${Number(today.slice(0, 4)) - 10}`;
  if (old?.climate?.key === key) { entry.climate = old.climate; kept++; }
  else { const c = await climate(lat, lng, r.dateStart); if (c) { entry.climate = c; nc++; } else if (old?.climate) entry.climate = old.climate; }
  if (r.dateStart <= addDays(today, 15)) {
    const f = await forecast(lat, lng, r.dateStart, r.dateEnd);
    if (f?.length) { entry.forecast = { at: today, days: f }; nf++; }
    await sleep(120);
  }
  if (entry.climate || entry.forecast) out.races[r.id] = entry;
}
writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`pogoda: klimat nowy ${nc}, z cache ${kept}, prognozy ${nf}, biegów ${Object.keys(out.races).length}`);
}
main();
