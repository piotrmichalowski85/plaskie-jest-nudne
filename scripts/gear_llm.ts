/** Sprzęt obowiązkowy z regulaminu przez lokalne `claude -p` (subskrypcja, bez klucza API). Uruchamiać na Macu po scrape. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const CACHE_PATH = "data/regulaminy.json";
const textPath = (u: string) => `data/.regulaminy_text/${createHash("sha1").update(u).digest("hex")}.txt`;
type Entry = { regulaminUrl?: string; gear: string[]; gearSource?: "llm"; gearAt?: string };
const cache: Record<string, Entry> = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
const limit = Number(process.argv[2] || 100);
let done = 0, none = 0;
for (const [url, e] of Object.entries(cache)) {
  if (!e.regulaminUrl || e.gearSource === "llm" || !existsSync(textPath(e.regulaminUrl))) continue;
  if (done + none >= limit) break;
  const text = readFileSync(textPath(e.regulaminUrl), "utf8").slice(0, 40000);
  const prompt = `Poniżej tekst regulaminu biegu górskiego lub trailowego. Wypisz WYŁĄCZNIE listę sprzętu obowiązkowego (rzeczy, które uczestnik musi mieć przy sobie podczas biegu). Każda pozycja krótko (do 8 słów), po polsku, bez numeracji, bez sprzętu zalecanego, bez numeru startowego i bez chipa. Jeśli regulamin nie wymienia sprzętu obowiązkowego, zwróć pustą tablicę. Jeśli sprzęt zależy od dystansu, dopisz dystans w nawiasie. Odpowiedz TYLKO tablicą JSON ze stringami, bez komentarza.\n\n<regulamin>\n${text}\n</regulamin>`;
  try {
    const out = execFileSync("claude", ["-p", "--model", "haiku", "--output-format", "text", prompt], { encoding: "utf8", timeout: 120000, maxBuffer: 10_000_000 });
    const m = out.match(/\[[\s\S]*\]/);
    const arr = m ? (JSON.parse(m[0]) as unknown) : [];
    const gear = Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x.length >= 3 && x.length <= 80).slice(0, 20) : [];
    e.gear = gear; e.gearSource = "llm"; e.gearAt = new Date().toISOString();
    gear.length ? done++ : none++;
    console.log(gear.length ? `+ ${gear.length}` : "- brak", url);
  } catch (err) {
    console.warn("x", url, (err as Error).message.slice(0, 120));
  }
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));
}
console.log(`gear: ${done} z listą, ${none} bez sprzętu obowiązkowego`);
