/** Huby (strony zbiorcze) generowane z bazy: pasma/regiony, miesiące, zestawienia tematyczne. Każdy ma własny adres, tytuł, lead i listę. */
import type { Race } from "./types";
import { allRaces, today } from "./data";
import { slugify } from "./normalize";
import { fmtKm } from "./format";
import { wojFor, geoFor } from "./geo";

export type HubKind = "pasmo" | "wojewodztwo" | "blisko" | "rok" | "miesiac" | "temat";
export type Hub = {
  path: string[]; // segmenty po /biegi/
  kind: HubKind;
  label: string; // krótka etykieta do chipów
  title: string; // <title> (bez sufiksu serwisu)
  h1: string;
  description: string;
  lead: string;
  filter: (r: Race) => boolean;
  /** gdy lista jest krótka: dodatkowa sekcja pod nią (np. "kolejne weekendy" na /biegi/ten-weekend) */
  more?: { title: string; races: Race[] };
};

/** miasta do stron "blisko": promień 100 km od centrum, strona tylko przy min. 3 nadchodzących biegach */
const CITIES: { slug: string; gen: string; lat: number; lng: number }[] = [
  { slug: "krakowa", gen: "Krakowa", lat: 50.0614, lng: 19.9366 },
  { slug: "wroclawia", gen: "Wrocławia", lat: 51.1079, lng: 17.0385 },
  { slug: "katowic", gen: "Katowic", lat: 50.2649, lng: 19.0238 },
  { slug: "bielska-bialej", gen: "Bielska-Białej", lat: 49.8224, lng: 19.0584 },
  { slug: "warszawy", gen: "Warszawy", lat: 52.2297, lng: 21.0122 },
  { slug: "gdanska", gen: "Gdańska", lat: 54.352, lng: 18.6466 },
  { slug: "rzeszowa", gen: "Rzeszowa", lat: 50.0412, lng: 21.9991 },
];
export const NEAR_KM = 100;
export const distKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => { const R = 6371, rad = (d: number) => (d * Math.PI) / 180; const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const MIN = 3; // próg: nowe strony programatyczne powstają tylko z co najmniej 3 nadchodzącymi biegami

/** najbliższy weekend (sobota-niedziela); w sobotę i niedzielę bieżący */
export function weekendOf(today: string): [string, string] {
  const d = new Date(today + "T12:00:00Z"); const dow = d.getUTCDay();
  const sat = new Date(d); sat.setUTCDate(d.getUTCDate() + (dow === 0 ? -1 : 6 - dow));
  const sun = new Date(sat); sun.setUTCDate(sat.getUTCDate() + 1);
  return [sat.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)];
}

const MONTHS = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];
const MONTHS_LOC = ["styczniu", "lutym", "marcu", "kwietniu", "maju", "czerwcu", "lipcu", "sierpniu", "wrześniu", "październiku", "listopadzie", "grudniu"];
const MONTH_SLUG = MONTHS.map((m) => slugify(m));

/** grupy pasm z poprawną odmianą */
const GROUPS: { slug: string; label: string; loc: string; match: (region: string) => boolean }[] = [
  { slug: "beskidy", label: "Beskidy", loc: "w Beskidach", match: (r) => /^Beskid/.test(r) || r === "Gorce" || r === "Pogórze" },
  { slug: "sudety", label: "Sudety", loc: "w Sudetach", match: (r) => /^(Sudety|Góry Sowie|Góry Stołowe|Góry Wałbrzyskie|Góry Opawskie|Karkonosze|Góry Izerskie|Góry Złote|Góry Bystrzyckie|Masyw Śnieżnika|Góry Bardzkie|Góry Kaczawskie|Rudawy Janowickie|Góry Kamienne|Góry Orlickie)$/.test(r) },
  { slug: "tatry-pieniny-gorce", label: "Tatry, Pieniny i Gorce", loc: "w Tatrach, Pieninach i Gorcach", match: (r) => /^(Tatry|Pieniny|Gorce|Podhale)$/.test(r) },
  { slug: "bieszczady", label: "Bieszczady", loc: "w Bieszczadach", match: (r) => /^(Bieszczady|Pogórze Przemyskie)$/.test(r) },
  { slug: "gory-swietokrzyskie", label: "Góry Świętokrzyskie", loc: "w Górach Świętokrzyskich", match: (r) => r === "Góry Świętokrzyskie" },
  { slug: "jura", label: "Jura Krakowsko-Częstochowska", loc: "na Jurze Krakowsko-Częstochowskiej", match: (r) => /^Jura/.test(r) },
  { slug: "krakow-i-okolice", label: "Kraków i okolice", loc: "w Krakowie i okolicach", match: (r) => /^(Lasek Wolski|Dolinki Podkrakowskie)$/.test(r) },
];

