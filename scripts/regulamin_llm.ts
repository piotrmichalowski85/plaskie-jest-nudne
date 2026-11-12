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

const OUT = "data/regulamin_info.json";
const textPath = (u: string) => `data/.regulaminy_text/${createHash("sha1").update(u).digest("hex")}.txt`;
const info: Record<string, RegInfo> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const races = (JSON.parse(readFileSync("data/races.json", "utf8")) as { races: { regulaminUrl?: string; dateEnd: string }[] }).races;
// tryb importu: `--import plik.json [...]` scala wyniki ekstrakcji zrobionej poza `claude -p` (np. gdy sesja CLI wygasła), przez tę samą walidację
const importFiles = process.argv[2] === "--import" ? process.argv.slice(3) : [];
const limit = importFiles.length ? 0 : Number(process.argv[2] || 60);
const today = new Date().toISOString().slice(0, 10);
// najpierw regulaminy nadchodzących biegów, potem reszta
const urls = [...new Set([...races].sort((a, b) => Number(b.dateEnd >= today) - Number(a.dateEnd >= today)).map((r) => r.regulaminUrl).filter((u): u is string => !!u))];

const PROMPT = `Poniżej tekst regulaminu biegu górskiego, trailowego albo przełajowego. Wyciągnij fakty WYŁĄCZNIE z tego tekstu. Niczego nie zgaduj: jeśli czegoś nie ma w tekście, pomiń pole albo daj null.
Zwróć TYLKO obiekt JSON (bez komentarza) o polach:
- "year": rok edycji, której dotyczy regulamin (liczba) albo null,
- "limits": tablica {"km": liczba, "limitH": liczba godzin (np. 4.5)} dla dystansów z limitem czasu,
- "fees": tablica {"km": liczba albo null gdy jedna opłata dla wszystkich, "pln": kwota w zł, "until": "YYYY-MM-DD" albo null, "label": krótka nazwa wariantu albo null} (progi cenowe: kwota obowiązująca do daty; pomiń opłaty za pakiety dodatkowe, koszulki, medale, posiłki). "label" podaj TYLKO wtedy, gdy ten sam dystans (albo ta sama opłata bez dystansu) ma kilka osobnych cenników, np. "solo" i "sztafeta", "w parze", "z psem", "6 h" i "12 h" albo nazwa biegu; ma do 25 znaków i jest taki sam we wszystkich progach danego cennika. Gdy dystans ma jeden cennik, "label" to null,
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
for (const u of importFiles.length ? [] : urls) {
  if (info[u] || !existsSync(textPath(u))) continue;
  if (done + empty + fail >= limit) break;
  const text = readFileSync(textPath(u), "utf8").slice(0, 40000);
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
  if (limits.length) res.limits = limits.slice(0, 12);
  const fees = arr(o.fees).map((x) => ({ km: num(x.km), pln: num(x.pln)!, until: typeof x.until === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.until) ? x.until : undefined, label: typeof x.label === "string" && x.label.trim().length >= 2 ? x.label.trim().slice(0, 25) : undefined })).filter((x) => x.pln === 0 || (x.pln >= 10 && x.pln <= 3000));
  if (fees.length) res.fees = fees.slice(0, 40).map((f) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined)) as { km?: number; pln: number; until?: string; label?: string });
  const st = arr(o.startTimes).map((x) => ({ km: num(x.km), time: typeof x.time === "string" ? x.time.trim().replace(/^(\d):/, "0$1:").replace(".", ":") : "" })).filter((x) => /^([01]\d|2[0-3]):[0-5]\d$/.test(x.time));
  if (st.length) res.startTimes = st.slice(0, 12).map((s) => (s.km === undefined ? { time: s.time } : s));
  const office = str(o.office, 140); if (office) res.office = office;
  const aid = str(o.aid, 120); if (aid) res.aid = aid;
  const poles = yn(o.poles); if (poles) res.poles = poles;
  const dogs = yn(o.dogs); if (dogs) res.dogs = dogs;
  if (o.kids === true) res.kids = true;
  return res;
}
function sortKeys<T>(o: Record<string, T>) { return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))); }
