/**
 * IndexNow: po odświeżeniu danych zgłaszamy wyszukiwarkom (Bing, a przez niego Copilot i ChatGPT; także Seznam i Yandex) adresy, które się zmieniły.
 * Klucz jest jawny z założenia protokołu: plik public/<klucz>.txt potwierdza, że zgłasza właściciel domeny.
 *   npx tsx scripts/indexnow.ts            zgłasza strony główne i biegi z najnowszego raportu zmian (data/zmiany.json)
 *   npx tsx scripts/indexnow.ts --dry      tylko wypisuje listę adresów
 * Błąd sieci albo odmowa nie przerywa automatu (kod wyjścia 0).
 */
import { readFileSync, readdirSync } from "node:fs";

const HOST = "plaskiejestnudne.pl", BASE = `https://${HOST}`;
const key = readdirSync("public").map((f) => f.match(/^([a-f0-9]{32})\.txt$/)?.[1]).find(Boolean);
type Item = { id: string };
type Rep = { date: string; added: Item[]; dateChanged: Item[]; signupChanged: Item[]; gearAdded: Item[]; dplusAdded: Item[]; regulaminAdded: Item[] };
const reports = JSON.parse(readFileSync("data/zmiany.json", "utf8")) as Rep[];
const latest = reports[0];
const today = new Date().toISOString().slice(0, 10);
const ids = latest && latest.date === today ? [...new Set([latest.added, latest.dateChanged, latest.signupChanged, latest.gearAdded, latest.dplusAdded, latest.regulaminAdded].flat().map((x) => x.id))] : [];
const urlList = [`${BASE}/`, `${BASE}/biegi`, `${BASE}/zmiany`, `${BASE}/api/races.json`, `${BASE}/feed.xml`, ...ids.slice(0, 200).map((id) => `${BASE}/bieg/${id}`)];

(async () => {
  if (!key) return console.log("indexnow: brak pliku klucza w public/, pomijam");
  if (process.argv.includes("--dry")) return console.log(`indexnow (na sucho): ${urlList.length} adresów\n${urlList.slice(0, 12).join("\n")}`);
  const r = await fetch("https://api.indexnow.org/indexnow", { method: "POST", headers: { "content-type": "application/json; charset=utf-8" }, body: JSON.stringify({ host: HOST, key, keyLocation: `${BASE}/${key}.txt`, urlList }), signal: AbortSignal.timeout(20000) });
  console.log(`indexnow: ${urlList.length} adresów, odpowiedź ${r.status}`);
})().catch((e) => console.log("indexnow: błąd", (e as Error).message));
