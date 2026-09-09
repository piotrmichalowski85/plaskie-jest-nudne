# plaskiejestnudne.pl - plan budowy

> Side project Piotra. Agregator biegów trail/górskich/przełajowych w Polsce + onboarding początkującego.
> Status: plan (przed Fazą 0). Repo: `~/Claude/plaskie-jest-nudne/`.

## Pozycjonowanie (z czego wynika reszta)
Agregator biegów trail/górskich/przełajowych w PL + onboarding początkującego. Trzy filary:
1. zawsze aktualny kalendarz (auto-pobieranie + odświeżanie),
2. wyszukiwarka z sensownymi filtrami,
3. kreator "wybierz swój pierwszy niepłaski bieg".

City Trail i przełaje wchodzą w zakres - jako osobny tag `przełaj/miejski` (nie mieszają się z górami w filtrach, ale są w bazie i często to idealny pierwszy niepłaski bieg). Ton: nie elitarny ultra-bros, tylko "wejdź w trail, zacznij od podbiegu".

## Architektura - przepływ danych
```
ŹRÓDŁA -> [adaptery] -> surowe rekordy -> [normalizacja] -> [dedup] -> KANON (DB) -> API -> FRONTEND
  (scraping + 1 RSS)                                        (provenance: link do każdego źródła)
```
Sercem i jedynym prawdziwym kosztem utrzymania jest warstwa scraping + dedup. API praktycznie nie ma (poza DUV RSS), więc inwestycja idzie w utrzymywalne adaptery, nie w integracje.

## Stack (rekomendacja - znany z piotr-site / AI Enablers)

| Warstwa | Wybór | Dlaczego |
|---|---|---|
| Frontend + API | Next.js 16 (App Router) + Vercel | Znany stack, świetne SEO (kluczowe dla agregatora) |
| Baza | Vercel Postgres (Neon) | Relacyjny model Event/Race/Source + dedup; darmowy start |
| ORM | Drizzle (lub Prisma) | Lekki, typowany |
| Scrapery lekkie (HTML, RSS) | fetch + cheerio w Vercel Cron | Proste źródła, codzienny refresh |
| Scrapery ciężkie (JS, anty-bot) | Playwright na GitHub Actions (cron) piszące do tej samej Neon DB | Brak limitu czasu Vercel functions, za darmo, izolacja |
| Wyszukiwarka | Postgres full-text + filtry na start; Meilisearch/Typesense gdy urośnie | Nie przepłacać na MVP |

## Model danych (kluczowa decyzja: Festiwal != Bieg)
Festiwal ma wiele biegów (Łemkowyna = 150/100/70/48/30/10 km). Dlatego:

- `events` (festiwal/impreza): slug, nazwa kanoniczna, organizator, region, pasmo, miasto, geo (lat/lng), edycja, www
- `races` (konkretny dystans): event_id, dystans_km, przewyższenie_m, nawierzchnia (`trail`/`górski`/`przełaj`/`miejski`), data, start, limit czasu (cutoff), punkty ITRA, beginner_score, link zapisów, cena, status (`planowany`/`zapisy`/`zamknięte`/`odwołany`)
- `sources` + `source_records` (surowe rekordy z provenance) + `race_sources` (ten sam bieg <-> N źródeł) -> napędza dedup i informację "widnieje w 3 serwisach"

### Dedup (ten sam bieg w wielu źródłach)
Klucz dopasowania: znormalizowana nazwa (fuzzy) + data (+/- 2 dni) + geolokalizacja miejscowości + dystans. Blokowanie kandydatów po miesiącu+regionie. Narzędzia referencyjne: dedupe (Python, ML record linkage bez wspólnego ID) lub Splink (skalowalne). Dla MVP wystarczy własne scoringowe dopasowanie w kroku normalizacji.

## Funkcje

### Wyszukiwarka / kalendarz
Filtry: region/pasmo, miesiąc, dystans (do 15 / 15-30 / maraton / ultra), przewyższenie, trudność, nawierzchnia, "zapisy otwarte", cena, "blisko mnie". Widoki: lista + mapa + oś czasu.

### Kreator "wybierz swój pierwszy niepłaski bieg"
5 pytań:
1. Skąd startujesz biegowo? (zero / biegam płasko / mam maraton)
2. Najdłuższy dystans, jaki przebiegłeś?
3. Region / ile gotów dojechać?
4. Kiedy chcesz pobiec? (miesiące)
5. Cel: ukończyć na luzie czy się ścigać?

