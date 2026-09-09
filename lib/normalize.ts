import type { Race, Surface } from "./types";

const MONTHS: Record<string, number> = {
  stycznia: 1, styczen: 1, styczeń: 1, lutego: 2, luty: 2, marca: 3, marzec: 3, kwietnia: 4, kwiecien: 4, kwiecień: 4,
  maja: 5, maj: 5, czerwca: 6, czerwiec: 6, lipca: 7, lipiec: 7, sierpnia: 8, sierpien: 8, sierpień: 8,
  wrzesnia: 9, września: 9, wrzesien: 9, wrzesień: 9, pazdziernika: 10, października: 10, pazdziernik: 10, październik: 10,
  listopada: 11, listopad: 11, grudnia: 12, grudzien: 12, grudzień: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

/** "04 stycznia 2026" | "07-09 sierpnia 2026" | "28 luty 2026" | "2026-09-12" | "30 sierpnia - 1 wrzesnia 2026" */
export function parsePolishDate(s: string): { start: string; end: string } | null {
  const t = s.toLowerCase().replace(/\s+/g, " ").trim();
  let m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return { start: `${m[1]}-${m[2]}-${m[3]}`, end: `${m[1]}-${m[2]}-${m[3]}` };
  // "30 sierpnia - 1 wrzesnia 2026"
  m = t.match(/(\d{1,2})\s+([a-ząćęłńóśźż]+)\s*[-–]\s*(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/);
  if (m && MONTHS[m[2]] && MONTHS[m[4]]) {
    return { start: `${m[5]}-${pad(MONTHS[m[2]])}-${pad(+m[1])}`, end: `${m[5]}-${pad(MONTHS[m[4]])}-${pad(+m[3])}` };
  }
  // "07-09 sierpnia 2026"
  m = t.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/);
  if (m && MONTHS[m[3]]) {
    const mo = pad(MONTHS[m[3]]);
    return { start: `${m[4]}-${mo}-${pad(+m[1])}`, end: `${m[4]}-${mo}-${pad(+m[2])}` };
  }
  // "04 stycznia 2026"
  m = t.match(/(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/);
  if (m && MONTHS[m[2]]) {
    const d = `${m[3]}-${pad(MONTHS[m[2]])}-${pad(+m[1])}`;
    return { start: d, end: d };
  }
  return null;
}

/** "23,2km (+/-940m) 11,6km (+/-470m) 5,7km Vertical" -> [{km:23.2,dplus:940},...] */
export function parseDistances(s: string): { list: { km: number; dplus?: number }[]; vertical: boolean } {
  const t = s.replace(/\s+/g, " ");
  const vertical = /vertical|vk\b/i.test(t);
  const list: { km: number; dplus?: number }[] = [];
  const re = /(\d+(?:[.,]\d+)?)\s*km(?:\s*\(\s*\+?\/?-?\+?\s*(\d[\d\s.]*)\s*m\))?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const km = parseFloat(m[1].replace(",", "."));
    if (!isFinite(km) || km <= 0 || km > 500) continue;
    const dplus = m[2] ? parseInt(m[2].replace(/[\s.]/g, ""), 10) : undefined;
    if (!list.some((x) => Math.abs(x.km - km) < 0.05)) list.push({ km, dplus });
  }
  list.sort((a, b) => a.km - b.km);
  return { list, vertical };
}

const REGIONS = [
  "Tatry", "Podhale", "Pieniny", "Gorce", "Beskid Niski", "Beskid Sądecki", "Beskid Wyspowy", "Beskid Żywiecki", "Beskid Śląski",
  "Beskid Mały", "Beskid Makowski", "Bieszczady", "Karkonosze", "Góry Izerskie", "Góry Stołowe", "Góry Sowie", "Góry Bystrzyckie",
  "Góry Orlickie", "Góry Bardzkie", "Góry Złote", "Góry Opawskie", "Góry Kaczawskie", "Rudawy Janowickie", "Masyw Śnieżnika",
  "Góry Wałbrzyskie", "Kotlina Kłodzka", "Jura", "Jura Krakowsko-Częstochowska", "Góry Świętokrzyskie", "Roztocze", "Pogórze",
  "Kaszuby", "Mazury", "Sudety", "Beskidy", "Lasek Wolski", "Warmia",
];

export function splitPlace(place: string): { city: string; region: string } {
  let t = place.replace(/\bPOLSKA\b/gi, "").replace(/\s+/g, " ").trim();
  let region = "";
  for (const r of REGIONS.sort((a, b) => b.length - a.length)) {
    const idx = t.toLowerCase().indexOf(r.toLowerCase());
    if (idx >= 0) {
      region = r;
      t = (t.slice(0, idx) + " " + t.slice(idx + r.length)).replace(/\s+/g, " ").trim();
      break;
    }
  }
  const city = t.replace(/[,\-–]+$/, "").trim() || region || "Polska";
  return { city, region };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function guessSurface(name: string, region: string, list: { km: number; dplus?: number }[]): Surface {
  const n = name.toLowerCase();
  if (/city ?trail|przełaj|przelaj|cross|park/.test(n) && !region) return "przelaj";
  const maxGrad = Math.max(0, ...list.filter((x) => x.dplus).map((x) => (x.dplus as number) / x.km));
  if (/tatr|gran|sky|vertical|górsk|gorsk/.test(n) || maxGrad >= 60) return "gorski";
  if (region) return "trail";
  return maxGrad > 0 ? "trail" : "przelaj";
}

/** vertical = krótko i bardzo stromo (sam podbieg) */
export const isVertical = (e: { km: number; dplus?: number }) => e.km <= 8 && !!e.dplus && e.dplus / e.km >= 100;

/** 1-5: 5 = idealny pierwszy niepłaski bieg. Liczone od najkrótszego dystansu, który NIE jest verticalem. */
export function beginnerScore(list: { km: number; dplus?: number }[], vertical: boolean, category?: string): { score: number; why: string } {
  if (!list.length) return { score: 3, why: "Organizator nie podał dystansu ani przewyższenia w kalendarzu: sprawdź regulamin przed decyzją." };
  const verticals = list.filter(isVertical);
  const normal = list.filter((e) => !isVertical(e));
  const why: string[] = [];
  if (!normal.length) {
    return { score: 1, why: `Tylko vertical (${list.map((e) => e.km + " km").join(", ")}): sam podbieg, bez zbiegu; to sprawdzian siły, nie pierwszy kontakt z górami.` };
  }
  const shortest = normal[0];
  if (verticals.length) why.push(`pomijamy vertical ${verticals.map((e) => e.km + " km").join(", ")} (sam podbieg), liczymy od ${shortest.km} km`);
  const grad = shortest.dplus ? shortest.dplus / shortest.km : undefined;
  let score = 3;
  if (shortest.km <= 12) { score += 1; why.push(`najkrótszy dystans ${shortest.km} km`); }
  else if (shortest.km <= 22) { why.push(`najkrótszy dystans ${shortest.km} km (jak półmaraton, ale wolniej)`); }
  else if (shortest.km <= 35) { score -= 1; why.push(`najkrótszy dystans ${shortest.km} km, to już długo w terenie`); }
  else { score -= 2; why.push(`najkrótszy dystans ${shortest.km} km, dystans ultra`); }
  if (grad !== undefined) {
    if (grad <= 35) { score += 1; why.push(`łagodnie: ok. ${Math.round(grad)} m przewyższenia na km`); }
    else if (grad <= 60) { why.push(`średnio stromo: ok. ${Math.round(grad)} m na km`); }
    else { score -= 1; why.push(`stromo: ok. ${Math.round(grad)} m na km, dużo marszu pod górę`); }
  } else {
    why.push("przewyższenie nieznane, sprawdź profil trasy");
  }
  if (normal.length >= 3) { why.push("kilka dystansów na jednej imprezie, łatwo dobrać swój"); }
  score = Math.max(1, Math.min(5, score));
  return { score, why: why.join("; ") + "." };
}

const GENERIC = new Set(["ultra", "trail", "race", "run", "bieg", "biegi", "biegowy", "festiwal", "maraton", "polmaraton", "by", "utmb", "the", "and", "edycja", "cup", "series", "gorski", "gorskie", "winter", "summer"]);
/** rdzeń nazwy imprezy: bez liczb, rzymskich numerów edycji i słów generycznych; 2 pierwsze znaczące słowa */
export function eventCore(name: string): string {
  return slugify(name)
    .split("-")
    .filter((w) => w.length > 2 && !/^\d+$/.test(w) && !/^[ivx]+$/.test(w) && !GENERIC.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 2)
    .join("-");
}
export function dedupKey(r: Pick<Race, "eventName" | "dateStart" | "city">): string {
  const core = eventCore(r.eventName) || slugify(r.eventName).slice(0, 12);
  return `${core}|${r.dateStart.slice(0, 7)}`;
}
export function cleanCity(place: string): string {
  const parts = place.split(/,|\s[–-]\s/).map((x) => x.trim()).filter(Boolean);
  const venue = /\b(ul\.|ulica|plac|hala|galeria|stadion|zalew|rynek|park|schronisko|osir|mosir|boisko|parking|centrum|szkoła|szkola|al\.|aleja)\b|\d/i;
  const town = parts.find((x) => !venue.test(x));
  return (town || parts[parts.length - 1] || place).replace(/\s+/g, " ");
}