const t = today();
const upcoming = (f: (r: Race) => boolean) => allRaces.filter((r) => r.dateEnd >= t && f(r));
const seasonLabel = () => { const y = Number(t.slice(0, 4)); return `${y}/${y + 1}`; };
const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many;
const biegow = (n: number) => `${n} ${plural(n, "bieg", "biegi", "biegów")}`;
const kmRange = (list: Race[]) => { const ks = list.flatMap((r) => r.distancesKm).filter((k) => k >= 3); return ks.length ? `${fmtKm(Math.round(Math.min(...ks)))} do ${fmtKm(Math.round(Math.max(...ks)))}` : ""; };
const nearest = (list: Race[]) => [...list].sort((a, b) => a.dateStart.localeCompare(b.dateStart))[0];
const goodCount = (list: Race[]) => list.filter((r) => r.beginnerScore >= 4).length;

function leadFor(list: Race[], where: string): string {
  if (!list.length) return `Na razie nie mamy w kalendarzu nadchodzących biegów ${where}. Dopisujemy je, gdy organizatorzy ogłaszają terminy, zwykle kilka miesięcy przed startem.`;
  const n = nearest(list)!;
  const g = goodCount(list);
  const km = kmRange(list);
  const good = g === list.length ? "" : g ? ` ${g} z nich ${plural(g, "ma", "mają", "ma")} ocenę "dobry na start", czyli ${plural(g, "nadaje się", "nadają się", "nadaje się")} na pierwszy start w terenie.` : " Żaden nie ma oceny \"dobry na start\", więc na pierwszy raz lepiej poszukać w innym regionie albo zajrzeć do kreatora.";
  return `${biegow(list.length)} ${where}${km ? `, dystanse od ${km}` : ""}. Najbliższy: ${n.eventName} (${n.dateStart.split("-").reverse().join(".")}, ${n.city}).${good} Przy każdym biegu: przewyższenie, limit czasu, status zapisów, regulamin i sprzęt obowiązkowy.`;
}

