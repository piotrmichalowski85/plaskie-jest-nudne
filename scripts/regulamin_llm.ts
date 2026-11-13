/**
 * Szerszy wyciąg z regulaminu przez lokalne `claude -p` (subskrypcja, bez klucza API), ten sam automat co sprzęt (gear_llm.ts).
 * Pola: limit czasu per dystans, opłata startowa i progi cenowe, godzina startu, biuro zawodów, bufety, kije, pies, bieg dla dzieci.
 * Wynik: data/regulamin_info.json, klucz = adres regulaminu. Nakładane na biegi w lib/data.ts przy buildzie (races.json bez zmian).
 * Uruchamiać na Macu po scrape (cache tekstów regulaminów w data/.regulaminy_text). Argument: limit nowych regulaminów (domyślnie 60).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import type { RegInfo } from "../lib/types";

const OUT = process.env.REGULAMIN_OUT || "data/regulamin_info.json";
// REGULAMINY_TEXT_DIR: katalog z tekstami regulaminów (domyślnie lokalny cache scrape); REGULAMIN_OUT: plik wyniku (do przebiegów równoległych, scalanych potem przez --import)
const TEXT_DIR = process.env.REGULAMINY_TEXT_DIR || "data/.regulaminy_text";
const textPath = (u: string) => `${TEXT_DIR}/${createHash("sha1").update(u).digest("hex")}.txt`;
const MAX_TEXT = 150000; // najdłuższy regulamin w cache ma ok. 62 tys. znaków; do 13.11.2026 cięliśmy do 40 tys. i cenniki z końca tekstu ginęły
const MAX_FEES = 240; // do 13.11.2026 limit 40 wierszy ucinał cenniki festiwali i cykli (X-RUN, DFBG, Gdynia Ultra Way)
const info: Record<string, RegInfo> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const races = (JSON.parse(readFileSync("data/races.json", "utf8")) as { races: { regulaminUrl?: string; dateEnd: string }[] }).races;
// tryb importu: `--import plik.json [...]` scala wyniki ekstrakcji zrobionej poza `claude -p` (np. gdy sesja CLI wygasła), przez tę samą walidację
// tryb powtórki: `--redo [i/n]` czyta od nowa także regulaminy, które już mają wyciąg (po zmianie promptu); i/n dzieli listę na n części do przebiegów równoległych
const importFiles = process.argv[2] === "--import" ? process.argv.slice(3) : [];
const redo = process.argv[2] === "--redo";
const [shard, shards] = redo && process.argv[3] ? process.argv[3].split("/").map(Number) : [0, 1];
const limit = importFiles.length ? 0 : redo ? 1000 : Number(process.argv[2] || 60);
const today = new Date().toISOString().slice(0, 10);
// najpierw regulaminy nadchodzących biegów, potem reszta
const urls = [...new Set([...races].sort((a, b) => Number(b.dateEnd >= today) - Number(a.dateEnd >= today)).map((r) => r.regulaminUrl).filter((u): u is string => !!u))];

const PROMPT = `Poniżej tekst regulaminu biegu górskiego, trailowego albo przełajowego. Wyciągnij fakty WYŁĄCZNIE z tego tekstu. Niczego nie zgaduj: jeśli czegoś nie ma w tekście, pomiń pole albo daj null.
Zwróć TYLKO obiekt JSON (bez komentarza) o polach:
- "year": rok edycji, której dotyczy regulamin (liczba) albo null,
- "limits": tablica {"km": liczba, "limitH": liczba godzin (np. 4.5)} dla dystansów z limitem czasu,
- "fees": tablica {"km": liczba albo null, "pln": kwota w zł, "until": "YYYY-MM-DD" albo null, "onsite": true albo false, "kind": rodzaj opłaty, "perPerson": liczba albo null, "label": krótka nazwa wariantu albo null}. Zasady:
  * wypisz WSZYSTKIE trasy i WSZYSTKIE progi cenowe z tekstu, niczego nie skracaj i nie urywaj listy, także gdy regulamin obejmuje kilka imprez cyklu (wtedy "label" to nazwa imprezy);
  * "km": długość trasy w kilometrach podana w regulaminie, a nie liczba z nazwy trasy (np. "UK100 - dystans 108 km" daje 108); gdy tekst nigdzie nie podaje długości, weź liczbę z nazwy; null gdy jedna opłata obejmuje wszystkie trasy;
  * "until": ostatni dzień, w którym obowiązuje kwota; próg "od 01.05 do 15.06" ma until 15.06; ostatni próg też dostaje datę, jeśli tekst ją podaje (koniec zapisów, "płatne do", dzień startu); null tylko wtedy, gdy przy kwocie nie ma żadnej daty końcowej;
  * "onsite": true, gdy kwotę płaci się dopiero w biurze zawodów albo w dniu startu (wtedy "until" null); false przy zapisach internetowych;
  * "kind": "start" = start indywidualny dorosłej osoby w biegu; "para" = cena za parę albo duet (podaj kwotę za całą parę); "sztafeta" = sztafeta albo drużyna (kwota za zespół); "marsz" = nordic walking, marsz, marszobieg, rajd pieszy; "dzieci" = biegi dzieci, młodzieży i rodzinne; "karnet" = karnet albo pakiet na kilka biegów cyklu; "znizka" = cena ulgowa (mieszkańcy, klub, senior, kod rabatowy, uczestnicy poprzednich edycji); "inne" = bieg z psem, rower, koszulka, medal, posiłek, transport, zmiana dystansu i każda inna dopłata. Gdy jedna kwota dotyczy biegu i marszu, daj "start";
  * "perPerson": tylko przy "para" i "sztafeta": kwota od osoby, jeśli regulamin podaje ją WPROST; inaczej null (nie dziel samodzielnie);
  * "label" podaj TYLKO wtedy, gdy ten sam dystans i ten sam "kind" ma kilka osobnych cenników, np. "6 h" i "12 h" albo nazwa imprezy cyklu; ma do 25 znaków i jest taki sam we wszystkich progach danego cennika; inaczej null,
- "startTimes": tablica {"km": liczba albo null, "time": "HH:MM"} (godzina startu dystansu),
- "office": biuro zawodów krótko, do 120 znaków (miejsce i godziny) albo null,
- "aid": punkty odżywcze i bufety krótko, do 100 znaków (np. "3 bufety na 30 km, woda i izotonik") albo null,
- "poles": "tak" gdy kije są dozwolone, "nie" gdy zakazane, null gdy regulamin nie mówi,
- "dogs": "tak" gdy można biec z psem (canicross, pies na smyczy), "nie" gdy zakazane, null gdy regulamin nie mówi,
- "kids": true gdy w ramach imprezy jest bieg dla dzieci, null gdy regulamin nie mówi.
Liczby jako liczby, teksty po polsku.`;

let done = 0, empty = 0, fail = 0;
for (const f of importFiles) {
  for (const [u, raw] of Object.entries(JSON.parse(readFileSync(f, "utf8")) as Record<string, Record<string, unknown>>)) {
    const x = clean(raw); info[u] = { ...x, at: new Date().toISOString() };
    if (Object.keys(x).some((k) => k !== "year")) done++; else empty++;
  }
  writeFileSync(OUT, JSON.stringify(sortKeys(info), null, 1) + "\n");
}
for (const [n, u] of (importFiles.length ? [] : urls).entries()) {
  if ((!redo && info[u]) || !existsSync(textPath(u)) || n % shards !== shard || (process.env.REGULAMIN_ONLY && !u.includes(process.env.REGULAMIN_ONLY))) continue;
  if (done + empty + fail >= limit) break;
  const text = readFileSync(textPath(u), "utf8").slice(0, MAX_TEXT);
  try {
    const r = spawnSync("claude", ["-p", "--model", "haiku", "--output-format", "text", `${PROMPT}\n\n<regulamin>\n${text}\n</regulamin>`], { encoding: "utf8", timeout: 180000, maxBuffer: 10_000_000, stdio: ["ignore", "pipe", "pipe"], env: { HOME: process.env.HOME || "", PATH: process.env.PATH || "", USER: process.env.USER || "", LANG: "pl_PL.UTF-8" } as unknown as NodeJS.ProcessEnv });
    const out = (r.stdout || "").replace(/```[a-z]*/g, "");
    const m = out.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`brak obiektu JSON; status=${r.status} signal=${r.signal} ${(r.stderr || "").slice(0, 200)}`);
    const x = clean(JSON.parse(m[0]));
    info[u] = { ...x, at: new Date().toISOString() };
    const n = Object.keys(x).filter((k) => k !== "year").length;
    if (n) done++; else empty++;
    console.log(n ? `+ ${Object.keys(x).join(",")}` : "- pusto", u);
  } catch (err) {
    fail++;
    console.warn("x", u, String((err as Error).message).replace(/\s+/g, " ").slice(0, 300));
  }
  writeFileSync(OUT, JSON.stringify(sortKeys(info), null, 1) + "\n");
}
console.log(`regulamin: ${done} z danymi, ${empty} pustych, ${fail} błędów`);

