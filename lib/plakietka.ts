/**
 * Plakietka z pogodą na dzień biegu (/odznaka/pogoda/<id>.svg): obrazek do wklejenia na stronę organizatora, opakowany w link do strony biegu.
 * Stany: prognoza (bieg w zasięgu 16 dni), "typowo w tym terminie" (dalej), sam termin (brak danych), "bieg odbył się" (miniony).
 * Wszystkie stany mają ten sam rozmiar, bo szerokość i wysokość są wpisane w kod u organizatora.
 * Tekst fontem systemowym: obrazek w <img> nie ładuje fontów strony, więc szerokość tekstu szacujemy i skracamy z zapasem.
 */
import type { Race } from "./types";
import type { Climate, ForecastDay } from "./weather";
import { codeLabel, deg } from "./weather";
import { weatherKind, type WeatherKind } from "@/components/WeatherIcon";
import { fmtDate, dow } from "./format";
import { geoFor } from "./geo";

export const BADGE_W = 300, BADGE_H = 170;
/** prognoza Open-Meteo sięga 16 dni: dziś i 15 kolejnych (tak samo w scripts/weather.ts) */
const RANGE_DAYS = 15;
type Forecast = { at: string; days: ForecastDay[] };
export type BadgeWeather = { climate?: Climate; forecast?: Forecast };

const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dm = (iso: string) => `${Number(iso.slice(8, 10))}.${iso.slice(5, 7)}`;
const dmy = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const inForecastRange = (r: Race, today: string) => r.dateEnd >= today && r.dateStart <= addDays(today, RANGE_DAYS);

