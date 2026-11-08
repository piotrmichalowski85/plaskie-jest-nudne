/** Pogoda na stronie biegu: dane z data/weather.json (scripts/weather.ts, Open-Meteo, CC BY 4.0). */
import data from "@/data/weather.json";

export type Climate = { key: string; years: string; days: number; tmax: number; tmin: number; tmaxHi: number; tminLo: number; rainShare: number; precip: number };
export type ForecastDay = { date: string; tmax?: number; tmin?: number; precip?: number; prob?: number; wind?: number; code?: number };
export type WeatherFile = { generatedAt: string; races: Record<string, { climate?: Climate; forecast?: { at: string; days: ForecastDay[] } }> };

const w = data as WeatherFile;
export const weatherFor = (id: string) => w.races[id];

/** kody pogody WMO -> opis po polsku */
export function codeLabel(c?: number): string | undefined {
  if (c === undefined) return undefined;
  if (c === 0) return "bezchmurnie";
  if (c <= 2) return "małe zachmurzenie";
  if (c === 3) return "pochmurno";
  if (c === 45 || c === 48) return "mgła";
  if (c >= 51 && c <= 57) return "mżawka";
  if (c >= 61 && c <= 67) return "deszcz";
  if (c >= 71 && c <= 77) return "śnieg";
  if (c >= 80 && c <= 82) return "przelotny deszcz";
  if (c === 85 || c === 86) return "przelotny śnieg";
  if (c >= 95) return "burza";
  return undefined;
}
export const deg = (v: number) => `${Math.round(v)}°C`;
