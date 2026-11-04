# Usprawnienia plaskiejestnudne.pl: research 04.11.2026

Zakres: trzy osie (A technika i wydajność, B użyteczność dla biegacza, C pozycjonowanie i dystrybucja) plus krótko D monetyzacja. Metoda: odczyt repo i produkcji (curl: rozmiary HTML, nagłówki cache, JSON-LD, endpointy), odczyt stron wzorcowych (finishers.com, RaceRaves, ITRA, Rate My Trail, RaceNotify, Strava Race Discovery, trainerday), dokumentacja Google (Discover, Event, robots meta), Next.js (manifest), Vercel (Web Analytics), Open-Meteo (warunki). Tylko odczyt, bez zmian w kodzie. PageSpeed Insights API odmówił (limit dzienny), więc wydajność opieram na własnych pomiarach i Lighthouse z 10.10. ahotu.com, raceraves.com (strona wskazówek) i trainerday.com zwracają 403 dla automatu: o nich tylko z wyników wyszukiwania (oznaczone).

## 0. Co już jest (nie proponuję drugi raz)

Z audytu 10.10 wdrożone pozycje 1-10: lista serwerowa na `/biegi` (58 linków w HTML), tytuły i opisy pod CTR, JSON-LD SportsEvent z naszym URL, ofertą, organizatorem i podwydarzeniami (5 SportsEvent na stronie biegu), BreadcrumbList, WebSite, FAQPage z danych, canonical, mapa witryny z lastmod, baner odbytej edycji, 35+13 hubów (pasma, województwa, miesiące, zestawienia), 11 stron pojęć słownika, podobne biegi z powodem, GA lazyOnload, prefetch zdjęty, kontrast. Dodatkowo od 10.10: dziennik `/zmiany`, sprzęt z regulaminów (LLM), kolejne edycje ze stron organizatorów, ics per bieg, Web Share, geolokalizacja "blisko mnie", mapa MapLibre, profile wysokościowe z GPX, sekcja Polecamy. Otwarte z planu 10.10: 11 (strona dla organizatorów i odznaka), 12 (poradniki), 13 (linki), 14-15 (odczyt GSC ok. 7.11).

## 0b. Stan dziś, liczby, które ustawiają priorytety

| Co | Pomiar 04.11.2026 | Wniosek |
|---|---|---|
| Biegi w bazie / nadchodzące | 261 / 58 | mała baza, więc każda luka danych widać |
| Nadchodzące z D+ / limitem czasu / statusem zapisów / regulaminem / sprzętem / GPX | 25 / 8 / 32 / 38 / 27 / 8 z 58 | sekcja "Przed zapisaniem" jest pusta dla połowy biegów; dane są większą dźwignią niż nowe funkcje |
| Brak pól w modelu | cena (opłata startowa), godzina startu, kije, pies, bieg dla dzieci, biuro zawodów, bufety | to są pytania początkującego i filtry, których nie da się zrobić bez danych |
| HTML `/biegi` / `/kreator` / `/czy-dam-rade` / strona biegu | 420 KB / 302 KB / 318 KB / 153 KB | cała baza (261 pełnych obiektów Race) jest serializowana dwa razy (HTML + payload RSC); po SSR listy `/biegi` urosło z 276 KB (10.10) do 420 KB |
| Cache | `x-vercel-cache: HIT`, age 37 h, strony statyczne, build przy każdym commicie danych (pn, czw, wt sprzęt) | model "pełny statyczny" działa; ISR nic tu nie da |
| Endpointy | brak `manifest`, `feed`/`rss`, `kalendarz.ics` (zbiorczego), `/api/races`, `llms.txt`; jest `/ics/<slug>` | brak jakiegokolwiek kanału subskrypcji i brak danych do pobrania |
| Meta | brak `robots max-image-preview`, brak `theme-color`, brak trybu ciemnego (`prefers-color-scheme` nie występuje w CSS) | tanie braki higieny |
| Analityka | GA4 (181 KB skryptu wg audytu 10.10) + baner zgody na każdym pierwszym wejściu | baner zjada pierwszy ekran na telefonie; dane i tak są szczątkowe (10 kliknięć z Google w tygodniu wg GSC 10.10) |
| Rich results Event w Google | dostępne tylko w AU, BR, CA, DE, IN, LatAm, ES, UK, US (dokumentacja Google) | Polski nie ma na liście: nie inwestować dalej w Event poza tym, co jest |

## 1. Dziesięć najwyżej ocenionych usprawnień

Koszt = godziny pracy agenta/Piotra przy obecnym kodzie. Priorytet: 1 = najpierw.