/* ---------- szerokość tekstu: przybliżone metryki Arial (em), z zapasem na szersze fonty zastępcze ---------- */
const W: [RegExp, number][] = [
  [/[ijl.,:;!|'’ ]/, 0.28], [/[ftrI()\-[\]/]/, 0.34], [/[mw]/, 0.8], [/[MW]/, 0.9], [/[%@]/, 0.95], [/°/, 0.4], [/…/, 1],
  [/[0-9]/, 0.56], [/[A-Z]/, 0.7], [/[a-z]/, 0.55],
];
const base = (ch: string) => ch.normalize("NFD").replace(/[̀-ͯ]/g, "").replace("ł", "l").replace("Ł", "L");
const textWidth = (s: string, size: number, bold = false) =>
  [...s].reduce((sum, ch) => sum + (W.find(([re]) => re.test(base(ch)))?.[1] ?? 0.6), 0) * size * (bold ? 1.05 : 1) * 1.04;
/** tekst mieszczący się w max px: najpierw mniejszy font (do min), potem skrót z wielokropkiem */
function fit(s: string, max: number, size: number, min: number, bold = false): { s: string; size: number } {
  for (let z = size; z >= min; z -= 0.5) if (textWidth(s, z, bold) <= max) return { s, size: z };
  let cut = s;
  while (cut.length > 1 && textWidth(cut + "…", min, bold) > max) cut = cut.slice(0, -1);
  return { s: cut.replace(/[\s,.:;|\-(]+$/, "") + "…", size: min };
}
const text = (s: string, x: number, y: number, size: number, o: { bold?: boolean; fill?: string; anchor?: "end" } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}"${o.bold ? ' font-weight="700"' : ""}${o.anchor ? ` text-anchor="${o.anchor}"` : ""} fill="${o.fill ?? INK}">${esc(s)}</text>`;
const line = (s: string, x: number, y: number, size: number, min: number, max: number, o: Parameters<typeof text>[4] = {}) => {
  const f = fit(s, max, size, min, o.bold);
  return text(f.s, x, y, f.size, o);
};

/* ---------- ikony: ta sama geometria i kolory co components/WeatherIcon.tsx (tam JSX, tu tekst SVG), pole 64x64 ---------- */
const MOSS = "#2f5d3a", INK = "#1f4128", SOFT = "#3d4d34", MUTED = "#5f665b";
const SUN = "#e8b84a", SUN_EDGE = "#b98510", CLOUD = "#dfe5ea", CLOUD_EDGE = "#7b8792", RAIN = "#2f7fb8", SNOW = "#5a9bc4", BOLT = "#e0a11b", CLAY = "#c9632f";
const sun = (cx = 32, cy = 32, r = 11) => `<g stroke="${SUN_EDGE}" stroke-width="2.5" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
  const rad = (a * Math.PI) / 180, x = Math.cos(rad), y = Math.sin(rad);
  return `<path d="M${(cx + x * (r + 5)).toFixed(1)} ${(cy + y * (r + 5)).toFixed(1)}L${(cx + x * (r + 10)).toFixed(1)} ${(cy + y * (r + 10)).toFixed(1)}"/>`;
}).join("")}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${SUN}"/></g>`;
const cloud = (dy = 0) => `<path transform="translate(0 ${dy})" d="M19 46a10 10 0 0 1-1.2-19.9A14 14 0 0 1 44.6 23 11.5 11.5 0 0 1 46 46z" fill="${CLOUD}" stroke="${CLOUD_EDGE}" stroke-width="2.5" stroke-linejoin="round"/>`;
const drops = (xs: number[], long = false) => `<g stroke="${RAIN}" stroke-width="3" stroke-linecap="round">${xs.map((x) => `<path d="M${x} 46l${long ? -3 : -1.5} ${long ? 9 : 4.5}"/>`).join("")}</g>`;
const flakes = (xs: number[]) => `<g stroke="${SNOW}" stroke-width="2" stroke-linecap="round">${xs.map((x, i) => {
  const y = i % 2 ? 54 : 49;
  return `<path d="M${x - 3.5} ${y}h7M${x} ${y - 3.5}v7M${x - 2.5} ${y - 2.5}l5 5M${x + 2.5} ${y - 2.5}l-5 5"/>`;
}).join("")}</g>`;
const ICON: Record<WeatherKind, () => string> = {
  slonce: () => sun(),
  "male-chmury": () => `${sun(24, 22, 9)}<path d="M25 50a8.5 8.5 0 0 1-1-16.9A12 12 0 0 1 46.8 30.6 9.8 9.8 0 0 1 48 50z" fill="${CLOUD}" stroke="${CLOUD_EDGE}" stroke-width="2.5" stroke-linejoin="round"/>`,
  chmury: () => cloud(),
  mgla: () => `${cloud(-8)}<g stroke="${CLOUD_EDGE}" stroke-width="3" stroke-linecap="round"><path d="M12 46h40M18 54h28"/></g>`,
  mzawka: () => cloud(-8) + drops([24, 33, 42]),
  deszcz: () => cloud(-8) + drops([23, 31, 39, 47], true),
  snieg: () => cloud(-8) + flakes([22, 32, 42]),
  burza: () => `${cloud(-8)}<path d="M34 40l-8 11h6l-3 9 10-13h-6l3-7z" fill="${BOLT}" stroke="${SUN_EDGE}" stroke-width="1.5" stroke-linejoin="round"/>${drops([20, 46])}`,
};
/** termometr: "typowo w tym terminie" nie ma kodu pogody, więc nie udaje prognozy */
const THERMO = `<path d="M32 9a6 6 0 0 0-6 6v23a11 11 0 1 0 12 0V15a6 6 0 0 0-6-6z" fill="#fff" stroke="${CLOUD_EDGE}" stroke-width="2.5"/><path d="M32 47V25" stroke="${CLAY}" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="47" r="6" fill="${CLAY}"/>`;

/* ---------- układ ---------- */
const X = 16, MAXW = BADGE_W - 2 * X;
/** ikona + duża temperatura + dwie linie obok + linia szczegółów pod spodem */
function weatherBlock(icon: string | undefined, temp: string, a: string | undefined, b: string | undefined, details: string) {
  const tx = icon ? 72 : X, rx = tx + textWidth(temp, 34, true) + 8, rmax = BADGE_W - X - rx;
  return [
    icon ? `<g transform="translate(12 68) scale(.84)" fill="none">${icon}</g>` : "",
    text(temp, tx, 108, 34, { bold: true }),
    a ? line(a, rx, b ? 92 : 102, 14, 11.5, rmax, { bold: true, fill: SOFT }) : "",
    b ? line(b, rx, a ? 110 : 102, 13, 11.5, rmax, { fill: SOFT }) : "",
    details ? line(details, X, 136, 13, 11, MAXW, { fill: SOFT }) : "",
  ].join("");
}
const twoLines = (a: string, b: string) => line(a, X, 96, 15, 12, MAXW, { bold: true }) + (b ? line(b, X, 118, 13.5, 11, MAXW, { fill: SOFT }) : "");

export type BadgeInput = { race: Race; weather?: BadgeWeather; today: string; nextEdition?: Race };
/** który stan pokaże plakietka i z jakiego dnia (do testów i nagłówków cache) */
export function badgeState({ race: r, weather: w, today }: BadgeInput): { kind: "past" } | { kind: "forecast"; day: ForecastDay; at: string } | { kind: "climate"; climate: Climate } | { kind: "none" } {
  if (r.dateEnd < today) return { kind: "past" };
  const day = w?.forecast?.days.find((d) => d.date >= today && d.date >= r.dateStart && d.date <= r.dateEnd && d.tmax !== undefined);
  if (day) return { kind: "forecast", day, at: w!.forecast!.at };
  if (w?.climate) return { kind: "climate", climate: w.climate };
  return { kind: "none" };
}

export function weatherBadgeSvg(input: BadgeInput): string {
  const { race: r, today, nextEdition } = input;
  const st = badgeState(input);
  const firstForecast = addDays(r.dateStart, -RANGE_DAYS); // pierwszy dzień, w którym bieg wchodzi w zasięg prognozy
  const date = r.dateEnd !== r.dateStart ? fmtDate(r.dateStart, r.dateEnd) : `${dow(r.dateStart)}, ${fmtDate(r.dateStart)}`;
  const dateCity = `${date} · ${r.city}`;
  let heading = "", body = "", credit = false, summary = "";
  if (st.kind === "past") {
    const when = r.dateEnd !== r.dateStart ? `${dm(r.dateStart)}-${dmy(r.dateEnd)}` : dmy(r.dateStart);
    body = twoLines(`Bieg odbył się ${when}`, nextEdition ? `Kolejna edycja: ${fmtDate(nextEdition.dateStart, nextEdition.dateEnd)}` : "Kolejne biegi w kalendarzu");
    summary = `Bieg odbył się ${when}.`;
  } else if (st.kind === "forecast") {
    const d = st.day, k = weatherKind(d.code), label = codeLabel(d.code);
    heading = `Prognoza na ${dow(d.date)} ${dm(d.date)}, stan z ${dm(st.at)}`;
    const details = [d.prob !== undefined ? `szansa opadów ${Math.round(d.prob)}%` : "", d.wind !== undefined ? `wiatr do ${Math.round(d.wind)} km/h` : ""].filter(Boolean).join(", ");
    body = weatherBlock(k ? ICON[k]() : undefined, deg(d.tmax!), label, d.tmin !== undefined ? `w nocy ${deg(d.tmin)}` : undefined, details);
    credit = true;
    summary = `${heading}: ${[deg(d.tmax!), label, d.tmin !== undefined ? `w nocy ${deg(d.tmin)}` : "", details].filter(Boolean).join(", ")}.`;
  } else if (st.kind === "climate") {
    const c = st.climate;
    heading = `Typowo w tym terminie (lata ${c.years})`;
    const details = `opady w ${c.rainShare}% dni${firstForecast > today ? `, prognoza od ${dm(firstForecast)}` : ""}`;
    body = weatherBlock(THERMO, deg(c.tmax), "średnio w dzień", `w nocy ${deg(c.tmin)}`, details);
    credit = true;
    summary = `${heading}: w dzień średnio ${deg(c.tmax)}, w nocy ${deg(c.tmin)}, opady powyżej 1 mm w ${c.rainShare}% dni.`;
  } else {
    body = firstForecast > today
      ? twoLines("Prognoza pojawi się", `na 16 dni przed startem, czyli ${dmy(firstForecast)}`)
      : twoLines("Prognoza chwilowo niedostępna", "sprawdź ponownie za kilka godzin");
    summary = firstForecast > today ? "Prognoza pojawi się na 16 dni przed startem." : "Prognoza chwilowo niedostępna.";
  }
  const title = `Pogoda na dzień biegu: ${r.eventName}, ${fmtDate(r.dateStart, r.dateEnd)}, ${r.city}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_W}" height="${BADGE_H}" viewBox="0 0 ${BADGE_W} ${BADGE_H}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<desc>${esc(summary)}${credit ? " Dane pogodowe: Open-Meteo.com, licencja CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)." : ""} Plakietka: plaskiejestnudne.pl, kalendarz biegów górskich i trailowych.</desc>
<clipPath id="k"><rect width="${BADGE_W}" height="${BADGE_H}" rx="14"/></clipPath>
<g clip-path="url(#k)" font-family="Arial, Helvetica, sans-serif">
<rect width="${BADGE_W}" height="${BADGE_H}" fill="#fff"/>
<rect y="${BADGE_H - 24}" width="${BADGE_W}" height="24" fill="${MOSS}"/>
${line(r.eventName, X, 27, 17, 14, MAXW, { bold: true })}
${textWidth(dateCity, 12, false) <= MAXW ? line(dateCity, X, 45, 13.5, 12, MAXW, { fill: MUTED }) : line(date, X, 45, 13.5, 11, MAXW, { fill: MUTED })}
${heading ? line(heading, X, 66, 12, 10.5, MAXW, { bold: true, fill: MOSS }) : ""}
${body}
${text("plaskiejestnudne.pl", X, BADGE_H - 7.5, 12.5, { bold: true, fill: "#fff" })}
${credit ? text("dane: Open-Meteo.com", BADGE_W - X, BADGE_H - 7.5, 11.5, { fill: "#f4efe4", anchor: "end" }) : ""}
</g>
<rect x=".75" y=".75" width="${BADGE_W - 1.5}" height="${BADGE_H - 1.5}" rx="13.25" fill="none" stroke="${MOSS}" stroke-width="1.5"/>
</svg>
`;
}

/* ---------- świeża prognoza: to samo zapytanie co forecast() w scripts/weather.ts ---------- */
const TTL_OK = 3 * 3600e3, TTL_FAIL = 10 * 60e3;
/** pamięć instancji funkcji: jedno zapytanie na bieg na 3 h (po błędzie ponowna próba po 10 min), niezależnie od liczby wywołań */
const memo = new Map<string, { until: number; f: Forecast | null }>();

/** prognoza na dni biegu prosto z Open-Meteo; null, gdy bieg jest poza zasięgiem, nie ma współrzędnych albo sieć zawiodła (wtedy zostają dane z pliku) */
export async function liveForecast(r: Race, today: string): Promise<Forecast | null> {
  if (!inForecastRange(r, today)) return null;
  const hit = memo.get(r.id);
  if (hit && hit.until > Date.now() && (!hit.f || hit.f.at === today)) return hit.f;
  const g = geoFor(r.city);
  if (!g) return null;
  const lat = Math.round(g.lat * 100) / 100, lng = Math.round(g.lng * 100) / 100;
  const last = addDays(today, RANGE_DAYS), s = r.dateStart < today ? today : r.dateStart, e = r.dateEnd > last ? last : r.dateEnd;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code&timezone=Europe%2FWarsaw`;
  let f: Forecast | null = null;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    const d = res.ok ? ((await res.json()) as { daily?: { time: string[]; [k: string]: (number | null)[] | string[] } }).daily : undefined;
    if (d?.time?.length) {
      const n = (k: string, i: number) => { const v = (d[k] as (number | null)[] | undefined)?.[i]; return v === null || v === undefined ? undefined : Math.round(v * 10) / 10; };
      f = { at: today, days: d.time.map((date, i) => ({ date, tmax: n("temperature_2m_max", i), tmin: n("temperature_2m_min", i), precip: n("precipitation_sum", i), prob: n("precipitation_probability_max", i), wind: n("wind_speed_10m_max", i), code: n("weather_code", i) })) };
    }
  } catch { /* błąd sieci albo przekroczony czas: plakietka pokaże dane z pliku */ }
  if (memo.size > 500) memo.clear();
  memo.set(r.id, { until: Date.now() + (f ? TTL_OK : TTL_FAIL), f });
  return f;
}
