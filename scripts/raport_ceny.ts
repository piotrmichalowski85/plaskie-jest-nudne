/**
 * Wydruk liczb raportu "Ile kosztuje bieg górski i trailowy w Polsce" z data/raport_ceny.json (te same funkcje co strona: lib/raport-ceny.ts).
 * Uruchomienie: npx tsx scripts/raport_ceny.ts [--json]
 * Za rok: zweryfikować regulaminy (scripts/raport_ceny/README.md), złożyć nowy zbiór (scripts/raport_ceny/zbuduj_zbior.py), uruchomić ten skrypt i porównać z liczbami na stronie.
 *
 * Wzory (wszystko na poziomie cennika, czyli pary bieg i dystans):
 *  - cena pierwszego progu = kwota z najwcześniejszego progu zapisów internetowych; cena ostatniego progu = kwota z ostatniego progu zapisów internetowych (bez opłaty płatnej dopiero w biurze zawodów)
 *  - mediana i kwartyle: interpolacja liniowa (jak PERCENTYL w arkuszu); rozstęp = minimum i maksimum
 *  - zł za km = cena progu / długość trasy w km; bez biegów bezpłatnych
 *  - koszt zwlekania = (ostatni próg - pierwszy próg) / pierwszy próg, tylko cenniki z co najmniej dwoma progami internetowymi
 *  - dni przed startem = data startu - ostatni dzień pierwszego progu, tylko cenniki z co najmniej dwoma progami i datą pierwszego progu
 *  - województwo pokazujemy od 8 imprez (MIN_EVENTS)
 */
import { computeStats, report, MIN_EVENTS, toCsv, type Summary } from "../lib/raport-ceny";

const s = computeStats();
if (process.argv.includes("--json")) { console.log(JSON.stringify(s, null, 1)); process.exit(0); }
const f = (v: number, d = 0) => v.toFixed(d).replace(".", ",");
const sum = (x: Summary, d = 0) => `mediana ${f(x.median, d)} | min ${f(x.min, d)} | Q1 ${f(x.q1, d)} | Q3 ${f(x.q3, d)} | max ${f(x.max, d)} | n=${x.n}`;

console.log(`${report.title}\nzbiór z ${report.generatedAt}, odczyt regulaminów ${report.readFrom} do ${report.readTo}`);
console.log(`cenniki n=${s.n}, imprezy ${s.events}, regulaminy ${s.regulaminy}; edycje: ${s.byYear.map((y) => `${y.year}: ${y.n}`).join(", ")}`);
console.log(`weryfikacja: ${report.counts.regulaminyChecked} regulaminów, ${report.counts.autoRowsChecked} wierszy automatu: ${report.counts.autoRowsOk} zgodnych, ${report.counts.autoRowsWrong} błędnych, ${report.counts.autoRowsOutOfScope} poza zakresem, ${report.counts.autoRowsNotInText} bez pokrycia w tekście; cenników spisanych ${report.counts.pricelistsRead}, odrzuconych ${report.counts.pricelistsDropped}\n`);
for (const b of s.buckets) {
  console.log(`== ${b.label} (n=${b.n}, imprez ${b.events})`);
  console.log(`  pierwszy próg [zł]:  ${sum(b.first)}`);
  console.log(`  ostatni próg [zł]:   ${sum(b.last)}`);
  console.log(`  zł/km pierwszy próg: ${sum(b.perKmFirst, 2)}`);
  console.log(`  zł/km ostatni próg:  ${sum(b.perKmLast, 2)}`);
  console.log(`  wzrost [%]:          ${sum(b.rise, 1)}`);
  console.log(`  wzrost [zł]:         ${sum(b.riseZl)}`);
  console.log(`  dni przed startem:   ${sum(b.days)}`);
  console.log(`  najtańsze:  ${b.cheapest.map((r) => `${r.event}, ${r.route} (${r.km} km): ${r.tiers[0].pln} zł`).join("; ")}`);
  console.log(`  najdroższe: ${b.priciest.map((r) => `${r.event}, ${r.route} (${r.km} km): ${r.tiers[0].pln} zł`).join("; ")}`);
}
console.log(`\n== całość`);
console.log(`  wzrost pierwszy -> ostatni próg [%]: ${sum(s.rise, 1)} (cenników z jedną ceną: ${s.nSinglePrice})`);
console.log(`  wzrost [zł]: ${sum(s.riseZl)}`);
console.log(`  biuro zawodów wobec pierwszego progu [%]: ${sum(s.onsiteRise, 1)}`);
console.log(`  biuro zawodów wobec ostatniego progu [zł]: ${sum(s.onsiteVsLast)}`);
console.log(`  dni przed startem, koniec pierwszego progu: ${sum(s.days)}`);
console.log(`  liczba progów internetowych: ${sum(s.tiersCount)}`);
console.log(`\n== województwa (od ${MIN_EVENTS} imprez)`);
for (const w of s.woj) console.log(`  ${w.woj}: imprez ${w.events}, cenników ${w.n}, zł/km pierwszy próg: ${sum(w.perKmFirst, 2)}; ${w.buckets.map((b) => `${b.label}: ${b.first ? `${f(b.first.median)} zł (n=${b.n})` : `n=${b.n}, pominięte`}`).join("; ")}`);
console.log(`  pominięte (za mało imprez): ${s.wojSkipped.map((w) => `${w.woj} ${w.events}`).join(", ")}`);
console.log(`\nCSV: ${toCsv().trim().split("\n").length - 1} wierszy danych`);
