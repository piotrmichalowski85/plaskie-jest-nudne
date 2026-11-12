/**
 * Bramka przypisania regulaminu do biegu: czy znaleziony regulamin dotyczy TEGO biegu (a nie innej imprezy tego samego organizatora,
 * biegu dla dzieci, klasyfikacji ligi, edycji zimowej zamiast letniej albo strony z listą regulaminów).
 * Robot (lib/deep.ts) idzie ze strony biegu po linkach i potrafi trafić w regulamin sąsiedniej imprezy; 12.11.2026 było tak w 40 ze 101 par.
 * Wynik: data/regulamin_fit.json, klucz = id biegu, wartość { url, fit, why, at }. Strona (lib/data.ts) pokazuje regulamin, wyciąg,
 * sprzęt i zapisy z regulaminu WYŁĄCZNIE przy fit === true dla tego samego adresu. Brak wpisu = niepotwierdzony = ukryty.
 * Uruchamiać na Macu po scrape (teksty w data/.regulaminy_text), przez lokalne `claude -p` jak regulamin_llm.ts. Argument: limit nowych par (domyślnie 60).
 * Tryb importu: `--import plik.json [...]` scala werdykty zrobione poza `claude -p` (np. gdy sesja CLI wygasła): { "<id biegu>": { "url", "fit", "why" } }.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

type Verdict = { url: string; fit: boolean; why?: string; at: string };
type R = { id: string; name: string; eventName: string; dateStart: string; dateEnd: string; city: string; distancesKm: number[]; regulaminUrl?: string };

const OUT = "data/regulamin_fit.json";
const textPath = (u: string) => `data/.regulaminy_text/${createHash("sha1").update(u).digest("hex")}.txt`;
const fit: Record<string, Verdict> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const races = (JSON.parse(readFileSync("data/races.json", "utf8")) as { races: R[] }).races;
const importFiles = process.argv[2] === "--import" ? process.argv.slice(3) : [];
const limit = importFiles.length ? 0 : Number(process.argv[2] || 60);
const today = new Date().toISOString().slice(0, 10);
const save = () => writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(fit).sort(([a], [b]) => a.localeCompare(b))), null, 1) + "\n");

const PROMPT = `Sprawdzasz, czy dokument jest regulaminem konkretnego biegu z kalendarza. Poniżej dane biegu i początek tekstu dokumentu.
Odpowiedz "tak" TYLKO wtedy, gdy dokument jest regulaminem tej imprezy (tej albo poprzedniej edycji tej samej imprezy) i obejmuje jej dystanse, albo jest wspólnym regulaminem cyklu lub festiwalu, którego ten bieg jest częścią.
Odpowiedz "nie", gdy to: regulamin innej imprezy tego samego organizatora, edycja zimowa zamiast letniej (albo odwrotnie), regulamin biegu dla dzieci, regulamin jednego dystansu dużej imprezy, regulamin ligi, korony albo klasyfikacji, wyzwanie wirtualne, strona z listą regulaminów, albo gdy data, miejsce i dystanse się nie zgadzają. W razie wątpliwości odpowiedz "nie".
Zwróć TYLKO obiekt JSON: {"fit": "tak" albo "nie", "why": "jedno zdanie po polsku: czego dotyczy dokument"}.`;

let ok = 0, no = 0, fail = 0;
for (const f of importFiles) {
  for (const [id, raw] of Object.entries(JSON.parse(readFileSync(f, "utf8")) as Record<string, { url?: unknown; fit?: unknown; why?: unknown }>)) {
    const r = races.find((x) => x.id === id);
    if (!r?.regulaminUrl || raw.url !== r.regulaminUrl || typeof raw.fit !== "boolean") { fail++; console.warn("x pomijam (brak biegu, inny adres albo zły werdykt):", id); continue; }
    fit[id] = { url: r.regulaminUrl, fit: raw.fit, ...(typeof raw.why === "string" ? { why: raw.why.slice(0, 200) } : {}), at: new Date().toISOString() };
    if (raw.fit) ok++; else no++;
  }
  save();
}
// najpierw nadchodzące biegi; para sprawdzona raz, ponownie dopiero gdy zmieni się adres regulaminu
const todo = importFiles.length ? [] : [...races].sort((a, b) => Number(b.dateEnd >= today) - Number(a.dateEnd >= today)).filter((r) => r.regulaminUrl && fit[r.id]?.url !== r.regulaminUrl && existsSync(textPath(r.regulaminUrl)));
for (const r of todo) {
  if (ok + no + fail >= limit) break;
  const text = readFileSync(textPath(r.regulaminUrl!), "utf8").replace(/\s+/g, " ").slice(0, 14000);
  const race = `Bieg: ${r.name}\nImpreza: ${r.eventName}\nTermin: ${r.dateStart}${r.dateEnd !== r.dateStart ? ` do ${r.dateEnd}` : ""}\nMiejsce: ${r.city}\nDystanse (km): ${r.distancesKm.join(", ") || "brak danych"}\nAdres dokumentu: ${r.regulaminUrl}`;
  try {
    const p = spawnSync("claude", ["-p", "--model", "sonnet", "--output-format", "text", `${PROMPT}\n\n<bieg>\n${race}\n</bieg>\n\n<dokument>\n${text}\n</dokument>`], { encoding: "utf8", timeout: 180000, maxBuffer: 10_000_000, stdio: ["ignore", "pipe", "pipe"], env: { HOME: process.env.HOME || "", PATH: process.env.PATH || "", USER: process.env.USER || "", LANG: "pl_PL.UTF-8" } as unknown as NodeJS.ProcessEnv });
    const m = (p.stdout || "").replace(/```[a-z]*/g, "").match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`brak obiektu JSON; status=${p.status} signal=${p.signal} ${(p.stderr || "").slice(0, 200)}`);
    const x = JSON.parse(m[0]) as { fit?: unknown; why?: unknown };
    if (x.fit !== "tak" && x.fit !== "nie") throw new Error(`zły werdykt: ${String(x.fit).slice(0, 40)}`);
    fit[r.id] = { url: r.regulaminUrl!, fit: x.fit === "tak", ...(typeof x.why === "string" ? { why: x.why.slice(0, 200) } : {}), at: new Date().toISOString() };
    if (x.fit === "tak") ok++; else no++;
    console.log(x.fit === "tak" ? "+ tak" : "- nie", r.id, "|", fit[r.id].why ?? "");
  } catch (err) {
    fail++; // brak werdyktu = regulamin zostaje ukryty do następnego przebiegu
    console.warn("x", r.id, String((err as Error).message).replace(/\s+/g, " ").slice(0, 300));
  }
  save();
}
const pending = races.filter((r) => r.regulaminUrl && fit[r.id]?.url !== r.regulaminUrl).length;
console.log(`regulamin a bieg: ${ok} potwierdzonych, ${no} odrzuconych, ${fail} błędów; czeka na sprawdzenie (ukryte na stronie): ${pending}`);
