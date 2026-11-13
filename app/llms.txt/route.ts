/** llms.txt: krótki opis serwisu i adresy danych dla asystentów AI i automatów. */
import { BASE, DATASET } from "@/lib/open-data";
import { generatedAt, upcomingRaces } from "@/lib/data";
import { allHubs, hubPath } from "@/lib/hubs";

export const dynamic = "force-static";

export function GET() {
  const hubs = allHubs().filter((h) => ["temat", "pasmo", "rok"].includes(h.kind)).slice(0, 40);
  const txt = `# Płaskie jest nudne

> Kalendarz biegów górskich, trailowych i przełajowych w Polsce, pisany dla osób przed pierwszym startem w terenie. Przy każdym biegu: termin, miejsce, dystanse, przewyższenia, limity czasu, status zapisów, opłaty i sprzęt obowiązkowy z regulaminu oraz ocena "dobry na start", "ujdzie na start" albo "zły na start".

Stan danych: ${generatedAt.slice(0, 10)}. Nadchodzących biegów: ${upcomingRaces().length}. Dane odświeżają się automatycznie w poniedziałki i czwartki. Serwis jest niekomercyjny.

## Dane do pobrania

- [Nadchodzące biegi, JSON](${BASE}/api/races.json): pełna lista z dystansami, przewyższeniami, limitami, zapisami i oceną dla początkujących
- [Nadchodzące biegi, CSV](${BASE}/api/races.csv): te same dane, jeden wiersz na dystans
- [Nowe biegi, RSS](${BASE}/feed.xml)
- [Kalendarz iCal](${BASE}/kalendarz.ics)

Licencja: ${DATASET.licenseName} (${DATASET.license}). Dane można cytować i wykorzystywać z podaniem źródła "plaskiejestnudne.pl" i linkiem do strony biegu albo serwisu. Terminy, ceny i limity pochodzą ze stron organizatorów i regulaminów; przed zapisem trzeba je sprawdzić u organizatora.

## Najważniejsze strony

- [Kalendarz biegów](${BASE}/biegi): wszystkie biegi z filtrami i mapą
- [Jak liczymy ocenę dla początkujących i skąd bierzemy dane](${BASE}/o-serwisie)
- [Słownik trailowy](${BASE}/slownik): przewyższenie, limit czasu, sprzęt obowiązkowy, ITRA, UTMB Index
- [Czy dam radę?](${BASE}/czy-dam-rade): przelicznik czasu z płaskiego na bieg w górach
- [Co nowego w kalendarzu](${BASE}/zmiany)

## Zestawienia

${hubs.map((h) => `- [${h.h1}](${BASE}${hubPath(h)})`).join("\n")}

Strona pojedynczego biegu ma adres ${BASE}/bieg/<id>, gdzie <id> pochodzi z pola "id" w danych.
`;
  return new Response(txt, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
