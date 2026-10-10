import type { Race } from "./types";
import { fmtDate, fmtKm, scoreLabel } from "./format";
import { eventCore, slugify } from "./normalize";

export const SITE = "https://plaskiejestnudne.pl";
const SMALL = new Set(["w", "i", "na", "do", "z", "o", "po", "pod", "od", "dla", "we", "ze", "im", "przez", "u"]);

/** "BARAN TRAIL RACE WINTER EDITION" -> "Baran Trail Race Winter Edition"; skróty do 3 liter (PUT, WRC, ZUK, VK) zostają */
export function niceName(name: string): string {
  if (!/\p{L}/u.test(name) || name !== name.toUpperCase()) return name;
  return name.split(/\s+/).map((w, i) => {
    const letters = w.replace(/[^\p{L}]/gu, "");
    if (!letters) return w;
    if (letters.length <= 3 && !SMALL.has(letters.toLowerCase())) return w;
    const lw = w.toLowerCase();
    if (i > 0 && SMALL.has(letters.toLowerCase())) return lw;
    return lw.replace(/\p{L}/u, (c) => c.toUpperCase());
  }).join(" ");
}

/** "WRC" + "WRC - Waligóra Run Cross: HALF WRC..." -> "Waligóra Run Cross (WRC)" */
export function expandAbbrev(eventName: string, name: string): string {
  const letters = eventName.replace(/[^\p{L}]/gu, "");
  if (letters.length > 5 || letters !== letters.toUpperCase()) return eventName;
  const m = name.match(new RegExp(`^${eventName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-:]\\s*([^:,]{4,60}?)\\s*(?:[:,]|$)`));
  if (!m) return eventName;
  const full = niceName(m[1].trim());
  return full.toUpperCase() === eventName ? eventName : `${full} (${eventName})`;
}

export const year = (r: Race) => r.dateStart.slice(0, 4);
const w1 = (r: Race) => eventCore(r.eventName).split("-")[0] || "";
const ck = (r: Race) => slugify(r.city).split("-")[0];

/** kolejna edycja tej imprezy w bazie (ta sama nazwa rdzeniowa, ta sama miejscowość albo ten sam pełny rdzeń), jeśli jest */
export function nextEditionOf(r: Race, all: Race[]): Race | undefined {
  return all.filter((x) => x.id !== r.id && x.dateStart > r.dateEnd && w1(x) === w1(r) && w1(r).length >= 4 && (ck(x) === ck(r) || eventCore(x.eventName) === eventCore(r.eventName)))
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart))[0];
}
export function prevEditionOf(r: Race, all: Race[]): Race | undefined {
  return all.filter((x) => x.id !== r.id && x.dateEnd < r.dateStart && w1(x) === w1(r) && w1(r).length >= 4 && (ck(x) === ck(r) || eventCore(x.eventName) === eventCore(r.eventName)))
    .sort((a, b) => b.dateStart.localeCompare(a.dateStart))[0];
}

export function raceTitle(r: Race): string {
  const hasLimit = r.elevations.some((e) => e.limitH);
  return `${r.eventName} ${year(r)}: termin, dystanse, zapisy${hasLimit ? ", limit czasu" : ""}`;
}

