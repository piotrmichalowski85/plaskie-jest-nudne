/**
 * Newsletter "nowe biegi w tym tygodniu": wydanie budowane z dziennika zmian danych (data/zmiany.json) i kalendarza.
 * Jedno źródło treści dla szkicu kampanii w Brevo (scripts/newsletter.ts), podglądu na stronie (/newsletter/przyklad) i testów.
 * Zasada: tydzień bez nowych biegów, bez ruszających i bez kończących się zapisów = brak wydania (issue.empty).
 */
import reports from "@/data/zmiany.json";
import { allRaces } from "./data";
import type { Race } from "./types";
import { fmtDate, fmtKm, level, daysUntil } from "./format";
import { priceFrom, fmtPln } from "./fees";

const SITE = "https://plaskiejestnudne.pl";
type Rep = { date: string; added: { id: string }[]; dateChanged: { id: string; from: string; to: string }[]; signupChanged: { id: string; from: string; to: string }[] };

export type IssueSection = { title: string; lead?: string; races: { race: Race; note?: string }[] };
export type Issue = { date: string; subject: string; preheader: string; sections: IssueSection[]; empty: boolean; html: string };

const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10);
const d = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
/** 1 bieg, 2-4 biegi, 5+ biegów (także 22-24 biegi) */
const pl = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildIssue(today: string): Issue {
  const since = addDays(today, -7);
  const byId = new Map(allRaces.map((r) => [r.id, r]));
  const week = (reports as Rep[]).filter((r) => r.date > since && r.date <= today);
  const upcoming = (r?: Race): r is Race => !!r && r.dateEnd >= today;
  const uniq = (ids: string[]) => [...new Set(ids)].map((id) => byId.get(id)).filter(upcoming);
  const byDate = (a: Race, b: Race) => a.dateStart.localeCompare(b.dateStart);

  const added = uniq(week.flatMap((r) => r.added.map((x) => x.id))).sort(byDate).slice(0, 12);
  const opened = uniq(week.flatMap((r) => r.signupChanged.filter((x) => x.to.startsWith("open") && !x.from.startsWith("open")).map((x) => x.id))).filter((r) => !added.includes(r)).sort(byDate).slice(0, 8);
  const closing = allRaces.filter((r) => upcoming(r) && r.signup?.status === "open" && r.signup.until && r.signup.until >= today && r.signup.until <= addDays(today, 14))
    .sort((a, b) => a.signup!.until!.localeCompare(b.signup!.until!)).slice(0, 8);
  const moved = week.flatMap((r) => r.dateChanged).map((x) => ({ race: byId.get(x.id), from: x.from })).filter((x): x is { race: Race; from: string } => upcoming(x.race)).slice(0, 5);
  const shown = new Set([...added, ...opened, ...closing, ...moved.map((x) => x.race)].map((r) => r.id));
  // stała pozycja na koniec: biegi łagodne dla debiutanta z otwartymi albo nieznanymi zapisami, start za 3-10 tygodni
  const forStart = allRaces.filter((r) => upcoming(r) && !shown.has(r.id) && level(r.beginnerScore) === "good" && r.signup?.status !== "closed" && daysUntil(r.dateStart, today) >= 21 && daysUntil(r.dateStart, today) <= 70)
    .sort(byDate).slice(0, 4);

  const sections: IssueSection[] = [];
  if (added.length) sections.push({ title: "Nowe w kalendarzu", lead: "Biegi, które doszły w ostatnim tygodniu.", races: added.map((race) => ({ race, note: race.provisional ? "termin wstępny, do potwierdzenia" : undefined })) });
  if (opened.length) sections.push({ title: "Ruszyły zapisy", races: opened.map((race) => ({ race, note: race.signup?.until ? `zapisy do ${d(race.signup.until)}` : undefined })) });
  if (closing.length) sections.push({ title: "Zapisy kończą się w ciągu dwóch tygodni", races: closing.map((race) => ({ race, note: `zapisy do ${d(race.signup!.until!)}` })) });
  if (moved.length) sections.push({ title: "Zmiana terminu", races: moved.map(({ race, from }) => ({ race, note: `wcześniej ${d(from)}` })) });
  const empty = sections.length === 0;
  if (forStart.length && !empty) sections.push({ title: "Dobre na pierwszy start", lead: "Łagodne biegi za kilka tygodni, czyli jest jeszcze czas na przygotowanie.", races: forStart.map((race) => ({ race })) });

  // kolejność = waga dla czytelnika: nowe biegi, terminy do pilnowania, ruszające zapisy, zmiany terminu
  const parts = [
    added.length ? `${added.length} ${pl(added.length, "nowy bieg", "nowe biegi", "nowych biegów")}` : "",
    closing.length ? `${closing.length} ${pl(closing.length, "termin zapisów", "terminy zapisów", "terminów zapisów")}` : "",
    opened.length ? `zapisy na ${opened.length} ${pl(opened.length, "bieg", "biegi", "biegów")}` : "",
    moved.length ? `${moved.length} ${pl(moved.length, "zmiana terminu", "zmiany terminu", "zmian terminu")}` : "",
  ].filter(Boolean);
  // temat: dwie najważniejsze liczby, żeby zmieścił się w podglądzie skrzynki
  const subject = empty ? "Bez zmian w kalendarzu" : parts.slice(0, 2).join(" i ").replace(/^./, (c) => c.toUpperCase());
  const names = [...added, ...opened, ...closing].slice(0, 3).map(title);
  const preheader = names.length ? `${names.join(", ")}${added.length + opened.length + closing.length > 3 ? " i kolejne" : ""}. Biegi górskie i trailowe, tydzień od ${d(since)}.` : "Biegi górskie i trailowe w Polsce.";
  const issue = { date: today, subject, preheader, sections, empty };
  return { ...issue, html: renderIssue(issue, today) };
}

