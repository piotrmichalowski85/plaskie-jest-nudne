import type { NextRequest } from "next/server";
import type { Race } from "@/lib/types";
import { allRaces, raceById, today } from "@/lib/data";
import { nextEditionOf } from "@/lib/seo";
import { weatherFor } from "@/lib/weather";
import { weatherBadgeSvg, liveForecast, inForecastRange } from "@/lib/plakietka";
import slugRedirects from "@/data/redirects.json";

/**
 * /odznaka/pogoda/<id>.svg: plakietka z pogodą na dzień biegu, do <img> na stronie organizatora.
 * Bieg w zasięgu prognozy: świeża prognoza z Open-Meteo (najwyżej jedno zapytanie na bieg na 3 h), przy błędzie sieci dane z data/weather.json.
 * Odpowiedź trzyma CDN (3 h) i przeglądarka (1 h); adres z parametrami przekierowujemy na czysty, żeby parametrem nie dało się ominąć cache i mnożyć zapytań do Open-Meteo.
 */
export const dynamic = "force-dynamic";

const redirects = slugRedirects as Record<string, string>;
const DATED = /^(.+)-(\d{4}-\d{2}-\d{2})$/;
/** bieg po id; stary id z data/redirects.json; a gdy organizator przesunął termin (id zawiera datę), ta sama impreza w najbliższym terminie (do 120 dni) */
function findRace(id: string): Race | undefined {
  const hit = raceById(id) ?? (redirects[id] ? raceById(redirects[id]) : undefined);
  if (hit) return hit;
  const m = DATED.exec(id);
  if (!m) return undefined;
  const t = Date.parse(m[2]);
  return allRaces
    .map((r) => ({ r, x: DATED.exec(r.id) }))
    .filter(({ x }) => x?.[1] === m[1])
    .map(({ r }) => ({ r, days: Math.abs(Date.parse(r.dateStart) - t) / 86400000 }))
    .filter((c) => c.days <= 120)
    .sort((a, b) => a.days - b.days)[0]?.r;
}

const notFound = () => new Response("not found", { status: 404, headers: { "cache-control": "public, max-age=300, s-maxage=600" } });

export async function GET(req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const m = /^([a-z0-9-]+)\.svg$/.exec((await params).file);
  if (!m) return notFound();
  const r = findRace(m[1]);
  if (!r) return notFound();
  if (req.nextUrl.search) return new Response(null, { status: 308, headers: { location: req.nextUrl.pathname } });
  const t = today();
  const file = weatherFor(r.id);
  const live = await liveForecast(r, t);
  // prognoza z pliku w zasięgu, ale bez świeżej: krótszy cache, żeby szybciej ponowić zapytanie
  const fallback = !live && inForecastRange(r, t);
  const svg = weatherBadgeSvg({ race: r, weather: { climate: file?.climate, forecast: live ?? file?.forecast }, today: t, nextEdition: r.dateEnd < t ? nextEditionOf(r, allRaces) : undefined });
  return new Response(svg, { headers: {
    "content-type": "image/svg+xml; charset=utf-8",
    "cache-control": fallback ? "public, max-age=600, s-maxage=900" : "public, max-age=3600, s-maxage=10800, stale-while-revalidate=3600",
    "x-robots-tag": "noindex",
    "x-plakietka": r.dateEnd < t ? "miniony" : live ? "prognoza-swieza" : fallback ? "plik-zapas" : "plik",
  } });
}