Zwraca 3-5 dopasowanych biegów posortowanych po `beginner_score`.

`beginner_score` (1-5) liczony z: dystans + przewyższenie/km (gradient) + hojność limitu czasu (cutoff) + nawierzchnia. Niski dystans + małe przewyższenie + duży cutoff = "idealny pierwszy". To samo zasila badge "dobry na start" w całym serwisie.

## Źródła danych wg faz (kolejność = pokrycie / łatwość)

| Faza | Adaptery | Co dają | Dostęp |
|---|---|---|---|
| MVP | biegigorskie.pl (kalendarz), b4sportonline.pl, elektronicznezapisy.pl (sekcja górska), DUV RSS | ~80% pokrycia + jedyny czysty feed | scraping + RSS |
| V1 | ITRA + UTMB Index (wzbogacanie: punkty/przewyższenie), citytrail.pl | jakość kart + przełaje miejskie | scraping |
| V2 | maratonypolskie.pl, dostartu.pl, zmierzymyczas.pl | długi ogon małych biegów | scraping |

### Legalność
Agregujemy fakty (nazwa/data/miejsce/dystans) = OK, nie podlegają prawu autorskiemu. NIE kopiujemy list startowych ani wyników (dane osobowe = RODO + ochrona bazy danych sui generis). ahotu.com zwraca 403 (anty-bot) - pomijamy, niskie ROI.

## Plan faz

| Faza | Zakres | Efekt |
|---|---|---|
| 0 - Fundament | Repo, Next.js+Vercel+Neon, schema, brand-skeleton, 1 adapter end-to-end (biegigorskie) -> lista | Dowód, że pipeline działa |
| 1 - MVP | 4 adaptery + dedup v1 + wyszukiwarka z filtrami + karty biegu/festiwalu + cron (codzienny refresh) | Działający kalendarz online |
| 2 - Kreator | Wizard + beginner_score + wzbogacanie ITRA/UTMB + City Trail + strony SEO (region/miesiąc) | Sygnaturowa funkcja + ruch organiczny |
| 3 - Skala | Reszta adapterów + monitoring scraperów (alert gdy źródło zmieni HTML) + powiadomienia "nowe biegi w Twoim regionie" + mapa | Kompletność + retencja |

## Ryzyka / decyzje otwarte
- Utrzymanie scraperów = główny koszt (źródła zmieniają HTML). Mitigacja: adaptery + testy "golden record" + alert przy zerowym/dziwnym zaciągu.
- Domena: sprawdzić dostępność plaskiejestnudne.pl i złapać, zanim ruszymy.
- Monetyzacja / cel serwisu: nieustalone - wpłynie na priorytety V2 (np. afiliacja zapisów, promowane biegi, newsletter).

---

## Załącznik: research źródeł + wolumen H2 2026

### Mapa źródeł

Platformy zapisów + pomiaru (najwięcej świeżych, strukturalnych rekordów; wszystkie scraping, brak API/RSS):
- b4sportonline.pl - serce biegów górskich (obsługuje Łemkowynę, DFBG); BiegiGorskie.pl poleca właśnie tę platformę. Pokrycie górskie: bardzo wysokie.
- elektronicznezapisy.pl - dedykowana sekcja "Kalendarz biegów górskich"; pola: nazwa, data, liczba zawodników, link, lista startowa.
- dostartu.pl - backend API pod /api/ ale zablokowane w robots.txt (prywatne) -> scraping HTML.
- zmierzymyczas.pl - HTML table; ma sporo biegów górskich (nie tylko szosa).
- datasport.pl, protiming, ultimasport, sts-timing - operatorzy regionalni, ogon.

Portale-kalendarze (kurowane, dobre do "co ważne" i dedupu; scraping):
- biegigorskie.pl/kalendarz-2026 - najlepszy tematyczny kalendarz górski; 188 imprez na 2026 (główny anchor wolumenu).
- maratonypolskie.pl - największy ogólny kalendarz, filtr biegi górskie/trail.
- treningbiegacza.pl/kalendarz-biegow/biegi-gorskie - tematyczny górski.
- biegiwpolsce.pl, kalendarzbiegowy.pl - ogólne, uzupełnienie.
- enduhub.com - kalendarz + wyniki historyczne, międzynarodowy.