const C = { bg: "#f4efe4", card: "#ffffff", ink: "#17201a", moss: "#2f5d3a", muted: "#5f665b", line: "#dcd5c3", sunBg: "#fff3d1", sunInk: "#7a5a10" };
const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** link do strony z oznaczeniem źródła; kampania = data wydania */
const link = (path: string, date: string) => `${SITE}${path}${path.includes("?") ? "&" : "?"}utm_source=newsletter&utm_medium=email&utm_campaign=${date}`;

/** nazwa do wydania: nazwa imprezy, a gdy to sam skrót cyklu ("X-run" przy sześciu biegach), pierwszy człon pełnej nazwy ("X-RUN - Tajemnicze Kopce") */
const title = (race: Race) => { const n = race.name.split(": ")[0].trim(); return race.eventName.length <= 6 && n.length > race.eventName.length && n.length <= 70 ? n : race.eventName; };

function raceRow(race: Race, note: string | undefined, today: string, date: string): string {
  const km = race.distancesKm.length ? race.distancesKm.map(fmtKm).join(" / ") : "";
  const price = priceFrom(race, today);
  const meta = [fmtDate(race.dateStart, race.dateEnd), race.city, km].filter(Boolean).join(" · ");
  const extra = [note, price !== undefined ? `od ${fmtPln(price)}` : ""].filter(Boolean).join(" · ");
  const badge = level(race.beginnerScore) === "good" ? `<span class="badge" style="display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:${C.sunBg};color:${C.sunInk};font-size:12px;font-weight:700;white-space:nowrap;">dobry na start</span>` : "";
  return `<tr><td class="row" style="padding:12px 0;border-top:1px solid ${C.line};font-family:${F};">
<a href="${link(`/bieg/${race.id}`, date)}" class="race" style="color:${C.moss};font-size:17px;font-weight:700;text-decoration:underline;">${esc(title(race))}</a>${badge}
<div class="meta" style="margin-top:3px;color:${C.muted};font-size:14px;line-height:1.45;">${esc(meta)}</div>${extra ? `
<div class="extra" style="margin-top:2px;color:${C.ink};font-size:14px;line-height:1.45;">${esc(extra)}</div>` : ""}
</td></tr>`;
}

