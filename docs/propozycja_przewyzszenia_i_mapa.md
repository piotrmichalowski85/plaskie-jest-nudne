# Propozycja: lepsze przewyższenia + mapa + nowy układ strony biegu (09.09.2026, do decyzji, bez developmentu)

## 1. Diagnoza: dlaczego szukam słabo

Dziś automat czyta trzy miejsca: komórkę kalendarza biegigorskie, stronę główną organizatora i regulamin (PDF/HTML). Przewyższenia siedzą zwykle GDZIE INDZIEJ, co pokazał Twój przykład i skan 48 stron organizatorów nadchodzących biegów (dziś wieczorem):

| Fakt ze skanu | Liczba |
|---|---|
| Strony organizatorów nadchodzących biegów (bez platform zapisów) | 48, wszystkie odpowiedziały |
| Mają podstronę "Trasa" / "Dystanse" w menu | 32 (67%) |
| Wzmianka o przewyższeniu na stronie GŁÓWNEJ | 23 |
| Link do GPX / mapy.cz / Strava / Komoot | tylko 4 |
| Biegi, którym brakuje D+ u nas, a organizator ma podstronę Trasa | **19** |

Wniosek: nie ma jednego źródła. Jest hierarchia źródeł o różnej wiarygodności, a ja zatrzymywałem się na najpłytszym poziomie.

Przykład Garmin Ultra Race Radków, podstrona `trasa-radkow`: tekst "Dystans GUR 79 Przewyższenia +2600 m -2600 m ... GUR 59 +1700 m ... GUR 25 +1050 m ... GUR 11 +600 m". Trzy pułapki w tym samym miejscu: (a) nazwy dystansów w źródle (79/59/25/11) różnią się od kalendarza (78/57/24/11), więc trzeba dopasowywać po najbliższym kilometrze, nie po równości; (b) na tej samej stronie jest data "03/05/2025", czyli podstrona może opisywać poprzednią edycję; (c) brak GPX i brak obrazka profilu, więc "prawdy" nie da się policzyć samemu, trzeba zaufać liczbie organizatora.

## 2. Rekomendacja: drabina źródeł przewyższenia (od najpewniejszego)

| Poziom | Źródło | Co daje | Jak automat to bierze | Pokrycie (szacunek na dziś) |
|---|---|---|---|---|
| A | **Plik GPX / KML trasy** (u organizatora, na mapy.cz, Strava routes, Komoot, traseo) | D+ policzone przez nas z wysokości punktów (wygładzone), profil, przebieg na mapie, start/meta | link `.gpx`/`.kml` albo osadzona mapa; parser GPX; D+ liczone jednolicie dla wszystkich biegów | 4 z 48 dziś; zwykle więcej na tydzień przed startem |
| B | **Podstrona "Trasa" organizatora** | liczby "+2600 m" per dystans, czasem obrazek profilu | wejść w link z menu, którego tekst to trasa/trasy/dystanse/route; wzorce "Dystans ... Przewyższenia +N m", "N km (+N m)", "D+ N"; dopasowanie po najbliższym km (tolerancja 3 km albo 6%) | 32 z 48; realnie liczby wyciągnę z ok. 20-25 |
| C | **Regulamin** (mamy) | czasem D+ w tabeli dystansów, limity czasu | już działa | 33 z 56 biegów ma regulamin, D+ w kilku |
| D | **Kalendarz biegigorskie** (mamy) | D+ w komórce dystansu | już działa | 25 biegów |
| E | **ITRA / UTMB Index** | oficjalne D+ i punkty dla biegów certyfikowanych | wyszukanie biegu po nazwie na itra.run (scraping, bez API) | tylko większe biegi, ~15-20% |
| F | **Szacunek z terenu** | gdy nic nie ma: D+ orientacyjne z modelu wysokości (SRTM/Copernicus) dla trasy... której nie znamy | NIE robić: bez śladu nie ma czego liczyć; zamiast tego uczciwe "nieznane" | 0 |

Zasady spajające:
- **Każda liczba z etykietą źródła i datą**: "+2600 m wg strony organizatora (trasa, sprawdzono 09.09.2026)" albo "+2 480 m policzone z GPX". Dziś jest tylko "ok. wg strony organizatora".
- **Świeżość**: jeśli podstrona zawiera datę innego roku niż bieg, liczba dostaje etykietę "z poprzedniej edycji" (nie odrzucamy, trasy rzadko zmieniają się o więcej niż 10%).
- **Konflikt źródeł**: wygrywa A > B > C > D; różnica > 15% między źródłami = flaga do przejrzenia w cotygodniowym digescie.
- **Nieznane pozostaje nieznane**: zero zgadywania. Zamiast "patrz regulamin" jest już "nieznane (organizator nie podał)".

Koszt: poziom B to rozszerzenie istniejącego szukacza (te same mechanizmy co regulamin: wejście w link z menu, wzorce w tekście). Poziom A to parser GPX (biblioteka) plus liczenie D+ (prosty algorytm z wygładzaniem, standard w tej branży: próg 5-10 m). Poziom E osobny adapter, można odłożyć.

Spodziewany efekt dla nadchodzących biegów: D+ z 43 do ~60-65 na 56 (część biegów ma kilka dystansów, więc liczę per bieg z choć jednym D+), przy czym 19 kandydatów z tabeli wyżej to pierwsze, co wpadnie.

## 3. Mapa: co pokazać i czym

