# Audyt SEO plaskiejestnudne.pl, 10.10.2026

Zakres: stan w Google po 10 dniach na własnej domenie (Search Console, widok site:), audyt techniczny stron, Lighthouse, research fraz i konkurencji (osobny plik: `seo_research_2026-10.md`). Rekomendacje z priorytetem na końcu.

## 1. Jak jesteśmy pozycjonowani dziś (Search Console, 29.09-06.10.2026)

| Metryka | Wartość |
|---|---|
| Kliknięcia | 10 |
| Wyświetlenia | 483 |
| CTR | 2,1% |
| Średnia pozycja | 7,8 |
| Zindeksowane strony | 167 z 253 w mapie witryny |
| Wykryte, jeszcze niezindeksowane | 74 (Google zna adres, nie zeskanował; typowe dla nowej domeny) |
| Zeskanowane, niezindeksowane | 8 |

Zapytania, które już dają wyświetlenia (wszystkie to NAZWY BIEGÓW, zero fraz ogólnych):

| Zapytanie | Wyświetlenia | Kliknięcia |
|---|---|---|
| zimowy maraton świętokrzyski 2027 | 86 | 0 |
| bieg mai 2026 | 10 | 0 |
| magurka trail zapisy | 10 | 0 |
| ii korczyński półmaraton górski | 10 | 0 |
| smok bieg, "d+", borówkowa trail, bieg na morskie oko, ultramaraton annogórski 2027 | 1-2 | 0 |

Strony z ruchem: wyłącznie `/bieg/<slug>` (Magurka Trail 120 wyświetleń i 2 kliknięcia, Zimowy Maraton Świętokrzyski 90 wyświetleń i 0 kliknięć, Korczyński Półmaraton 42). Strona główna, kalendarz i narzędzia: zero wyświetleń z fraz ogólnych.

**Wniosek:** Google indeksuje nas jako "strony konkretnych biegów" i to działa samo z siebie (long tail: nazwa biegu + rok / zapisy). Frazy ogólne ("kalendarz biegów górskich", "pierwszy bieg górski") nie pojawiły się ani razu; tam konkurencja ma lata przewagi i trzeba wejść osobnymi stronami i treścią. Niski CTR przy pozycji ok. 8 na frazach z nazwą biegu = tytuł i opis nie obiecują tego, czego szuka pytający (termin, zapisy, dystanse, limit).

## 2. Audyt techniczny (stan 10.10.2026)

Co jest dobrze:
- HTML statyczny, lang="pl", poprawne tytuły z szablonem "| Płaskie jest nudne", meta description na każdej stronie, OG image dla każdej strony, robots.txt z mapą witryny, sitemap z 253 adresami, przekierowania www i vercel.app na domenę główną, JSON-LD SportsEvent na stronach biegów, atrybut rel="noopener" bez noreferrer (referrer dochodzi do organizatorów), UTM na linkach wychodzących.

Braki i błędy (konkret, plik, poprawka):