| # | Usprawnienie | Co daje użytkownikowi / SEO | Koszt | Prio | Dowód, kto tak robi |
|---|---|---|---|---|---|
| 1 | **Szerszy wyciąg z regulaminów tym samym pipeline'em co sprzęt:** limit czasu per dystans, opłata startowa i terminy progów cenowych, godzina startu, biuro zawodów, bufety, kije (dozwolone/zakazane), pies, bieg dla dzieci; nowe pola w `Race`, w FAQ, w opisie meta i w filtrach | zamyka największą lukę: dziś limit ma 8 z 58 biegów, a to główne pytanie "czy dam radę"; daje cenę do `offers.price` (Google tego oczekuje), odpowiada na PAA "ile kosztuje", "o której start"; otwiera filtry "z kijami", "z psem", "z biegiem dla dzieci" | 3-4 h (prompt + schema + UI) | 1 | ITRA pokazuje time limit, aid stations, participants na każdej karcie; zawodybiegowe.pl ma cenę i pakiet w opisie; Strava Race Discovery filtruje po profilu i temperaturze, czyli po danych, nie po nazwach |
| 2 | **Newsletter "nowe biegi w tym tygodniu" generowany z `data/zmiany.json`** (już mamy dziennik), wysyłany w poniedziałek po odświeżeniu przez Brevo; zapis na stronie głównej, w stopce i pod listą na hubach ("powiadom mnie o nowych biegach w Beskidach") | jedyny własny kanał powrotu; początkujący planuje sezon tygodniami, a my dziś nie mamy jak go zawołać; segment per pasmo to później alert o zapisach | 2-3 h setup (szablon z JSON, lista Brevo, formularz) + automat | 1 | RaceNotify: cały produkt zbudowany na "Monday digest" i alertach otwarcia zapisów (darmowe 3 alerty, PRO 4,99 EUR/rok), czyli jest popyt; UltraSignup: "thousands of trail races open registration between November and late February, many sell out early" |
| 3 | **Subskrypcyjny feed iCal** (`/kalendarz.ics` cały, `/biegi/pasmo/beskidy.ics` per hub, `/biegi/dla-poczatkujacych.ics`) + w ics per bieg `VALARM` "zapisy do ..." i "tydzień przed startem" | biegacz ma biegi regionu w Google/Apple Calendar na stałe, bez konta i bez bazy po naszej stronie; przypomnienie o zapisach wprost w kalendarzu telefonu | 1-2 h (mamy już generator ics) | 1 | Ahotu x Garmin Connect: "add it to your calendar" jako główna akcja; calendarlink/RunSignup budują na tym integracje |
| 4 | **"Moje biegi" w localStorage:** serce na karcie i stronie biegu, strona `/moje` z listą, eksport wszystkich do .ics, porównanie 2-3 biegów w tabeli (termin, dystans, D+, limit, cena, sprzęt, ocena), link do udostępnienia listy (parametr w URL) | zamienia jednorazową wizytę w narzędzie do planowania sezonu; porównywarka to pytanie debiutanta "Baran czy Turbacz?"; bez konta, bez RODO | 4-6 h | 2 | RaceRaves "My Staging Area" (śledzenie przyszłych startów), finishers.com (ulubione w koncie), Strava Events (lista "joined") |
| 5 | **Odchudzenie payloadu:** osobne DTO karty (id, nazwa, daty, miasto, region, dystanse, min D+, min limit, ocena, status zapisów, spark, lat/lng) dla `/biegi`, hubów i kreatora; pełne obiekty tylko na stronie biegu; kalkulator dociąga `/data/races.lite.json` z nagłówkiem immutable | `/biegi` z 420 KB do ok. 120-150 KB, `/kreator` i `/czy-dam-rade` o 60-70% mniej; LCP i TBT na telefonie, mniejszy koszt crawlu 50 hubów | 2-3 h | 2 | pomiar własny 04.11 (420/302/318 KB); audyt 10.10 wskazał to jako T7 i nie zostało zrobione |
| 6 | **Strona `/dla-organizatorow` + odznaka "dobry na start" (SVG z linkiem) + embed-widget** `/embed?pasmo=beskidy&limit=5` (strona bez nawigacji do `<iframe>`, stopka "kalendarz: plaskiejestnudne.pl" z linkiem) + gotowy snippet | pierwsze linki zwrotne od małych organizatorów i blogów regionalnych; widget daje link z każdej strony, która go wstawi; w mailu do organizatora: "wysłaliśmy Wam X kliknięć (UTM), tu odznaka" | 3-4 h + maile (Piotr, 20-30 organizatorów) | 2 | Race Roster "timer calendars" osadzane iframe z brandingiem; motivato.pl `/dla-organizatorow/`; w GSC mamy zero linków przychodzących (10.10) |
| 7 | **Nowe strony programatyczne z realną listą:** `/biegi/2027` (rok, główna fraza konkurencji "biegi górskie 2027"), `/biegi/blisko/krakowa` (Wrocław, Katowice, Bielsko-Biała, Warszawa, Gdańsk, Rzeszów; promień 100 km z geo.json), `/biegi/ten-weekend` (przebudowa 2x/tydz wystarcza), po wdrożeniu #1: `/biegi/z-kijami`, `/biegi/z-psem`, `/biegi/z-biegiem-dla-dzieci`, `/biegi/zimowe`; strona powstaje tylko gdy ma co najmniej 3 biegi | frazy "biegi górskie blisko Krakowa" i "biegi w weekend" nie mają dziś dedykowanych stron u nikogo z realną listą; treningbiegacza ma puste strony miasto x typ | 2-3 h (mechanizm hubów już jest) | 2 | research 10.10 sekcja 2.1 (treningbiegacza "(0)"), finishers "spots" per pasmo rankują z tłumaczenia maszynowego |
| 8 | **Pogoda na stronie biegu:** prognoza Open-Meteo dla biegów w ciągu 16 dni + "typowa pogoda w tym terminie" (średnie min/max i opady z 10 lat dla okna +-7 dni) dla wszystkich, liczone w skrypcie odświeżania w GitHub Actions (58 zapytań, limity 10 000/dzień), nie w runtime | początkujący pyta "w co się ubrać, czy będzie błoto, czy trzeba czołówkę": odpowiedź łączy się ze sprzętem obowiązkowym; wyróżnik, którego nie ma żaden polski kalendarz | 2-3 h | 3 | Strava Race Discovery filtruje po "average event temperature"; UTMB podaje zakres temperatur trasy; Open-Meteo bezpłatne niekomercyjnie, CC BY 4.0, bez klucza (warunek: bez reklam, patrz D) |
| 9 | **Dane do pobrania i feedy:** `/api/races.json` (+ CSV) z licencją CC BY i polem `generatedAt`, schema `Dataset` na `/o-serwisie`, RSS/Atom i JSON Feed dla `/zmiany`, Bing Webmaster Tools + IndexNow po buildzie | cytowalność przez AI i blogi (dane z jasną licencją i datą), ruch z Bing/Copilot/ChatGPT search, które indeksują przez Bing; zero utrzymania | 2 h | 3 | DUV RSS jest jedynym feedem w branży i każdy go używa (PLAN.md); Google Dataset Search czyta `Dataset`; badania cytowań AI wskazują świeżość i datę jako sygnał (źródła wtórne, w sekcji 4) |
| 10 | **Pakiet higieny:** Vercel Web Analytics zamiast GA4 (bez cookies, bez banera, 50 000 zdarzeń/mies. na Hobby), `robots: max-image-preview:large`, `app/manifest.ts` + `theme-color` (ekran startowy telefonu), tryb ciemny na tokenach CSS, `prefers-reduced-motion` dla tickera, skip-link | pierwszy ekran bez banera i o 181 KB lżejszy, dostępność, Discover (warunek 1200 px już spełnia OG 1200x630) | 2-3 h łącznie | 3 | dokumentacja Vercel (bez cookies, dane zagregowane), Google Discover (1200 px, `max-image-preview:large`, og:image), Next.js manifest |