/** HTML maila: tabele i style w atrybutach (klienty pocztowe), szerokość 600 px, tryb ciemny przez prefers-color-scheme tam, gdzie klient go wspiera */
export function renderIssue(issue: Omit<Issue, "html">, today: string): string {
  const { date } = issue;
  const body = issue.sections.map((s) => `<tr><td style="padding:22px 0 6px;font-family:${F};">
<h2 class="h2" style="margin:0;color:${C.ink};font-size:20px;line-height:1.25;font-weight:800;">${esc(s.title)}</h2>${s.lead ? `
<p class="meta" style="margin:4px 0 0;color:${C.muted};font-size:14px;line-height:1.45;">${esc(s.lead)}</p>` : ""}
</td></tr>
${s.races.map((x) => raceRow(x.race, x.note, today, date)).join("\n")}`).join("\n");
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(issue.subject)}</title>
<style>
@media (prefers-color-scheme: dark) {
  .bg { background: #141a15 !important; }
  .card { background: #1c241d !important; border-color: #334036 !important; }
  .h1, .h2, .extra, .text { color: #eef0ea !important; }
  .meta, .foot { color: #a9b2a4 !important; }
  .race, .lnk { color: #9fd0a8 !important; }
  .row { border-color: #334036 !important; }
  .badge { background: #4a3c12 !important; color: #f6dfa0 !important; }
}
@media (max-width: 620px) { .card { padding: 20px 18px !important; } }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(issue.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:${C.bg};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 4px 14px;font-family:${F};">
<a href="${link("/", date)}" class="h1" style="color:${C.ink};font-size:22px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;">Płaskie jest nudne</a>
<div class="meta" style="margin-top:2px;color:${C.muted};font-size:13px;">Nowe biegi w tym tygodniu · ${fmtDate(date)}</div>
</td></tr>
<tr><td class="card" style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:6px 28px 22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${body}
<tr><td style="padding:22px 0 0;border-top:1px solid ${C.line};font-family:${F};" class="row">
<p class="text" style="margin:0;color:${C.ink};font-size:15px;line-height:1.5;">Cały kalendarz z filtrami, mapą i oceną dla początkujących: <a href="${link("/biegi", date)}" class="lnk" style="color:${C.moss};font-weight:700;">plaskiejestnudne.pl/biegi</a>. Terminy i ceny pochodzą ze stron organizatorów i regulaminów, więc przed zapisem sprawdź je u źródła.</p>
</td></tr>
</table>
</td></tr>
<tr><td class="foot" style="padding:16px 4px 0;color:${C.muted};font-family:${F};font-size:12px;line-height:1.5;">
Ten mail przychodzi na adres zapisany do newslettera na plaskiejestnudne.pl. Wysyłamy go w poniedziałki, tylko gdy jest o czym: nowe biegi, ruszające zapisy albo terminy do pilnowania.<br>
<a href="{{ unsubscribe }}" class="lnk" style="color:${C.moss};">Wypisz mnie</a> · <a href="${link("/prywatnosc", date)}" class="lnk" style="color:${C.moss};">Polityka prywatności</a>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

/** mail z prośbą o potwierdzenie zapisu (szablon Brevo z tagiem "optin"; {{ doubleoptin }} podmienia Brevo) */
export function renderOptin(): string {
  return `<!doctype html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>Potwierdź zapis na newsletter</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 4px 14px;font-family:${F};color:${C.ink};font-size:22px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;">Płaskie jest nudne</td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:26px 28px;font-family:${F};">
<h1 style="margin:0;color:${C.ink};font-size:22px;line-height:1.25;">Jeszcze jedno kliknięcie</h1>
<p style="margin:12px 0 0;color:${C.ink};font-size:16px;line-height:1.5;">Ktoś podał ten adres w zapisie na newsletter z nowymi biegami górskimi i trailowymi. Jeśli to Ty, potwierdź, a w poniedziałki będziesz dostawać krótką listę: nowe biegi w kalendarzu, ruszające zapisy i terminy, które zaraz mijają.</p>
<p style="margin:22px 0 0;"><a href="{{ doubleoptin }}" style="display:inline-block;background:${C.moss};color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:999px;">Potwierdzam zapis</a></p>
<p style="margin:22px 0 0;color:${C.muted};font-size:14px;line-height:1.5;">Jeśli to nie Ty, nic nie rób. Bez potwierdzenia nie wyślemy niczego więcej.</p>
</td></tr>
<tr><td style="padding:16px 4px 0;color:${C.muted};font-family:${F};font-size:12px;line-height:1.5;">plaskiejestnudne.pl, kalendarz biegów górskich i trailowych dla początkujących.</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}