| # | Problem | Skutek | Poprawka |
|---|---|---|---|
| T1 | Brak `rel=canonical` na wszystkich stronach; `/biegi?start=1`, `?dist=u`, `?open=1`, `?view=mapa` zwracają identyczną treść bez canonical | duplikaty kalendarza w indeksie, rozmyta siła strony | `alternates.canonical` w metadata layoutu (per strona), filtry zostają w URL, ale canonical wskazuje `/biegi` |
| T2 | H1 strony głównej = "Płaskie jest nudne ;)" | H1 bez słowa kluczowego; Google czyta "Płaskiejestnudne" (brak spacji między liniami) | zostaw wizualny tytuł, dodaj słowo kluczowe w podtytule H2 "Kalendarz biegów górskich i trailowych w Polsce" nad leadem albo aria-label na H1 |
| T3 | Tytuł strony biegu "Nazwa, 13 marca 2027" i opis "Nazwa w Węgierska Górka (region): dystanse..." | CTR 0-2% przy pozycji 8; "w Strzyżów", "w Szklarska Poręba" to błąd gramatyczny widoczny w SERP | tytuł: "Nazwa 2027: termin, dystanse, zapisy | Płaskie jest nudne"; opis: "Nazwa, 13.03.2027, Węgierska Górka. Dystanse 10/25/60/100 km, D+, limit czasu, status zapisów, regulamin i sprzęt obowiązkowy." (bez odmiany miasta) |
| T4 | JSON-LD SportsEvent bez `description`, `image`, `organizer`, `offers` (URL zapisów, dostępność), `eventStatus`, `eventAttendanceMode` | Google nie pokaże wyniku rozszerzonego Event (data + miejsce w SERP) | uzupełnić z danych, które już mamy (signup.url, status, OG image) |
| T5 | Mapa witryny bez `lastmod`; wszystkie biegi `weekly`, także odbyte | Google nie wie, co się zmieniło; 74 strony "wykryte, niezindeksowane" to w dużej części odbyte biegi i duplikaty | lastmod = data odświeżenia danych dla biegów nadchodzących, data biegu dla odbytych; priorytet odbytych 0.3 |
| T6 | Odbyte biegi (190 stron) bez oznaczenia "zakończony" ani linku do kolejnej edycji | thin content dla Google, dla człowieka ślepa uliczka | na stronie odbytego biegu: baner "edycja 2026 odbyła się; kolejna edycja: [link]" albo "termin 2027 nieznany, sprawdzamy co 14 dni", schema `eventStatus`; w tytule rok edycji |
| T7 | `/biegi` to 276 KB HTML (cała baza w HTML + JSON), `/kreator` i `/czy-dam-rade` po ok. 270 KB | wolniejsze LCP na telefonie, większy koszt crawlu | ładować bazę biegów z osobnego pliku JSON (fetch po stronie klienta) albo ograniczyć pola serializowane do listy |
| T8 | Opis meta `/o-serwisie` i `/prywatnosc` skopiowany ze strony głównej | duplikat opisów w SERP (widać w site:) | własne jednozdaniowe opisy |
| T9 | Tytuły skrótowców: "PUT, 25 lipca 2026", "WRC, 27-28 marca 2026", "BIEGI W ROGOŹNIKU" | nic nie mówią w SERP | eventName z pełnym rozwinięciem, gdy `name` dłuższa niż skrót; wielkie litery normalizować do tytułowych |
| T10 | Brak stron pośrednich (hubów): region/pasmo, miesiąc, dystans, "dobre na start" istnieją tylko jako filtry `?start=1` | nie da się rankować na "biegi górskie Beskidy", "biegi trailowe listopad 2026", "biegi górskie dla początkujących" | statyczne strony `/biegi/<pasmo>`, `/biegi/<rok>/<miesiąc>`, `/biegi/dla-poczatkujacych`, `/biegi/do-15-km`, każda z własnym tytułem, leadem 2-3 zdania i listą |
| T11 | Brak `BreadcrumbList` i `WebSite` (SearchAction) w JSON-LD, brak `Organization` | brak okruszków w SERP | dodać w layout i na stronie biegu |
| T12 | Słownik: 11 haseł na jednej stronie, bez FAQPage/DefinedTerm | nie łapie "co to D+", "cutoff bieg" osobno | schema `DefinedTermSet` + ewentualnie osobne krótkie strony dla 3-4 najczęściej szukanych pojęć |

## 3. Lighthouse (mobile, symulowane 4G, pomiar lokalny 10.10.2026)

| Strona | Performance | SEO | Dostępność | FCP | LCP | CLS | Waga |
|---|---|---|---|---|---|---|---|
| `/` | 74 | 100 | 93 | 3,0 s | 5,0 s | 0 | 599 KB |
| `/bieg/magurka-trail-2026-10-03` | 97 | 100 | 100 | 0,9 s | 2,5 s | 0 | 550 KB |
| `/biegi` | 91 | 100 | 83 | 1,1 s | 2,7 s | 0,14 | 591 KB |

Co ciąży (wspólne dla wszystkich stron): skrypt Google Analytics 181 KB (największy zasób strony), dwa pliki fontów 86 KB (Bebas Neue) + 49 KB (Inter), ok. 100 KB nieużywanego JavaScriptu, prefetch RSC dla `/biegi` i `/kreator` po 40 KB odpalany od razu na stronie głównej. Serwer odpowiada w 30 ms, więc całe opóźnienie to front.

Strona główna LCP 5,0 s: tytuł w Bebas Neue czeka na font, a do tego sześć kart-plakatów z SVG pasm renderuje się razem z fontami. Poprawki: `preload` fontu display (next/font to robi, ale Bebas jest ładowany w pełnym zestawie znaków: ograniczyć `subsets` do latin + latin-ext zamiast pełnego pliku), GA ładować po `load` zamiast `afterInteractive` albo przez Partytown/`lazyOnload`, wyłączyć prefetch na przyciskach CTA (`prefetch={false}`), karty poza pierwszym ekranem z `content-visibility: auto`.

