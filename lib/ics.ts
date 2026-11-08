/** Generator iCalendar (RFC 5545): pojedynczy bieg i feedy subskrypcyjne (cały kalendarz, huby). */
import type { Race } from "./types";
import { generatedAt } from "./data";
import { SITE } from "./seo";
import { fmtKm } from "./format";

const d8 = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[;,]/g, (c) => "\\" + c).replace(/\r?\n/g, "\\n");
/** zawijanie linii do 75 bajtów (UTF-8), kontynuacja od spacji */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "", bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}
const stamp = () => generatedAt.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

function alarms(r: Race, today: string): string[] {
  const a: string[] = [];
  const s = r.signup;
  // "zapisy do": dzień przed końcem zapisów, 9:00 czasu PL (8:00 UTC zimą, 7:00 latem; przyjmujemy 8:00 UTC)
  if (s?.status === "open" && s.until && s.until >= today && s.until < r.dateStart) {
    const day = new Date(s.until + "T12:00:00Z"); day.setUTCDate(day.getUTCDate() - 1);
    a.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(`Jutro koniec zapisów: ${r.eventName}`)}`, `TRIGGER;VALUE=DATE-TIME:${d8(day.toISOString())}T080000Z`, "END:VALARM");
  }
  // tydzień przed startem, 9:00 (wydarzenie całodniowe zaczyna się o północy)
  a.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(`Za tydzień: ${r.eventName}. Sprawdź sprzęt obowiązkowy i limit czasu.`)}`, "TRIGGER:-P6DT15H", "END:VALARM");
  return a;
}

export function vevent(r: Race, today: string): string[] {
  const end = new Date(r.dateEnd + "T12:00:00Z"); end.setUTCDate(end.getUTCDate() + 1);
  const url = `${SITE}/bieg/${r.id}`;
  const lim = r.elevations.filter((e) => e.limitH).map((e) => `${fmtKm(e.km)} ${e.limitH} h`);
  const desc = [
    r.distancesKm.length ? `Dystanse: ${r.distancesKm.map(fmtKm).join(", ")}.` : "",
    lim.length ? `Limit czasu: ${lim.join(", ")}.` : "",
    r.signup?.status === "open" ? `Zapisy otwarte${r.signup.until ? ` do ${r.signup.until.split("-").reverse().join(".")}` : ""}.` : r.signup?.status === "closed" ? "Zapisy zamknięte." : "",
    r.provisional ? "Termin wstępny, do potwierdzenia u organizatora." : "",
    url,
  ].filter(Boolean).join(" ");
  return [
    "BEGIN:VEVENT", `UID:${r.id}@plaskiejestnudne.pl`, `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${d8(r.dateStart)}`, `DTEND;VALUE=DATE:${d8(end.toISOString())}`,
    `SUMMARY:${esc(r.eventName)}`, `LOCATION:${esc(r.city + (r.region ? ", " + r.region : ""))}`,
    `DESCRIPTION:${esc(desc)}`, `URL:${url}`, "TRANSP:TRANSPARENT",
    ...(r.dateEnd >= today ? alarms(r, today) : []),
    "END:VEVENT",
  ];
}

/** cały plik .ics; name = nazwa kalendarza przy subskrypcji */
export function calendar(races: Race[], today: string, name?: string): string {
  const head = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//plaskiejestnudne.pl//PL", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  if (name) head.push(`X-WR-CALNAME:${esc(name)}`, "X-WR-TIMEZONE:Europe/Warsaw", `X-WR-CALDESC:${esc(`Biegi górskie i trailowe z kalendarza plaskiejestnudne.pl. Aktualizacja dwa razy w tygodniu.`)}`, "REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D");
  return [...head, ...races.flatMap((r) => vevent(r, today)), "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}

/** biegi do feedu: nadchodzące + ostatnie 30 dni (żeby wydarzenie nie znikało z kalendarza dzień po starcie) */
export function feedRaces(list: Race[], today: string): Race[] {
  const from = new Date(today + "T12:00:00Z"); from.setUTCDate(from.getUTCDate() - 30);
  const f = from.toISOString().slice(0, 10);
  return list.filter((r) => r.dateEnd >= f).sort((a, b) => a.dateStart.localeCompare(b.dateStart));
}

export const icsHeaders = (filename: string, inline = false) => ({
  "content-type": "text/calendar; charset=utf-8",
  "content-disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
  "cache-control": "public, max-age=0, s-maxage=3600, must-revalidate",
});

/** linki subskrypcji dla ścieżki feedu (np. "/kalendarz.ics") */
export function subscribeLinks(path: string) {
  const https = `${SITE}${path}`;
  const webcal = https.replace(/^https:/, "webcal:");
  return { https, webcal, google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}` };
}