| Warstwa | Co | Skąd | Uwaga |
|---|---|---|---|
| Pinezka miejsca startu | miasto/miejscowość z kalendarza | geokodowanie nazwy (Nominatim/OSM, bezpłatne, cache w repo; ~180 zapytań raz) | wystarczy na start; "Zalew Radkowski" i "Rajcza-Ujsoły" zgeokodują się, dziwne miejsca wymagają czyszczenia nazw (już mamy) |
| Ślad trasy | linia GPX na mapie + profil wysokości pod nią | tylko gdy mamy GPX (poziom A) | to jest "wow" strony biegu; wchodzi automatycznie, gdy GPX się pojawi |
| Kontekst | pasmo/park narodowy, najbliższe miasto | z naszych danych | tekst obok mapy |

Technologia: **MapLibre GL + kafelki OpenFreeMap albo OpenStreetMap** (0 zł, bez kluczy, bez limitów dla naszej skali), warstwa terenu 3D opcjonalnie (ten sam silnik co przyszłe "Zrób film ze swojego biegu"). Alternatywa: Leaflet (prostszy, płaski). Rekomendacja: MapLibre od razu, żeby nie robić tego dwa razy.

Na liście biegów: mały statyczny podgląd mapy w karcie nie ma sensu (koszt, hałas). Zamiast tego w kalendarzu przełącznik "lista / mapa" z pinezkami wszystkich nadchodzących biegów i filtrem "blisko mnie" (geolokalizacja przeglądarki, bez zapisywania).

## 4. Strona biegu: układ dwukolumnowy (szkic)

Szeroka kolumna (ok. 2/3) = to, co decyduje "czy jadę"; wąska (1/3) = fakty i akcje. Na telefonie wąska kolumna wskakuje NAD treść jako kompaktowy pasek (data, miejsce, przyciski), reszta pod spodem.

```
+----------------------------------------------+-------------------------+
| [data] [pasmo]  NAZWA IMPREZY                | MAPA (pinezka / ślad)   |
| podtytuł: lista biegów imprezy               | miejscowość, pasmo      |
|                                              | "jak dojechać" (link)   |
| PLAKIETKA: dobry / ujdzie / zły na start     +-------------------------+
| jedno zdanie dlaczego                        | AKCJE                   |
|                                              | [Strona organizatora]   |
| DYSTANSE (tabela)                            | [Regulamin PDF]         |
|  km | D+ (źródło) | limit | ocena per dystans| [Zapisy] gdy znane      |
|                                              +-------------------------+
| PROFIL WYSOKOŚCI (gdy GPX)                   | NA SKRÓTY               |
|                                              | zapisy otwarte / liczba |
| ZANIM SIĘ ZAPISZESZ                          | liga (Kat.)             |
|  limit czasu, sprzęt obowiązkowy (lista),    | vertical / trail / górs |
|  punkty żywieniowe (gdy z regulaminu)        | źródła + daty sprawdz.  |
|                                              +-------------------------+
| PODOBNE BIEGI (3 karty: to samo pasmo,       | PODZIEL SIĘ / dodaj do  |
|  podobny dystans, +/- 6 tygodni)             | kalendarza (.ics)       |
+----------------------------------------------+-------------------------+
```

Zmiany treściowe przy okazji:
- **ocena per dystans**, nie tylko per impreza: przy każdym dystansie kropka koloru (10 km zielony, 150 km czerwony); plakietka imprezy = najlepszy dystans. Rozwiązuje przypadek "Łemkowyna zielona", który dziś dziwi przy 150 km na liście.
- **"Dodaj do kalendarza" (.ics)** i **"Podziel się"**: zero kosztu, duża użyteczność.
- **Podobne biegi**: proste, z naszych danych, trzyma ludzi na stronie.
- **Źródła z datą sprawdzenia** w wąskiej kolumnie zamiast drobnego druku na dole.

## 5. Kolejność wdrożenia (propozycja, do Twojej akceptacji)

| Krok | Co | Czas AI | Efekt |
|---|---|---|---|
| 1 | Poziom B: podstrona "Trasa" + wzorce D+ + dopasowanie po najbliższym km + etykieta źródła i świeżości | 1 wieczór | +15-20 biegów z D+, w tym 19 kandydatów ze skanu |
| 2 | Geokodowanie miejsc + pinezka na stronie biegu (MapLibre) + układ dwukolumnowy | 1 wieczór | mapa i nowy układ |
| 3 | Poziom A: GPX (parser, D+ liczone, ślad i profil na mapie) | 1 wieczór | "wow" tam, gdzie jest GPX; fundament pod "Zrób film" |
| 4 | Ocena per dystans, .ics, podobne biegi, widok mapy w kalendarzu | 1 wieczór | użyteczność |
| 5 | Poziom E: ITRA/UTMB Index (D+ certyfikowane, punkty) | później | jakość dla dużych biegów |

## 6. Decyzje dla Ciebie
1. Zgoda na drabinę źródeł i etykiety (sekcja 2), w tym zasadę "nieznane zostaje nieznane".
2. MapLibre (3D, ten sam silnik co przyszły film) czy Leaflet (prościej, płasko). Rekomendacja: MapLibre.
3. Układ dwukolumnowy jak w szkicu, czy chcesz przestawić coś między kolumnami zanim zacznę.
4. Kolejność kroków 1-5 albo inna (np. mapa przed przewyższeniami).