Dostępność (wpływa pośrednio na SEO i na realnych użytkowników): kontrast plakietki "dobry na start" (zielony tekst na jasnozielonym) i szarej plakietki "zapisy: nie wiemy" poniżej 4,5:1; kolejność nagłówków na stronie głównej (H3 kart bez H2 sekcji "Najbliżej"); pola dat Od/Do w kalendarzu bez etykiety `label for`; CLS 0,14 na `/biegi` od stopki doskakującej po dociągnięciu listy (zarezerwować min-height listy).


## 4. Dwa ustalenia z researchu, które zmieniają kolejność prac

- **Strony biegów są sierotami.** `/biegi` renderuje listę dopiero w przeglądarce (komponent kliencki z `useSearchParams` w Suspense), więc w HTML, który czyta Google, jest **0 linków do `/bieg/`**. Strona główna linkuje 9 biegów, reszta (ok. 240) ma tylko wpis w mapie witryny. To najprostsze wyjaśnienie 74 stron "wykryte, niezindeksowane" i niskiej pozycji stron, które weszły. Potwierdzone 10.10 (`curl` HTML `/biegi`: 0 wystąpień `href="/bieg/`).
- **Schema oddaje kanoniczność wydarzenia konkurencji.** W JSON-LD SportsEvent pole `url` to adres źródła (strona organizatora albo kalendarzbiegowy.pl), nie nasza strona. Google uczy się, że "oficjalna" strona wydarzenia jest gdzie indziej.

## 5. Plan działań (priorytet = wpływ / koszt)

| # | Działanie | Dlaczego (dowód) | Koszt | Priorytet |
|---|---|---|---|---|
| 1 | Lista biegów na `/biegi` renderowana serwerowo (HTML z linkami do wszystkich nadchodzących biegów, filtry dalej po stronie klienta) | 240 sierot, 74 niezindeksowane | 1-2 h | 🔴 teraz |
| 2 | Tytuł i opis strony biegu: "Nazwa 2027: termin, dystanse, zapisy, limit czasu"; opis bez odmiany miasta, z D+, statusem zapisów, regulaminem | CTR 0% przy 86 wyświetleniach na pozycji 8; wzorzec motivato.pl i zawodybiegowe.pl | 1 h | 🔴 teraz |
| 3 | JSON-LD: `url` = nasza strona, organizator jako `organizer.url`, `offers` (link do zapisów, dostępność z naszego statusu), `eventStatus`, `image`, `description`; `BreadcrumbList`; `WebSite` na głównej | wynik rozszerzony Event w SERP, kanoniczność u nas | 1-2 h | 🔴 teraz |
| 4 | Canonical na każdej stronie (`/biegi` dla wariantów z filtrami), własne opisy `/o-serwisie` i `/prywatnosc` | duplikaty w indeksie | 30 min | 🔴 teraz |
| 5 | Mapa witryny z `lastmod` i niższym priorytetem odbytych biegów; na stronie odbytego biegu baner "edycja odbyła się, kolejna: ..." + `eventStatus` | thin content 190 stron, crawl budget | 1 h | 🟠 ten tydzień |
| 6 | Huby generowane z bazy: `/biegi/pasmo/<slug>` (Beskidy, Sudety, Tatry, Bieszczady...), `/biegi/<rok>/<miesiac>`, `/biegi/dla-poczatkujacych`, `/biegi/do-15-km`, `/biegi/zapisy-otwarte`; każdy z tytułem z rokiem, leadem 2-3 zdania, listą i linkami do sąsiednich hubów | frazy ogólne nie dają nam dziś ani jednego wyświetlenia; konkurencja ma huby, nikt nie ma "dla początkujących" i "miesiąc" | 3-4 h | 🟠 ten tydzień |
| 7 | Sekcja "Podobne i pobliskie biegi" na stronie biegu rozszerzona (ten sam region, ten miesiąc, podobny dystans), linki do hubów | linkowanie wewnętrzne, wzorzec motivato | 1 h | 🟠 |
| 8 | Słownik: osobne krótkie strony dla D+, limit czasu (cutoff), sprzęt obowiązkowy, ITRA/UTMB Index, vertical; `DefinedTerm` + FAQPage; słownik zostaje jako indeks | fraza "d+" już daje wyświetlenia; niska konkurencja | 2 h | 🟡 2 tygodnie |
| 9 | FAQ generowane z danych na stronie biegu ("Jaki jest limit czasu?", "Czy są otwarte zapisy?", "Ile wynosi przewyższenie?") + FAQPage | People Also Ask; zawodybiegowe.pl robi szablonowo | 1 h | 🟡 |
| 10 | Wydajność: GA `lazyOnload`, Bebas tylko latin + latin-ext, `prefetch={false}` na CTA, min-height listy (CLS 0,14), kontrast plakietek | LCP 5,0 s na głównej | 1 h | 🟡 |
| 11 | Strona "Dla organizatorów": co pokazujemy, jak zgłosić bieg, odznaka "dobry na start" do wstawienia na stronę biegu (link zwrotny) | pierwsze linki od 20-30 organizatorów, do których już wysyłamy ruch z UTM | 2 h + maile (Piotr) | 🟡 |
| 12 | Poradniki pod realny popyt: "pierwszy bieg górski: jak wybrać" (z linkiem do kreatora), "sprzęt obowiązkowy: lista i po co", "jak czytać regulamin" | frazy początkujących rankują blogi i sklepy, nikt nie łączy z kalendarzem | 3 h | 🟢 miesiąc |
| 13 | Linki: forum bieganie.pl "Górskie i ultra", blogi trailowe, lokalne portale przy większych biegach, grupy FB (Piotr, po ludzku, nie spam) | brak jakichkolwiek linków przychodzących | czas Piotra | 🟢 |
| 14 | Przekierowania 301 ze starych edycji na nowe, gdy obie są w bazie (po potwierdzeniu, że edycja 2025/2026 łapie zapytania "2027") | sygnał z GSC po 4 tyg | 30 min | 🟢 warunkowo |
| 15 | Kontrola GSC ok. 7.11: indeksacja >220/253, CTR zapytań z rokiem >3%, pierwsze wyświetlenia hubów, raport Ulepszenia > Wydarzenia bez błędów | mierzymy skutek 1-9 | 20 min | 🟢 |