Bazy międzynarodowe z danymi PL:
- DUV (statistik.d-u-v.org) - filtr POL + rok; ~140 ultra w PL na 2026; MA RSS 2.0 (xml/nextraces_rss.php) = jedyne ustrukturyzowane źródło w całej puli.
- ITRA (itra.run) - punkty ITRA, kategoryzacja, filtr kraj=Polska; brak API -> scraping; do wzbogacania kart.
- UTMB Index (utmb.world/index-races) - filtr Polska; brak udokumentowanego API -> praktycznie scraping.
- ahotu.com - kalendarz trail Poland; ochrona anty-bot (403) - trudny scraping, pomijamy.
- RunSignup - ma otwarte API (Apache), ale to platforma US, prawie brak biegów PL -> pomijalne.

Serie i cykle:
- Salomon Golden Trail / Golden Trail National Series (DFBG jest częścią GTNS).
- Garmin Ultra Race (ultrarace.pl) - ogólnopolska seria ultra/górska, kwalifikacje UTMB; zapisy przez startlist.pl; scraping.
- City Trail (citytrail.pl) - największy cykl, przełaje miejskie (28 biegów, 7 miast); w zakresie jako tag przełaj/miejski.
- Korona Gór Polski i cykle regionalne.

### Rekomendowany minimalny zestaw źródeł
Rdzeń (~80% pokrycia): b4sportonline.pl + elektronicznezapisy.pl + biegigorskie.pl/kalendarz + DUV RSS.
Wzbogacanie: ITRA + UTMB Index.
Ogon: maratonypolskie.pl + dostartu.pl + zmierzymyczas.pl.
Kręgosłup techniczny: 95% scraping + DUV RSS jako jedyny czysty feed + silnik deduplikacji jako warstwa scalająca.

### Wolumen H2 2026 (lipiec-grudzień)

Anchor twardy - kalendarz biegigorskie.pl 2026 (kurowany górski):

| Miesiąc | Imprezy górskie/trail |
|---|---|
| Lipiec | 16 |
| Sierpień | 12 |
| Wrzesień | 17 |
| Październik | 13 |
| Listopad | 6 |
| Grudzień | 4 |
| H2 razem | 68 |

Drugi anchor - DUV: ~140 ultramaratonów w PL na cały 2026 (sam segment ultra); sezon górski kumuluje się w H2.

Rzędy wielkości na H2 2026:
- notowane/nazwane biegi trail+górskie: ~68 (anchor) do ~100-120 z ogonem,
- z drobnymi lokalnymi: realnie 150-250+ w samym H2,
- festiwale (multi-bieg, multi-dzień): ~15-25 dużych w H2.

Flagowce w H2 2026 (potwierdzone daty):

| Impreza | Termin 2026 | Region | Skala |
|---|---|---|---|
| Dolnośląski Festiwal Biegów Górskich (GTNS) | 16-19 lipca | Lądek-Zdrój | 10 tras, 10-240 km |
| Tatra SkyMarathon / Tatra Fest | lipiec | Tatry | do ~120 km |
| Chudy Wawrzyniec | 7-9 sierpnia | Beskid Żywiecki | 6 biegów, do 100 km |
| Ultra Granią Tatr | 2. poł. sierpnia | Tatry | ultra |
| Festiwal Biegowy (17. edycja) | 11-13 września | Piwniczna-Zdrój | wielodniowy (przesunięty z lipca) |
| ultraMaraton Bieszczadzki by Bieg Rzeźnika | 9-10 października | Cisna, Bieszczady | do 100 km |
| Łemkowyna Ultra-Trail | 16-18 października | Beskid Niski | 10-150 km, kultowy |

Uwaga: kultowy Bieg Rzeźnika (główny) jest w czerwcu = H1, nie H2. W H2 wypada jego jesienna odsłona (ultraMaraton Bieszczadzki, 9-10.10).

### Źródła researchu
- biegigorskie.pl/kalendarz-2026 (anchor 188 imprez)
- statistik.d-u-v.org/calendar.php (140 ultra PL 2026, RSS)
- elektronicznezapisy.pl/62/bieg-gorski.html
- b4sportonline.pl/kalendarz
- itra.run/Races/FindRaceResults, utmb.world/index-races
- ultralemkowyna.pl, festiwalbiegowy.pl, chudywawrzyniec.pl, dfbg.pl, maratonbieszczadzki.pl, graniatatr.pl