Razem 10 pozycji: ok. 25-33 h. Realny tydzień Piotra na side project to kilka godzin, więc kolejność: #1 i #3 (dane + ics) w pierwszym podejściu, #2 i #4 w drugim, #5-#7 w trzecim, reszta jak starczy.

## 2. Pełna lista pomysłów

### A. Technika i wydajność

| Pomysł | Jedno zdanie uzasadnienia | Źródło |
|---|---|---|
| DTO karty zamiast pełnego `Race` w listach (#5) | 420 KB HTML na `/biegi` to dziś największy koszt wydajności; serwer odpowiada w 30 ms, cały czas idzie na front | pomiar curl 04.11; audyt 10.10 T7 |
| `/data/races.lite.json` z `Cache-Control: immutable` i hashem w nazwie | kalkulator i kreator nie muszą mieć bazy w HTML; przeglądarka trzyma JSON do następnego buildu | praktyka Next.js (statyczne assety `/_next/static/immutable`) |
| Zostać przy pełnym statycznym renderze, bez ISR i bez `cacheComponents` | 300 stron buduje się w minuty, dane zmieniają się 2-3x w tygodniu commitem; ISR dodaje złożoność i koszt bez zysku; `cacheComponents` wymaga niepustego `generateStaticParams` i ma otwarte zgłoszenia z `partialPrefetching` | dokumentacja Next.js (empty generateStaticParams), dyskusja vercel/next.js #98177 |
| `dynamicParams = false` na `/bieg/[slug]` i `/ics/[slug]` | nieznany slug ma zwracać 404 natychmiast, a nie próbować renderu | dokumentacja Next.js |
| Subskrypcyjne feedy iCal cały i per hub, VALARM (#3) | retencja bez konta; mamy generator ics | Ahotu x Garmin Connect |
| RSS/Atom + JSON Feed dla `/zmiany` (#9) | dziennik zmian już istnieje, brakuje tylko formatu do czytnika | własny `/zmiany` |
| `/api/races.json` i CSV z licencją, schema `Dataset` (#9) | dane z licencją i datą to jedyny realny sposób na bycie cytowanym przez agregatory i AI | Google Dataset Search; brak API u konkurencji (PLAN.md) |
| `app/manifest.ts`, ikony 192/512 już są, `theme-color`, `display: standalone` | "dodaj do ekranu" na telefonie; 30 minut | Next.js manifest |
| Service worker offline tylko dla ostatnio oglądanych stron biegów (opcjonalnie, po manifest) | w górach bywa brak zasięgu, a biegacz chce sprawdzić limit i sprzęt; ale koszt utrzymania SW jest realny, więc dopiero po pomiarze ruchu z telefonu | ogólna praktyka PWA; brak dowodu z konkurencji |
| Vercel Web Analytics zamiast GA4 (#10) | bez cookies i banera, 50 000 zdarzeń/mies. w Hobby wystarcza na długo; referrer i parametry zapytania zostają | dokumentacja Vercel (privacy, limits) |
| `robots: { "max-image-preview": "large" }` w metadata | Google: bez tej reguły "może pokazać podgląd domyślnej wielkości"; Discover wymaga large | dokumentacja Google (robots meta, Discover) |
| Tryb ciemny na istniejących tokenach CSS (`--bg`, `--line`, `--muted`) | kolory są już zmiennymi, więc to głównie druga paleta pod `prefers-color-scheme: dark`; mapa MapLibre dostaje ciemny styl | kod `globals.css` |
| Dostępność: skip-link, `aria-live` z liczbą wyników po zmianie filtra, `focus-visible`, `prefers-reduced-motion` dla tickera | Lighthouse a11y `/biegi` 83 (10.10), filtrowanie bez komunikatu dla czytnika ekranu | audyt 10.10 sekcja 3 |
| OG image per hub i per strona pojęcia (dziś tylko główna i bieg) | udostępnienie "Biegi w Beskidach" w grupie FB bez grafiki wygląda jak spam | kod `app/opengraph-image.tsx` |
| Obraz 1080x1920 "do relacji" generowany tym samym `next/og` | jedno kliknięcie "udostępnij na Instagramie" z gotową grafiką biegu | sekcja C (Instagram) |
| Sitemap index | niepotrzebny poniżej 50 000 adresów; kosmetyka | limit Google 50 000 URL / 50 MB |
| Schema `SportsEvent` z `offers.price` i `priceCurrency` po wdrożeniu #1 | Google oczekuje ceny w ofercie; dziś mamy tylko dostępność | dokumentacja Google Event |
| IndexNow po buildzie (Bing, Yandex, DuckDuckGo) | 30 minut, przyspiesza indeksację poza Google; Bing karmi ChatGPT search i Copilot | IndexNow (Bing) |

### B. Użyteczność dla biegacza

| Pomysł | Jedno zdanie uzasadnienia | Źródło |
|---|---|---|
| Szerszy wyciąg z regulaminów: limit per dystans, cena i progi, godzina startu, biuro, bufety, kije, pies, dzieci (#1) | limit ma 8 z 58 nadchodzących biegów; bez tego "czy dam radę" porównuje z brakiem danych | stats z `races.json` 04.11; ITRA (time limit, aid stations) |
| "Moje biegi" w localStorage + porównanie + eksport ics + link do listy (#4) | planowanie sezonu bez konta; porównywarka to realne pytanie debiutanta | RaceRaves, finishers, Strava Events |
| Alert "powiadom mnie, gdy ruszą zapisy" (formularz Brevo per bieg; automat czyta zmianę statusu w `zmiany.json` i wysyła) | RaceNotify sprzedaje dokładnie to za 4,99 EUR/rok; u nas za darmo jako przedłużenie newslettera | racenotify.com |
| Newsletter tygodniowy z `zmiany.json` (#2) | jedyny kanał powrotu; treść generuje się sama | własny `/zmiany`; RaceNotify "Monday digest" |
| Pogoda: prognoza 16 dni + klimat terminu (#8) | "w co się ubrać" to pytanie początkującego numer dwa po limicie | Strava Race Discovery (temperatura), UTMB |
| Filtr "do X km od miasta" z wyborem miasta (zamiast tylko geolokalizacji) | geolokalizacja wymaga zgody i nie działa przy planowaniu z biura; lista 8 miast + promień 50/100/200 km | `RaceList.tsx` (haversine już jest) |
| Filtry po danych z #1: kije, pies, bieg dla dzieci, start po 9:00, opłata do 100 zł | to są kryteria wyboru rodzin i dojeżdżających; bez danych nie istnieją | brak u konkurencji w PL |
| Oś edycji na stronie biegu (2024, 2025, 2026, 2027) + "wyniki poprzedniej edycji" jako link zewnętrzny (organizator, ITRA, Rate My Trail), bez kopiowania wyników | kontekst "czy to bieg z tradycją" bez ryzyka RODO | ITRA "See another edition"; Rate My Trail (edycje 2014-2027) |
| Liczba uczestników poprzedniej edycji (z b4sport/elektronicznezapisy, mamy 8) | "mały kameralny bieg" kontra "2000 osób na starcie" to informacja dla debiutanta | ITRA pokazuje participants; `elektronicznezapisy` podaje liczbę zawodników (PLAN.md) |
| Kalkulator: pokazać metodę (Riegel, km-effort, mnożniki terenu i doświadczenia są w `predict.ts`, ale nie w UI) + link z wynikiem (`?bieg=&czas=&exp=`) + przycisk "zapisz ten bieg" | wiarygodność liczby rośnie, gdy widać, skąd jest; link do wyniku to udostępnianie w grupie "czy dam radę?" | `lib/predict.ts`; research 10.10 1.4 (brak takiego narzędzia w PL) |
| Kreator: wynik jako URL z odpowiedziami, "zapisz te 3 biegi", wysyłka wyniku mailem (zapis do newslettera) | dziś wynik znika po odświeżeniu | `components/Kreator.tsx` |
| Profil wysokościowy: formularz "podeślij GPX" (mail z załącznikiem) + prośba o GPX w mailu z odznaką do organizatora | GPX ma 8 z 58 nadchodzących; organizatorzy mają ślady, trzeba poprosić | stats 04.11 |
| "Dlaczego ta ocena" rozwijane przy plakietce na karcie (pole `beginnerWhy` już jest) | przejrzystość oceny buduje zaufanie, RaceRaves rozbija ocenę na wymiary | RaceRaves (difficulty, scenery, production, swag) |
| Mapa na hubach pasm (komponent `RacesMap` istnieje) | hub regionu bez mapy to lista; mapa pokazuje "co jest po drodze" | `/biegi/pasmo/beskidy` bez mapy (odczyt 04.11) |
| "Skopiuj jako tekst" obok "Podziel się" (nazwa, data, dystanse, limit, link) | w grupach FB i na WhatsApp wkleja się tekst, nie link | praktyka |
| Dojazd: obok Google Maps link do rozkładu PKP/Jakdojade z miejscowością startu | połowa debiutantów nie ma auta; tani link | brak u konkurencji |
| Dodaj bieg przez formularz (Tally/Google Form) zamiast mailto | mailto na telefonie często nie działa; formularz z polami daje czystsze dane | kalendarzbiegowy "dodaj bieg", motivato |
| Opinie użytkowników: nie teraz (patrz sekcja 3); zamiast tego ankieta po biegu "3 pytania" z linkiem w ics-alarmie "dzień po" | masa krytyczna i moderacja przekraczają side project | RaceRaves (model wymaga społeczności) |

### C. Pozycjonowanie i dystrybucja

| Pomysł | Jedno zdanie uzasadnienia | Źródło |
|---|---|---|
| `/dla-organizatorow` + odznaka + embed-widget (#6) | jedyne tanie źródło linków; mamy UTM, więc możemy pokazać organizatorowi, ile kliknięć od nas dostał | Race Roster iframe, motivato |
| W mailu do organizatora: "dodaj bieg do Ahotu, trafi do Strava Race Discovery" | od lipca 2026 Strava pokazuje biegi w zakładce Events (dane m.in. z Ahotu); to darmowa wartość dla organizatora i powód, żeby odpisać | 9to5mac 07.2026, Strava support 15808164, Ahotu x Strava |
| Strony programatyczne: rok 2027, blisko miast, ten weekend, z kijami/psem/dziećmi, zimowe (#7) | luki bez stron u konkurencji; próg 3 biegów chroni przed thin content | research 10.10 |
| Poradniki z planu 10.10 poz. 12 ("jaki bieg górski na początek: 10 biegów na 2027", "sprzęt obowiązkowy: lista z regulaminów", "limit czasu: jak sprawdzić") pisane z danych i aktualizowane co sezon | to jedyna droga do fraz ogólnych; każdy z linkami do biegów i narzędzi; to też jedyny realny kandydat do Discover | research 10.10 1.3 |
| Google Discover: spełnić warunki (1200 px, `max-image-preview:large`, og:image) i nie budować strategii | Google: brak wymogu specjalnych tagów, ale Discover faworyzuje treści "timely"; kalendarz bez artykułów ma małe szanse | dokumentacja Google Discover |
| Google Events (wyniki rozszerzone): zostawić jak jest | funkcja niedostępna w Polsce; snippet Event zdjęty w 2023 | dokumentacja Google Event (lista krajów); seroundtable 10.2023 |
| Bing Webmaster Tools + IndexNow (#9) | Bing stoi za ChatGPT search, Copilot, DuckDuckGo; 30 minut | IndexNow |
| `llms.txt`: 15-minutowa wersja (opis, huby, link do JSON), bez oczekiwań | dowody słabe: brak potwierdzenia OpenAI, logi pokazują ok. 0,1% ruchu crawlerów; nie szkodzi, nie pomaga mierzalnie | dev.to "llms.txt reality check", coderlegion 2026 (źródła wtórne) |
| Cytowalność przez AI: FAQ z danych (jest), daty "stan na" widoczne w HTML strony biegu, `/api/races.json`, obecność w wątkach Reddit/forum | badania cytowań (Ahrefs, Semrush, Profound, cytowane wtórnie) wskazują strukturę nagłówków, świeżość i Reddit jako sygnały; w Perplexity Reddit to ok. 6,6% cytowań | sekcja 4, źródła wtórne |
| Data "stan na DD.MM" na stronie biegu (dziś brak daty aktualizacji) | człowiek i AI widzą, czy dane są świeże; mamy `dplusCheckedAt` i `generatedAt` | odczyt strony biegu 04.11 (brak daty) |
| Społeczności: grupy FB z researchu 10.10, forum bieganie.pl "Górskie i ultra", Wykop #bieganie; subreddit biegowy PL: nie potwierdzony w wyszukiwaniu (niezweryfikowane) | zasada 1-2 odpowiedzi tygodniowo na pytanie "jaki bieg na początek" z linkiem do huba/kreatora; nie ogłoszenia | research 10.10 sekcja 4 |
| Podcasty z "Polecamy": Race Pace i Black Hat Ultra nie mają kalendarza, zaproponować im co miesiąc segment "5 biegów na debiut w [miesiąc]" + link w notatkach odcinka; Kingrunner ma własny kalendarz `/biegi`, więc tylko link do kreatora i słownika | wymiana wartości, nie prośba o link | odczyt sekcji Polecamy 04.11; research 10.10 (kingrunner.com/biegi) |
| Instagram: 1 grafika tygodniowo "bieg tygodnia" z generatora OG (1080x1350) + tekst z karty | tani, powtarzalny format; grupy biegowe żyją na IG/FB | praktyka |
| Lokalne portale przy większych biegach (lista w research 10.10) | piszą o każdym biegu w okolicy; podesłać kartę z danymi | research 10.10 sekcja 4 |
| Rate My Trail (ranking i kursy biegów górskich, ma polskie imprezy od 2014) | obserwować jako konkurenta/partnera na dane o trasach; nie kopiować | en.ratemytrail.com |
| trainerday.com robi programatyczne strony polskich biegów w kilkunastu językach | konkurent w SERP na "[nazwa] 2026"; nasze strony muszą mieć więcej danych (limit, sprzęt, ocena) | wyniki wyszukiwania 04.11 (strona 403 dla automatu) |

### D. Monetyzacja lekka (krótko, decyzja Piotra: klasa "pieniądze")

| Pomysł | Ocena | Źródło |
|---|---|---|
| Afiliacja sprzętu przy liście obowiązkowej (folia NRC, czołówka, bidon, kurtka) | Decathlon PL ma program w TradeTracker; 8a.pl i Skalnik: nie znalazłem publicznych programów (niezweryfikowane). Przy 10 kliknięciach z Google tygodniowo przychód bliski zeru, a zmienia status "serwis niekomercyjny" (stopka, `/o-serwisie`) i wyklucza bezpłatne Open-Meteo. Rekomendacja: odłożyć do ok. 5 000 sesji/mies. | tradetracker.com/pl (Decathlon), open-meteo.com/en/terms |
| Promowane biegi organizatorów | konflikt z neutralnością oceny "dobry na start"; jeśli kiedyś, to oznaczone "promowane" i poza oceną; dziś brak ruchu, który dałoby się sprzedać | praktyka kalendarzbiegowy ("patronat") |
| Booking affiliate przy biegu ("nocleg blisko startu") | od 2025 zapisy przez CJ/Awin, prowizja ok. 4% (źródła wtórne, niezweryfikowane); UX-owo sensowne (biegi w małych miejscowościach), ale wymaga statusu komercyjnego; odłożyć razem z afiliacją sprzętu | track360, makeinfluence (wtórne) |
| Tip jar / "postaw kawę" | zgodne z warunkami Open-Meteo ("voluntary donations" dozwolone) i statusem niekomercyjnym; jedyna forma bez skutków ubocznych | open-meteo.com/en/terms |

## 3. Czego NIE robić i dlaczego

| Nie robić | Dlaczego |
|---|---|
| ISR, `cacheComponents`, baza danych w runtime | 300 stron i dane zmieniane 2-3x w tygodniu commitem: pełny statyczny render jest najtańszy i najszybszy (HIT z CDN, age 37 h); ISR dodaje warstwę awarii bez zysku |
| Dalsze inwestycje w rich results Event | funkcja Google niedostępna w Polsce (lista krajów w dokumentacji); to, co jest (SportsEvent, Offer), wystarcza jako dane dla AI i Bing |
| Konta użytkowników, logowanie, baza profili | localStorage + ics + newsletter dają 90% wartości ("moje biegi", przypomnienia) bez RODO, bez haseł i bez kosztu utrzymania |
| Opinie i oceny użytkowników | masa krytyczna (RaceRaves działa przy dziesiątkach tysięcy recenzji), moderacja, dane osobowe; przy 58 biegach strony z zerem opinii wyglądają gorzej niż bez sekcji |
| Kopiowanie wyników i list startowych | RODO i ochrona baz danych (decyzja z PLAN.md); linkować do wyników u organizatora, ITRA, Rate My Trail |
| Strategia pod Google Discover | kalendarz bez treści "timely" prawie nie trafia do Discover; spełnić trzy tanie warunki i zapomnieć |
| Strony programatyczne z pustą listą | treningbiegacza ma setki stron "(0)" i to jest ich słabość; próg minimum 3 biegi na stronę |
| Web push z własnym backendem | wymaga serwera VAPID i magazynu subskrypcji; ics z VALARM i mail przez Brevo robią to samo taniej |
| Afiliacja i promowane biegi teraz | przychód pomijalny przy obecnym ruchu, a koszt to utrata statusu niekomercyjnego (Open-Meteo, zaufanie oceny) |
| Sitemap index, hreflang, AMP | poniżej progów, jeden język, AMP martwe |
| `llms.txt` jako projekt | 15 minut tak, godziny nie: brak dowodu, że ChatGPT czy Perplexity to czytają |
| Pełny PWA z service workerem przed pomiarem ruchu z telefonu | SW to kolejny element do utrzymania przy każdej zmianie; manifest i tryb ciemny dają widoczny efekt bez ryzyka |

## 4. Źródła (odczyt 04.11.2026)

Własne (kod i produkcja):
- https://plaskiejestnudne.pl/ , /biegi , /bieg/baran-trail-race-winter-edition-2027-03-13 , /kreator , /czy-dam-rade , /slownik , /biegi/pasmo/beskidy , /zmiany , /ics/baran-trail-race-winter-edition-2027-03-13 (pomiary curl: rozmiary, nagłówki, JSON-LD, endpointy 404)
- repo `~/Claude/plaskie-jest-nudne`: `docs/seo_audit_2026-10.md`, `docs/seo_research_2026-10.md`, `docs/PLAN.md`, `lib/types.ts`, `lib/seo.ts`, `lib/hubs.ts`, `lib/predict.ts`, `app/ics/[slug]/route.ts`, `app/sitemap.ts`, `app/layout.tsx`, `components/Analytics.tsx`, `components/RaceList.tsx`, `.github/workflows/refresh.yml`, `data/races.json` (statystyki pokrycia)

Wzorce i konkurencja:
- https://www.finishers.com/pl/e/lemkowyna-ultra-trail-r-maj (strona biegu: ulubione, "hotele w pobliżu" puste, bez opinii, pogody, profilu)
- https://en.ratemytrail.com/event/lemkowyna-ultra-trail-2026 (edycje 2014-2027, klasy trudności, wyniki top 3)
- https://racenotify.com/ (alerty otwarcia zapisów, Monday digest, 3 alerty za darmo, PRO 4,99 EUR/rok)
- https://support.strava.com/en-us/articles/15808164-find-and-register-for-races-with-race-discovery (Race Discovery, zakładka Events)
- https://9to5mac.com/2026/07/09/strava-gets-an-events-tab-with-upcoming-races-group-runs-more/ ; https://the5krunner.com/2026/07/09/strava-race-discovery-runna/ (filtry: dystans, data, profil, średnia temperatura)
- https://www.racedirectorshq.com/news/ahotu-and-strava-join-forces-to-get-athletes-race-ready-with-interactive-race-maps-1013/ ; https://the5krunner.com/2023/11/13/garmin-connect-gets-beefed-up-with-ahotu (Ahotu x Strava, Ahotu x Garmin "add to calendar")
- https://raceraves.com/top-five-member-benefits/ ; https://raceraves.com/frequently-awesome-questions-faqs/ (My Staging Area, oceny w czterech wymiarach; strona wskazówek zwraca 403)
- https://help.ultrasignup.com/hc/en-us/articles/35718367095437 ; https://news.ultrasignup.com/?p=8184 (wyniki, waitlist, okno otwarć zapisów XI-II)
- https://itra.run/Races/RaceDetails/105090 (pola karty: time limit, aid stations, participants, "See another edition"; strona polskiego biegu nie zwróciła treści)
- https://help.raceroster.com/en-us/knowledge-base/creating-and-branding-timer-calendars (kalendarz do osadzenia iframe)
- https://info.runsignup.com/?p=45478 (Event Showcase)
- https://trainerday.com/events/pl/dolnoslaski-festiwal-biegow-gorskich-golden-mountains-trail-2026 (403 dla automatu; widoczne w SERP)
- ahotu.com (403 dla automatu; informacje z wyników wyszukiwania powyżej)

Dokumentacja:
- https://developers.google.com/search/docs/appearance/google-discover (1200 px, `max-image-preview:large`, og:image, brak wymogu specjalnych tagów)
- https://developers.google.com/search/docs/appearance/structured-data/event (wymagane i zalecane pola, `offers.price`, lista krajów: bez Polski)
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag ("If you don't specify the max-image-preview rule, Google may show an image preview of the default size")
- https://www.seroundtable.com/google-stop-showing-even-rich-results-36240.html (snippet Event zdjęty 10.2023)
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
- https://nextjs.org/docs/messages/empty-generate-static-params ; https://github.com/vercel/next.js/discussions/98177 (cacheComponents, ISR)
- https://vercel.com/docs/analytics/privacy-policy ; https://vercel.com/docs/analytics/limits-and-pricing ; https://vercel.com/docs/plans/hobby-plan (bez cookies, 50 000 zdarzeń/mies.)
- https://open-meteo.com/en/docs ; https://open-meteo.com/en/terms (16 dni prognozy, archiwum od 1940, bez klucza, 10 000/dzień, niekomercyjnie, reklamy = komercyjnie, dotacje OK, ostrzeżenie o limitach per IP na Vercel)

AI i cytowania (źródła wtórne, traktować ostrożnie):
- https://dev.to/mrtd/llmstxt-reality-check-10-of-sites-have-it-ai-search-engines-almost-never-read-it-2281 ; https://coderlegion.com/19861/everyones-telling-you-to-add-llms-txt-for-ai-search-the-2026-data-says-it-gets-1-crawler-tra (llms.txt: ok. 0,1% ruchu crawlerów, brak potwierdzenia OpenAI)
- https://authoritytech.io/blog/perplexity-vs-chatgpt-search-2026 ; https://dev.to/dageno_963435178f0fc9478d/how-to-get-cited-by-ai-earning-citations-from-chatgpt-perplexity-and-google-ai-overviews-3ic3 (struktura, świeżość, Reddit 6,6% cytowań w Perplexity wg Profound)

Monetyzacja (źródła wtórne, niezweryfikowane):
- https://tradetracker.com/pl/start-kampanii-decathlon/ (program Decathlon w TradeTracker PL)
- https://track360.io/blog/booking-com-affiliate-partner-program-operator-teardown-2026 ; https://www.makeinfluence.com/en/academy/booking-coms-affiliate-program-how-travel-creators-earn-commission (Booking przez CJ/Awin od 2025, ok. 4%)