function build(): Hub[] {
  const hubs: Hub[] = [];
  const season = seasonLabel();
  // grupy pasm
  for (const g of GROUPS) {
    const f = (r: Race) => !!r.region && g.match(r.region);
    if (!allRaces.some(f)) continue;
    hubs.push({ path: ["pasmo", g.slug], kind: "pasmo", label: g.label, filter: f,
      title: `Biegi górskie i trailowe ${g.loc} ${season}: kalendarz`, h1: `Biegi górskie i trailowe ${g.loc}`,
      description: `Kalendarz biegów górskich, trailowych i przełajowych ${g.loc}: terminy ${season}, dystanse, przewyższenia, limity czasu, zapisy i ocena dla początkujących.`,
      lead: leadFor(upcoming(f), g.loc) });
  }
  // pojedyncze pasma z co najmniej 3 biegami w bazie (bez grup o tej samej nazwie)
  const counts = new Map<string, number>();
  for (const r of allRaces) if (r.region) counts.set(r.region, (counts.get(r.region) || 0) + 1);
  for (const [region, n] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "pl"))) {
    if (n < 3 || GROUPS.some((g) => g.label === region)) continue;
    const f = (r: Race) => r.region === region;
    hubs.push({ path: ["pasmo", slugify(region)], kind: "pasmo", label: region, filter: f,
      title: `${region}: biegi górskie i trailowe ${season}`, h1: `Biegi górskie i trailowe: ${region}`,
      description: `${region}: kalendarz biegów górskich i trailowych ${season} z dystansami, przewyższeniem, limitami czasu, statusem zapisów i oceną dla początkujących.`,
      lead: leadFor(upcoming(f), `w paśmie ${region}`) });
  }
  // województwa (z geokodowania miejscowości startu), co najmniej 2 biegi w bazie
  const wc = new Map<string, number>();
  for (const r of allRaces) { const w = wojFor(r.city); if (w) wc.set(w, (wc.get(w) || 0) + 1); }
  for (const [w, n] of [...wc.entries()].sort((a, b) => a[0].localeCompare(b[0], "pl"))) {
    if (n < 2) continue;
    const f = (r: Race) => wojFor(r.city) === w;
    const loc = `w województwie ${w.replace(/ie$/, "im")}`;
    hubs.push({ path: ["wojewodztwo", slugify(w)], kind: "wojewodztwo", label: w, filter: f,
      title: `Biegi górskie i trailowe ${loc} ${season}: kalendarz`, h1: `Biegi górskie i trailowe ${loc}`,
      description: `Kalendarz biegów górskich, trailowych i przełajowych ${loc}: terminy ${season}, dystanse, przewyższenia, limity czasu, zapisy i ocena dla początkujących.`,
      lead: leadFor(upcoming(f), loc) });
  }
  // miesiące: od bieżącego, każdy z co najmniej jednym nadchodzącym biegiem
  const months = new Set(allRaces.filter((r) => r.dateEnd >= t).map((r) => r.dateStart.slice(0, 7)));
  for (const ym of [...months].sort()) {
    const [y, m] = ym.split("-").map(Number);
    const f = (r: Race) => r.dateStart.slice(0, 7) === ym;
    hubs.push({ path: [String(y), MONTH_SLUG[m - 1]], kind: "miesiac", label: `${MONTHS[m - 1]} ${y}`, filter: f,
      title: `Biegi górskie i trailowe ${MONTHS[m - 1]} ${y}: terminy i zapisy`, h1: `Biegi górskie i trailowe: ${MONTHS[m - 1]} ${y}`,
      description: `Jakie biegi górskie, trailowe i przełajowe są w ${MONTHS_LOC[m - 1]} ${y}: terminy, dystanse, przewyższenia, zapisy i ocena dla początkujących.`,
      lead: leadFor(upcoming(f), `w ${MONTHS_LOC[m - 1]} ${y}`) });
  }
  // blisko miast
  for (const c of CITIES) {
    const f = (r: Race) => { const g = geoFor(r.city); return !!g && distKm(c, g) <= NEAR_KM; };
    const n = upcoming(f).length;
    if (n < MIN) continue;
    hubs.push({ path: ["blisko", c.slug], kind: "blisko", label: `Blisko ${c.gen}`, filter: f,
      title: `Biegi górskie i trailowe blisko ${c.gen} (do ${NEAR_KM} km) ${season}`, h1: `Biegi górskie i trailowe blisko ${c.gen}`,
      description: `Biegi górskie, trailowe i przełajowe do ${NEAR_KM} km od ${c.gen}: terminy ${season}, dystanse, przewyższenia, limity czasu, zapisy i ocena dla początkujących.`,
      lead: leadFor(upcoming(f), `do ${NEAR_KM} km od ${c.gen} (w linii prostej od centrum)`) });
  }
  // lata: każdy rok z co najmniej 3 nadchodzącymi biegami
  const years = new Set(allRaces.filter((r) => r.dateEnd >= t).map((r) => r.dateStart.slice(0, 4)));
  for (const y of [...years].sort()) {
    const f = (r: Race) => r.dateStart.slice(0, 4) === y;
    if (upcoming(f).length < MIN) continue;
    hubs.push({ path: [y], kind: "rok", label: y, filter: f,
      title: `Biegi górskie ${y}: kalendarz biegów trailowych w Polsce`, h1: `Biegi górskie i trailowe ${y}`,
      description: `Kalendarz biegów górskich, trailowych i przełajowych w Polsce na ${y}: terminy, dystanse, przewyższenia, limity czasu, opłaty, zapisy i ocena dla początkujących.`,
      lead: leadFor(upcoming(f), `w ${y} roku`) });
  }
  // ten weekend: zawsze (lista przebudowuje się 2 razy w tygodniu); gdy w weekend mniej niż 3 biegi, pod spodem kolejne weekendy
  {
    const [sat, sun] = weekendOf(t);
    const f = (r: Race) => r.dateStart <= sun && r.dateEnd >= sat;
    const list = upcoming(f);
    const dd = (iso: string) => `${Number(iso.slice(8, 10))}.${iso.slice(5, 7)}`;
    const next = allRaces.filter((r) => r.dateStart > sun && [0, 6].includes(new Date(r.dateStart + "T12:00:00Z").getUTCDay())).sort((a, b) => a.dateStart.localeCompare(b.dateStart)).slice(0, 6);
    hubs.push({ path: ["ten-weekend"], kind: "temat", label: "Ten weekend", filter: f,
      title: `Biegi górskie i trailowe w ten weekend (${dd(sat)}-${dd(sun)})`, h1: `Biegi w ten weekend: ${dd(sat)}-${dd(sun)}`,
      description: `Biegi górskie, trailowe i przełajowe w najbliższy weekend (${dd(sat)}-${dd(sun)}): gdzie, jakie dystanse, przewyższenia, zapisy w dniu startu.`,
      lead: list.length ? leadFor(list, `w weekend ${dd(sat)}-${dd(sun)}`) : `W weekend ${dd(sat)}-${dd(sun)} nie mamy w kalendarzu żadnego biegu górskiego ani trailowego. Poniżej najbliższe kolejne weekendy.`,
      ...(list.length < MIN && next.length ? { more: { title: "Kolejne weekendy", races: next } } : {}) });
  }
  // tematyczne
  const T: { slug: string; label: string; title: string; h1: string; description: string; where: string; f: (r: Race) => boolean }[] = [
    { slug: "dla-poczatkujacych", label: "Dla początkujących", title: `Biegi górskie dla początkujących ${season}: które wybrać na pierwszy start`, h1: "Biegi górskie i trailowe dla początkujących", description: `Biegi górskie i trailowe w Polsce z oceną "dobry na start": krótkie dystanse, umiarkowane przewyższenie, hojne limity czasu. Terminy ${season}, zapisy, regulaminy.`, where: `z oceną "dobry na start" w całej Polsce`, f: (r) => r.beginnerScore >= 4 },
    { slug: "do-15-km", label: "Do 15 km", title: `Krótkie biegi górskie i trailowe do 15 km ${season}`, h1: "Biegi górskie i trailowe do 15 km", description: `Biegi górskie, trailowe i przełajowe z dystansem do 15 km: dobre na pierwszy start w terenie. Terminy ${season}, przewyższenia, zapisy.`, where: "z dystansem do 15 km", f: (r) => r.minKm > 0 && r.minKm <= 15 },
    { slug: "ultra", label: "Ultra", title: `Biegi ultra w górach i terenie ${season}: kalendarz`, h1: "Biegi ultra (ponad 45 km)", description: `Kalendarz biegów ultra w Polsce (dystanse ponad 45 km): terminy ${season}, przewyższenia, limity czasu, zapisy, sprzęt obowiązkowy.`, where: "z dystansem ultra (ponad 45 km)", f: (r) => r.maxKm > 45 },
    { slug: "zapisy-otwarte", label: "Zapisy otwarte", title: `Biegi górskie i trailowe z otwartymi zapisami (stan na ${t.split("-").reverse().join(".")})`, h1: "Biegi górskie i trailowe z otwartymi zapisami", description: "Biegi górskie, trailowe i przełajowe, na które da się zapisać teraz: potwierdzone otwarte zapisy, terminy, limity miejsc, dystanse.", where: "z potwierdzonymi otwartymi zapisami", f: (r) => r.signup?.status === "open" },
    { slug: "zimowe", label: "Zimowe", title: `Zimowe biegi górskie i trailowe ${season}: kalendarz`, h1: "Zimowe biegi górskie i trailowe", description: `Biegi górskie i trailowe zimą (grudzień, styczeń, luty) i edycje zimowe: terminy ${season}, dystanse, limity czasu, sprzęt obowiązkowy na zimę.`, where: "zimą (grudzień-luty) i w edycjach zimowych", f: (r) => [12, 1, 2].includes(Number(r.dateStart.slice(5, 7))) || /zimow|winter/i.test(r.eventName + " " + r.name) },
    { slug: "z-kijami", label: "Z kijami", title: `Biegi górskie, na których można biec z kijami ${season}`, h1: "Biegi górskie i trailowe z kijami", description: `Biegi górskie i trailowe, których regulamin wprost dopuszcza kije: terminy ${season}, dystanse, przewyższenia, limity czasu.`, where: "z kijami dozwolonymi w regulaminie", f: (r) => r.info?.poles === "tak" },
    { slug: "z-psem", label: "Z psem", title: `Biegi górskie i trailowe z psem ${season}: canicross i bieg z psem na smyczy`, h1: "Biegi górskie i trailowe z psem", description: `Biegi górskie i trailowe, na których regulamin dopuszcza bieg z psem (canicross, pies na smyczy): terminy ${season}, dystanse, zasady.`, where: "z psem dopuszczonym w regulaminie", f: (r) => r.info?.dogs === "tak" },
    { slug: "z-biegiem-dla-dzieci", label: "Z biegiem dla dzieci", title: `Biegi górskie z biegiem dla dzieci ${season}: na start całą rodziną`, h1: "Biegi górskie i trailowe z biegiem dla dzieci", description: `Imprezy biegowe w górach i w terenie z biegiem dla dzieci w programie: terminy ${season}, dystanse dla dorosłych, zapisy.`, where: "z biegiem dla dzieci w programie imprezy", f: (r) => !!r.info?.kids },
    { slug: "przelaje", label: "Przełaje", title: `Biegi przełajowe ${season}: kalendarz`, h1: "Biegi przełajowe", description: `Kalendarz biegów przełajowych w Polsce: krótkie trasy w terenie, często pierwszy krok przed górami. Terminy ${season}, dystanse, zapisy.`, where: "po przełaju", f: (r) => r.surface === "przelaj" },
  ];
  const optional = new Set(["zimowe", "z-kijami", "z-psem", "z-biegiem-dla-dzieci"]);
  for (const x of T) if (!optional.has(x.slug) || upcoming(x.f).length >= MIN) hubs.push({ path: [x.slug], kind: "temat", label: x.label, title: x.title, h1: x.h1, description: x.description, filter: x.f, lead: leadFor(upcoming(x.f), x.where) });
  return hubs;
}

let cache: Hub[] | null = null;
export const allHubs = (): Hub[] => (cache ??= build());
export const hubPath = (h: Hub) => `/biegi/${h.path.join("/")}`;
export const hubByPath = (parts: string[]) => allHubs().find((h) => h.path.length === parts.length && h.path.every((p, i) => p === parts[i]));
/** huby, w których jest dany bieg (do linkowania ze strony biegu) */
export const hubsForRace = (r: Race) => allHubs().filter((h) => h.filter(r));
export const hubRaces = (h: Hub) => ({ upcoming: upcoming(h.filter).sort((a, b) => a.dateStart.localeCompare(b.dateStart)), past: allRaces.filter((r) => r.dateEnd < t && h.filter(r)).sort((a, b) => b.dateStart.localeCompare(a.dateStart)) });