/** walidacja odpowiedzi modelu: tylko sensowne wartości, reszta odpada */
function clean(o: Record<string, unknown>): Omit<RegInfo, "at"> {
  const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : typeof v === "string" && /^\d+([.,]\d+)?$/.test(v.trim()) ? parseFloat(v.replace(",", ".")) : undefined);
  const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]).filter((x) => x && typeof x === "object") : []);
  const str = (v: unknown, max: number) => (typeof v === "string" && v.trim().length >= 3 ? v.trim().slice(0, max) : undefined);
  const yn = (v: unknown) => (v === "tak" || v === true ? "tak" : v === "nie" || v === false ? "nie" : undefined);
  const res: Omit<RegInfo, "at"> = {};
  const year = num(o.year); if (year && year >= 2015 && year <= 2035) res.year = year;
  const limits = arr(o.limits).map((x) => ({ km: num(x.km)!, limitH: num(x.limitH)! })).filter((x) => x.km >= 1 && x.km <= 400 && x.limitH > 0.2 && x.limitH <= 150 && x.limitH / x.km <= 1.2);
  if (limits.length) res.limits = limits.slice(0, 40);
  // opłaty: w wyciągu zostają starty indywidualne (bez pola kind) oraz warianty pokazywane z etykietą (para, sztafeta, marsz);
  // biegi dzieci, karnety na cykl, zniżki i dopłaty odpadają, żeby strona biegu nie podawała ich jako opłaty startowej
  const KEEP = new Set(["para", "sztafeta", "marsz"]);
  const fees = arr(o.fees).map((x) => {
    const kind = typeof x.kind === "string" ? x.kind.trim().toLowerCase() : "start";
    const onsite = x.onsite === true;
    const pp = num(x.perPerson);
    return {
      km: num(x.km), pln: num(x.pln)!, until: !onsite && typeof x.until === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.until) ? x.until : undefined,
      label: typeof x.label === "string" && x.label.trim().length >= 2 ? x.label.trim().slice(0, 25) : undefined,
      kind: KEEP.has(kind) ? (kind as "para" | "sztafeta" | "marsz") : undefined, drop: kind !== "start" && !KEEP.has(kind),
      onsite: onsite || undefined, perPerson: KEEP.has(kind) && kind !== "marsz" && pp !== undefined && pp >= 10 && pp <= 3000 ? pp : undefined,
    };
  }).filter((x) => !x.drop && (x.pln === 0 || (x.pln >= 10 && x.pln <= 3000)));
  // literówka w kwocie w samym regulaminie (np. "1150,00 PLN" między progami 170 i 240 zł): kwota ponad 2,5 raza wyższa od mediany swojego cennika odpada, zostają pewne progi
  const med = (xs: number[]) => { const v = [...xs].sort((p, q) => p - q); return v[Math.floor((v.length - 1) / 2)]; };
  const groups = new Map<string, number[]>();
  for (const f of fees) { const k = `${f.km ?? ""}|${f.kind ?? ""}|${f.label ?? ""}`; groups.set(k, [...(groups.get(k) ?? []), f.pln]); }
  const sane = fees.filter((f) => { const g = groups.get(`${f.km ?? ""}|${f.kind ?? ""}|${f.label ?? ""}`)!; return f.km === undefined || g.length < 3 || f.pln <= 2.5 * med(g); });
  if (sane.length) res.fees = sane.slice(0, MAX_FEES).map(({ drop: _d, ...f }) => { void _d; return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined)) as NonNullable<RegInfo["fees"]>[number]; });
  const st = arr(o.startTimes).map((x) => ({ km: num(x.km), time: typeof x.time === "string" ? x.time.trim().replace(/^(\d):/, "0$1:").replace(".", ":") : "" })).filter((x) => /^([01]\d|2[0-3]):[0-5]\d$/.test(x.time));
  if (st.length) res.startTimes = st.slice(0, 40).map((s) => (s.km === undefined ? { time: s.time } : s));
  const office = str(o.office, 140); if (office) res.office = office;
  const aid = str(o.aid, 120); if (aid) res.aid = aid;
  const poles = yn(o.poles); if (poles) res.poles = poles;
  const dogs = yn(o.dogs); if (dogs) res.dogs = dogs;
  if (o.kids === true) res.kids = true;
  return res;
}
function sortKeys<T>(o: Record<string, T>) { return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))); }
