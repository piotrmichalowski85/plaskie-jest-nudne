/** Raport zmian po odświeżeniu: porównuje poprzedni data/races.json z nowym i dopisuje wpis do data/zmiany.json (ostatnie 16 raportów).
 *  Użycie: npx tsx scripts/zmiany.ts <poprzedni.json> <nowy.json> [etykieta] */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { Dataset, Race } from "../lib/types";

type Item = { id: string; eventName: string; dateStart: string; city: string; provisional?: boolean };
export type Report = {
  date: string; label: string; total: number; upcoming: number;
  added: Item[]; removed: Item[];
  dateChanged: { id: string; eventName: string; from: string; to: string }[];
  signupChanged: { id: string; eventName: string; from: string; to: string }[];
  gearAdded: Item[]; dplusAdded: Item[]; regulaminAdded: Item[];
};

const [prevPath, nextPath, label = ""] = process.argv.slice(2);
const prev = (existsSync(prevPath) ? JSON.parse(readFileSync(prevPath, "utf8")) : { races: [] }) as Dataset;
const next = JSON.parse(readFileSync(nextPath, "utf8")) as Dataset;
const today = new Date().toISOString().slice(0, 10);
const item = (r: Race): Item => ({ id: r.id, eventName: r.eventName, dateStart: r.dateStart, city: r.city, ...(r.provisional ? { provisional: true } : {}) });
const key = (r: Race) => r.id.replace(/-\d{4}-\d{2}-\d{2}(-2)?$/, "") + "|" + r.dateStart.slice(0, 4); // impreza + rok (zmiana daty nie jest "nowym biegiem")
const pm = new Map(prev.races.map((r) => [key(r), r]));
const nm = new Map(next.races.map((r) => [key(r), r]));
const upcomingOnly = (r: Race) => r.dateEnd >= today;
const rep: Report = {
  date: today, label, total: next.races.length, upcoming: next.races.filter(upcomingOnly).length,
  added: next.races.filter((r) => !pm.has(key(r)) && upcomingOnly(r)).map(item),
  removed: prev.races.filter((r) => !nm.has(key(r)) && upcomingOnly(r)).map(item),
  dateChanged: [], signupChanged: [], gearAdded: [], dplusAdded: [], regulaminAdded: [],
};
for (const [k, n] of nm) {
  const p = pm.get(k); if (!p || !upcomingOnly(n)) continue;
  if (p.dateStart !== n.dateStart) rep.dateChanged.push({ id: n.id, eventName: n.eventName, from: p.dateStart, to: n.dateStart });
  const ps = p.signup?.status || "unknown", ns = n.signup?.status || "unknown";
  if (ps !== ns) rep.signupChanged.push({ id: n.id, eventName: n.eventName, from: ps, to: ns });
  if (!p.gear?.length && n.gear?.length) rep.gearAdded.push(item(n));
  if (!p.elevations.some((e) => e.dplus) && n.elevations.some((e) => e.dplus)) rep.dplusAdded.push(item(n));
  if (!p.regulaminUrl && n.regulaminUrl) rep.regulaminAdded.push(item(n));
}
const OUT = "data/zmiany.json";
const all = (existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : []) as Report[];
const changes = rep.added.length + rep.removed.length + rep.dateChanged.length + rep.signupChanged.length + rep.gearAdded.length + rep.dplusAdded.length + rep.regulaminAdded.length;
const merged = [rep, ...all.filter((x) => x.date !== rep.date || x.label !== rep.label)].slice(0, 16);
writeFileSync(OUT, JSON.stringify(merged, null, 1));
console.log(`zmiany (${label || "bez etykiety"}): nowe ${rep.added.length}, zniknęły ${rep.removed.length}, zmiana daty ${rep.dateChanged.length}, zapisy ${rep.signupChanged.length}, sprzęt ${rep.gearAdded.length}, D+ ${rep.dplusAdded.length}, regulamin ${rep.regulaminAdded.length}; razem ${changes}`);