Pozycje 1-5 to zmiany wyłącznie w szablonach (bez nowych treści) i można je zrobić w jednym podejściu. Pozycje 6-9 to nowe strony generowane z danych, które już mamy. Pozycje 11-13 wymagają Piotra (maile, posty).

## 6. Status wdrożenia (10.10.2026)

Zrobione i wypchnięte tego samego dnia: pozycje 1-6 (lista serwerowa: 56 linków w HTML kalendarza; tytuły "Nazwa ROK: termin, dystanse, zapisy, limit czasu"; opisy z dystansami, D+, limitem i statusem zapisów; JSON-LD SportsEvent z naszym URL, organizatorem, ofertą i podwydarzeniami + BreadcrumbList + WebSite/Organization; canonical na każdej stronie; mapa witryny z lastmod i 288 adresami; baner odbytej edycji z linkiem do kolejnej; 35 hubów: 19 pasm/regionów, 11 miesięcy, 5 zestawień, linkowane z kalendarza, głównej i stron biegów). Przy okazji: nazwy pisane wielkimi literami znormalizowane, skróty rozwinięte ("Waligóra Run Cross (WRC)"), etykiety pól dat, min-height listy (CLS).
Zostały: 7 (szersze "podobne biegi"), 8 (strony pojęć ze słownika), 9 (FAQ na stronie biegu), 10 (wydajność), 11 (strona dla organizatorów + odznaka), 12-13 (poradniki, linki: Piotr), 14-15 (po odczycie GSC ok. 7.11).
Druga partia (10.10 wieczorem): 7 (podobne biegi: region, termin do 45 dni, dystans, teren, ocena; do 6 z powodem), 8 (11 stron pojęć `/slownik/<slug>` z DefinedTerm, FAQPage, listą powiązanych biegów z danych; indeks słownika linkuje podstrony), 9 (FAQ z danych na każdej stronie biegu + FAQPage), 10 (GA ładowane leniwie, prefetch zdjęty z CTA, content-visibility na sekcjach pod foldem, kontrast plakietek, nagłówek sekcji "Najbliższe biegi", etykiety pól dat). Lighthouse strony głównej: performance 74 → 96, LCP 5,0 s → 2,7 s.
