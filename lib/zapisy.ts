import { parsePolishDate } from "./normalize";

export type SignupStatus = "open" | "closed" | "unknown";
export type Signup = {
  status: SignupStatus;
  until?: string; // YYYY-MM-DD, ostatni dzień zapisów (jeśli znany)
  limit?: number; // limit uczestników (jeśli znany)
  registered?: number; // liczba zapisanych (jeśli znana)
  source?: "regulamin" | "organizator" | "zapisy" | "data";
  sourceUrl?: string;
  checkedAt?: string;
  note?: string; // np. "do wyczerpania limitu"
};

const MONTHS = "stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|wrzesnia|października|pazdziernika|listopada|grudnia";
const DATE_RE = `(\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\.\\d{1,2}\\.\\d{4}|\\d{1,2}\\s+(?:${MONTHS})(?:\\s+\\d{4})?|\\d{1,2}\\.\\d{1,2}(?![.\\d]))`;

/** Data z tekstu -> YYYY-MM-DD; brak roku uzupełniany rokiem biegu (jeśli wypada po biegu, bierzemy rok wcześniej). */
export function parseDateLoose(s: string, raceDate: string): string | null {
  const t = s.trim();
  let m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const raceYear = Number(raceDate.slice(0, 4));
  m = t.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (m) { const d = `${raceYear}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; return d > raceDate ? `${raceYear - 1}${d.slice(4)}` : d; }
  m = t.match(/^(\d{1,2})\s+([a-ząćęłńóśźż]+)$/i);
  if (m) { const p = parsePolishDate(`${m[1]} ${m[2]} ${raceYear}`); if (!p) return null; return p.start > raceDate ? `${raceYear - 1}${p.start.slice(4)}` : p.start; }
  const p = parsePolishDate(t);
  return p ? p.start : null;
}

const CLOSED = /zapisy\s+(?:internetowe\s+|online\s+)?(?:zostały\s+)?(?:zamknięte|zakończone|wstrzymane)|lista\s+startowa\s+(?:jest\s+)?(?:zamknięta|pełna|kompletna)|brak\s+(?:wolnych\s+)?miejsc|limit\s+(?:miejsc|uczestników|zawodników|startujących)\s+(?:został\s+)?(?:wyczerpany|osiągnięty)|wyprzedan|sold\s*out|rejestracja\s+(?:została\s+)?(?:zamknięta|zakończona)|zapisów\s+brak/i;
const OPEN = /zapisy\s+(?:internetowe\s+|online\s+)?(?:są\s+)?(?:otwarte|trwają|ruszyły|wystartowały)|rejestracja\s+(?:jest\s+)?(?:otwarta|trwa)|zapisy\s+(?:już\s+)?(?:otwarte|ruszyły)/i;
const DEADLINE = new RegExp(`(?:zapis\\w*|rejestracj\\w*|zgłoszeni\\w*)[^.;]{0,90}?(?:najpóźniej\\s+do|do\\s+dnia|trwają\\s+do|potrwają\\s+do|przyjmowane\\s+(?:są\\s+)?do|możliwe\\s+(?:są\\s+)?do|prowadzone\\s+(?:są\\s+)?do|do)\\s+${DATE_RE}`, "gi");
const CLOSING = new RegExp(`(?:zamknięcie|koniec|zakończenie|ostatni\\s+dzień)\\s+(?:zapisów|rejestracji|zgłoszeń)[^.;]{0,40}?${DATE_RE}`, "gi");
const LIMIT = /limit\w*\s+(?:uczestników|zawodników|miejsc|startujących|osób)[^0-9.;]{0,40}?(\d{2,5})\s*(?:osób|osoby|zawodników|uczestników|miejsc)?/i;

/** Analiza jednego tekstu (regulamin albo strona organizatora). */
export function extractSignup(text: string, raceDate: string, source: Signup["source"], today: string): Signup | null {
  const t = text.replace(/\s+/g, " ");
  const raceYear = Number(raceDate.slice(0, 4));
  const out: Signup = { status: "unknown", source };
  // termin: kilka trafień, bierzemy najpóźniejszy sensowny (przedłużenia), ale nie po dacie biegu
  const dates: string[] = [];
  // kontekst, który NIE mówi o terminie zapisów: opłaty, raty, promocje, autokary, noclegi, koszulki, przepisania
  const NOISE = /zł|opłat|płatno|przelew|preferencyj|zniżk|promoc|\brat[ay]?\b|pakiet|cen[aey]\b|autokar|autobus|transport|nocleg|koszulk|przepis|zwrot|rezygn|zmian[ay]\s+dystansu|biurze\s+zawodów|dla\s+zapis|przy\s+zapis|w\s+przypadku\s+zapis/i;
  const raceMs = Date.parse(raceDate);
  for (const re of [DEADLINE, CLOSING]) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(t))) {
      const ctx = t.slice(Math.max(0, m.index - 50), m.index + m[0].length + 30);
      if (NOISE.test(ctx)) continue;
      const d = parseDateLoose(m[1], raceDate);
      if (!d || d > raceDate) continue;
      // data z poprzedniej edycji (stary regulamin): starsza niż 200 dni przed biegiem = odrzucamy
      if ((raceMs - Date.parse(d)) / 86400000 > 200) continue;
      dates.push(d);
    }
  }
  if (dates.length) out.until = dates.sort().at(-1);
  if (/do\s+wyczerpania\s+(?:limitu|miejsc)/i.test(t)) out.note = "do wyczerpania limitu";
  const lm = t.match(LIMIT); if (lm) { const n = parseInt(lm[1], 10); if (n >= 20 && n <= 20000) out.limit = n; }
  // sygnały jawne (pomijamy zdania o innym roku niż rok biegu, np. "zapisy na edycję 2025 zamknięte")
  const sent = (re: RegExp) => { const m = t.match(re); if (!m) return null; const i = m.index ?? 0; return t.slice(Math.max(0, i - 80), i + m[0].length + 80); };
  const c = sent(CLOSED), o = sent(OPEN);
  const otherYear = (s: string | null) => !!s && /\b20\d{2}\b/.test(s) && !s.includes(String(raceYear));
  if (c && !otherYear(c)) out.status = "closed";
  else if (o && !otherYear(o)) out.status = "open";
  if (out.until && out.status === "unknown") out.status = out.until >= today ? "open" : "closed";
  if (out.until && out.until < today && out.status === "open") out.status = "closed";
  if (out.status === "unknown" && !out.until && !out.limit && !out.note) return null;
  return out;
}

/** Scala wyniki z kilku źródeł: jawne "zamknięte" wygrywa, potem data, potem "otwarte". */
export function mergeSignup(parts: (Signup | null)[], today: string): Signup | undefined {
  const xs = parts.filter((x): x is Signup => !!x);
  if (!xs.length) return undefined;
  const until = xs.map((x) => x.until).filter(Boolean).sort().at(-1) as string | undefined;
  const limit = xs.map((x) => x.limit).find(Boolean);
  const registered = xs.map((x) => x.registered).find((v) => v !== undefined);
  const note = xs.map((x) => x.note).find(Boolean);
  let status: SignupStatus = "unknown";
  let src = xs[0];
  const closed = xs.find((x) => x.status === "closed" && !x.until);
  const open = xs.find((x) => x.status === "open");
  if (closed) { status = "closed"; src = closed; }
  else if (until) { status = until >= today ? "open" : "closed"; src = xs.find((x) => x.until === until)!; }
  else if (open) { status = "open"; src = open; }
  if (limit && registered !== undefined && registered >= limit) status = "closed";
  return { status, until, limit, registered, note, source: src.source, sourceUrl: src.sourceUrl, checkedAt: today };
}