export function raceDescription(r: Race, today: string): string {
  const past = r.dateEnd < today;
  const km = r.distancesKm.length ? (r.distancesKm.length > 4 ? `${fmtKm(r.minKm)} do ${fmtKm(r.maxKm)}` : r.distancesKm.map((k) => (k % 1 === 0 ? k : k.toFixed(1).replace(".", ","))).join("/") + " km") : "";
  const dplus = r.elevations.filter((e) => e.dplus).map((e) => e.dplus!);
  const limit = r.elevations.filter((e) => e.limitH).map((e) => e.limitH!);
  const parts = [
    `${r.eventName}, ${fmtDate(r.dateStart, r.dateEnd)}, ${r.city}${r.region ? ` (${r.region})` : ""}.`,
    km ? `Dystanse ${km}${dplus.length ? `, przewyższenie od +${Math.min(...dplus)} m` : ""}${limit.length ? `, limit czasu ${Math.min(...limit)}-${Math.max(...limit)} h`.replace(/(\d+)-\1 h/, "$1 h") : ""}.` : "Dystanse: sprawdź u organizatora.",
    past ? "Edycja odbyła się." : r.provisional ? "Termin wstępny ze strony organizatora." : r.signup?.status === "open" ? `Zapisy otwarte${r.signup.until ? ` do ${r.signup.until.split("-").reverse().join(".")}` : ""}.` : r.signup?.status === "closed" ? "Zapisy zamknięte." : "",
    `${r.regulaminUrl ? (r.gear ? "Regulamin i sprzęt obowiązkowy. " : "Regulamin. ") : ""}Dla początkujących: ${scoreLabel(r.beginnerScore)}.`,
  ].filter(Boolean);
  let d = parts.join(" ");
  if (d.length > 165) d = parts.slice(0, 3).join(" ");
  if (d.length > 165) d = parts.slice(0, 2).join(" ");
  return d;
}

export function raceJsonLd(r: Race, geo: { lat: number; lng: number } | undefined, today: string) {
  const host = (u?: string) => { try { return u ? new URL(u).hostname.replace(/^www\./, "") : undefined; } catch { return undefined; } };
  const signupUrl = r.signup?.sourceUrl && r.signup.source === "zapisy" ? r.signup.sourceUrl : r.url;
  const offers = signupUrl && r.signup && r.signup.status !== "unknown" && r.dateEnd >= today ? {
    "@type": "Offer", url: signupUrl, availability: r.signup.status === "open" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    ...(r.signup.until ? { validThrough: r.signup.until } : {}),
  } : undefined;
  const event = {
    "@context": "https://schema.org", "@type": "SportsEvent",
    name: `${r.eventName} ${year(r)}`, description: raceDescription(r, today),
    startDate: r.dateStart, endDate: r.dateEnd,
    eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE}/bieg/${r.id}`, image: [`${SITE}/bieg/${r.id}/opengraph-image`],
    location: { "@type": "Place", name: r.city, address: { "@type": "PostalAddress", addressLocality: r.city, addressRegion: r.region || undefined, addressCountry: "PL" }, ...(geo ? { geo: { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng } } : {}) },
    sport: "Trail running",
    ...(r.url ? { organizer: { "@type": "Organization", name: host(r.url) || "organizator", url: r.url }, sameAs: [r.url] } : {}),
    ...(offers ? { offers } : {}),
    ...(r.distancesKm.length ? { subEvent: r.elevations.map((e) => ({ "@type": "SportsEvent", name: `${r.eventName} ${fmtKm(e.km)}`, startDate: r.dateStart, location: { "@type": "Place", name: r.city }, ...(e.dplus ? { description: `${fmtKm(e.km)}, przewyższenie +${e.dplus} m${e.limitH ? `, limit ${e.limitH} h` : ""}` } : {}) })) } : {}),
  };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Płaskie jest nudne", item: SITE },
    { "@type": "ListItem", position: 2, name: "Kalendarz biegów", item: `${SITE}/biegi` },
    { "@type": "ListItem", position: 3, name: `${r.eventName} ${year(r)}`, item: `${SITE}/bieg/${r.id}` },
  ] };
  return [event, crumbs];
}

export const siteJsonLd = {
  "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: SITE, name: "Płaskie jest nudne", description: "Kalendarz biegów górskich, trailowych i przełajowych w Polsce dla początkujących.", inLanguage: "pl-PL", publisher: { "@id": `${SITE}/#org` } },
    { "@type": "Organization", "@id": `${SITE}/#org`, name: "Płaskie jest nudne", url: SITE, logo: `${SITE}/icon-512.png`, email: "kontakt@plaskiejestnudne.pl" },
  ],
};
