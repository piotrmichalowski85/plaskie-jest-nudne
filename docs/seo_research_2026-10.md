# Research SEO plaskiejestnudne.pl, 10.10.2026

Zakres: frazy, które wpisują Polacy szukając biegów górskich/trailowych i porad dla początkujących; kto na nie rankuje i jak ma zbudowane strony; luki, które możemy zająć; skąd wziąć pierwsze linki; co obserwować w Search Console. Metoda: wyszukiwanie w sieci (zapytania po polsku) plus odczyt kodu stron konkurentów (tytuł, H1, meta, JSON-LD, linki wewnętrzne) i naszych własnych. Tylko odczyt, bez narzędzi płatnych.

Zastrzeżenie o wolumenach: żadne publiczne źródło nie podaje liczb wyszukiwań dla tych fraz (Senuto, Ahrefs, Semstorm trzymają je za logowaniem, Google Trends nie zwraca wartości bezwzględnych). Wszędzie niżej wolumen = "brak danych". Jedyny twardy proxy, jaki mamy, to własna Search Console: fraza "zimowy maraton świętokrzyski 2027" dała 86 wyświetleń w tydzień przy pozycji ok. 8 (patrz `seo_audit_2026-10.md`), czyli nazwy biegów z rokiem generują setki zapytań miesięcznie na pojedynczy bieg. Ocena konkurencyjności niżej jest jakościowa: na podstawie tego, kto zajmuje pierwszą stronę i jak mocne są to domeny.

Uzupełnienie, nie duplikat: audyt techniczny (canonical, tytuły, schema, Lighthouse) jest w `seo_audit_2026-10.md`. Tu dochodzą dwa nowe ustalenia techniczne, których tam nie ma (sekcja 3.0).

## 1. Słowa kluczowe

### 1.1 Kalendarz i terminy

| Fraza (przykłady) | Intencja | Kto rankuje dziś | Konkurencyjność | Wolumen |
|---|---|---|---|---|
| "kalendarz biegów górskich 2027", "biegi górskie 2027", "kalendarz biegów górskich" | nawigacyjna + przegląd oferty, użytkownik planuje sezon | treningbiegacza.pl (landing kategorii "Biegi górskie 2026 / 2027"), biegigorskie.pl (/kalendarz-2027/), kingrunner.com/biegi, maratonygorskie.pl, motivato.pl, zawodybiegowe.pl, finishers.com | wysoka: domeny z 10+ lat historii (biegigorskie od 2011, maratonypolskie, kingrunner), ale ich strony są technicznie słabe (biegigorskie: brak meta i schema; kingrunner: brak schema) | brak danych |
| "biegi górskie listopad 2026", "biegi trailowe grudzień", "biegi górskie zima 2027" | planowanie na konkretny miesiąc | nikt nie ma dedykowanej strony miesiąca; rankują ogólne kalendarze i elektronicznezapisy.pl (/62/bieg-gorski.html), biegigorskie.pl archiwum po miesiącu publikacji (/2026/01/) | niska: brak stron zbudowanych pod tę intencję | brak danych |
| "biegi trailowe Beskidy", "biegi górskie Karkonosze", "biegi górskie Sudety", "biegi w Tatrach", "biegi górskie Bieszczady", "biegi górskie Beskid Niski" | region/pasmo, często z planem wyjazdu | finishers.com (strony "spots": "Traile w Karkonoszach", "Biegi w polskich górach", podają liczby: Karkonosze 9, Tatry 8, Sudety 32 biegów), skalnik.pl (blog "5 najlepszych biegów górskich w Sudetach"), portaltatrzanski.pl ("Zawody biegowe na terenie Tatr"), siwejka.pl (Beskid Niski), lokalne portale (krosno24.pl) | średnia: finishers.com ma strony per pasmo, ale po angielsku/w tłumaczeniu maszynowym, reszta to pojedyncze artykuły | brak danych |
| "biegi górskie śląskie", "biegi górskie małopolskie", "biegi górskie Bielsko-Biała" | region administracyjny / miasto | treningbiegacza.pl robi programatyczne landingi typ x miasto i typ x województwo ("Biegi górskie Chorzów 2026 / 2027", "biegi-gorskie-slaskie"), zawodybiegowe.pl (stopka "Biegi - miasta / województwa") | średnia: treningbiegacza ma setki takich stron, wiele pustych ("Biegi górskie Chorzów (0)"), czyli thin content, który da się pobić stroną z realną listą i opisem | brak danych |
| "kalendarz biegów przełajowych 2026", "biegi przełajowe 2027" | jak wyżej, dla przełajów | treningbiegacza.pl (/kalendarz-biegow/biegi-przelajowe), elektronicznezapisy.pl (/48/bieg-przelajowy.html), ahotu.com; SERP zanieczyszczony kolarstwem przełajowym (PZKol) | niska do średniej | brak danych |
| "biegi ultra Polska", "kalendarz biegów ultra" | ultra (nie nasz rdzeń, ale część bazy) | kalendarzbiegowy.pl (/kalendarz-biegow-ultra/), finishers.com, nessi-sport, redbull.com | wysoka | brak danych |

### 1.2 Konkretne biegi (najszybszy ruch, już działa)

| Fraza (wzorzec) | Intencja | Kto rankuje dziś | Konkurencyjność | Wolumen |
|---|---|---|---|---|
| "[nazwa biegu] 2027", "[nazwa] 2026" | termin kolejnej edycji | strona organizatora, potem kalendarze: kalendarzbiegowy.pl, biegigorskie.pl (/szczegolowy-kalendarz/), motivato.pl (/biegi/[slug]/ "UltraKotlina 2026 - termin, zapisy"), zawodybiegowe.pl (strona per dystans: /gorce-ultra-trail-12km), treningbiegacza.pl | niska do średniej dla biegów małych i średnich (organizatorzy mają słabe strony, kalendarze mają nieaktualne daty: kalendarzbiegowy pokazuje BUT z datą 2024, biegigorskie z 2013); wysoka tylko dla topowych (Rzeźnik, Łemkowyna, Ultra Granią Tatr: organizator + media) | brak danych; własny proxy: 86 wyświetleń/tydz dla jednego biegu |
| "[nazwa] zapisy", "[nazwa] zapisy 2027" | chce się zapisać | organizator, platformy zapisów (b4sportonline.pl/[Nazwa]/, datasport, elektronicznezapisy), ultralemkowyna.pl/zgloszenia | średnia: platforma zapisów wygrywa, ale my możemy być "drugim wynikiem" z informacją, czy zapisy są otwarte | brak danych; w naszej GSC już jest "magurka trail zapisy" |
| "[nazwa] trasa", "[nazwa] limit czasu", "[nazwa] przewyższenie", "[nazwa] regulamin", "[nazwa] wyniki" | przygotowanie do startu | organizator (regulamin PDF), bieganie.pl relacje, blogi | niska dla "limit czasu" i "przewyższenie" (mało kto to wyciąga na stronę; w regulaminach biegrzeznika.pl limity są w PDF) | brak danych |
| "[nazwa biegu]" bez dopisku | nawigacyjna | organizator | nie walczymy o pierwsze miejsce, ale pozycja 3-6 z jasnym tytułem łapie kliknięcia | brak danych |

Wzorce zapytań o bieg widoczne w naszej GSC: nazwa + rok (dominujące), nazwa + "zapisy", skrót pojęcia ("d+"). Zero zapytań ogólnych. To potwierdza, że strony `/bieg/<slug>` są dziś naszym jedynym kanałem i trzeba je dopieścić w pierwszej kolejności (tytuł, opis, schema, linki między nimi).

### 1.3 Początkujący (nasza nisza, treści poradnikowe)

| Fraza (przykłady) | Intencja | Kto rankuje dziś | Konkurencyjność | Wolumen |
|---|---|---|---|---|
| "pierwszy bieg górski", "jaki bieg górski na początek", "bieg górski dla początkujących", "biegi górskie dla początkujących" | wybór pierwszego startu + przygotowanie | bieganie.pl ("Pierwszy bieg górski. Co musisz wiedzieć?", "Jaki dystans dla biegacza debiutującego w górach?"), biegigorskie.pl ("Jaki bieg górski na początek?", "Poradnik początkującego górala"), sklepy: brubeck.pl, decathlon.pl, 8a.pl, skalnik.pl, sklepiguana.pl, sportnovia.pl; motivato.pl pillar /biegi-gorskie/ | średnia: wszyscy odpowiadają artykułem bez listy konkretnych biegów z datami; nikt nie łączy porady z kalendarzem (to nasz kreator) | brak danych |
| "jak zacząć biegać w górach", "bieganie po górach jak zacząć", "trail running od czego zacząć" | nauka od zera | decathlon.pl, 8a.pl (8academy), poradnikbiegowy.pl, garmin.com blog, national-geographic.pl | wysoka: duże domeny komercyjne | brak danych |
| "sprzęt obowiązkowy bieg górski", "wyposażenie obowiązkowe bieg górski", "co zabrać na bieg górski" | regulamin, lista rzeczy | poradnikbiegowy.pl ("Wyposażenie obowiązkowe na bieg górski - lista i kryteria"), bieganie.pl, motivato FAQ | średnia | brak danych |
| "co to D+", "przewyższenie D+ co to znaczy", "cutoff bieg", "co to jest vertical", "punkty ITRA jak zdobyć", "UTMB Index", "Running Stones" | definicja | biegigorskiegdynia.pl ("Słownik nizinnego trailowca"), bieganie.pl ("Punkty ITRA"), festiwalbiegowy.pl, tricitytrail.pl, kingrunner.com | niska: pojedyncze stare artykuły, brak dobrze ustrukturyzowanego słownika; "d+" już daje nam wyświetlenia | brak danych |
| "jaki dystans na pierwszy bieg górski", "10 km bieg górski dla początkujących", "półmaraton górski dla początkujących" | dobór dystansu | bieganie.pl, biegigorskie.pl, outdoormagazyn.pl | niska do średniej | brak danych |
| "kije do biegów górskich czy warto", "jak dobrać długość kijów" | sprzęt | 8a.pl, decathlon.pl, runandtravel.pl, poradnikbiegowy.pl, maratongorski.pl, pannaannabiega.pl | wysoka (sklepy) | brak danych |
| "plan treningowy bieg górski", "jak trenować do biegów górskich mieszkając na nizinach" | trening | bieganie.pl, biegigorskie.pl, decathlon, motivato FAQ | wysoka | brak danych; poza naszym rdzeniem, nie priorytet |

### 1.4 Narzędzia

| Fraza (przykłady) | Intencja | Kto rankuje dziś | Konkurencyjność | Wolumen |
|---|---|---|---|---|
| "kalkulator czasu bieg górski", "przelicznik czasu trail", "jak przeliczyć górski dystans na płaski", "ile czasu zajmie bieg górski 20 km" | oszacować czas na trasie z przewyższeniem | ogólne kalkulatory tempa (treningbiegacza.pl/kalkulator-biegowy, kalkulatorbiegu.pl, racepace.pl, kalkulato.pl, biegnijmy.pl), webp.pl "kalkulator chodzenia po górach" (turystyka), bieganie.pl artykuł "Jak przeliczyć górski dystans na płaski?" (reguła Naismitha, +30-45 s/km na 100 m D+) | niska: nie ma w polskim internecie kalkulatora, który bierze czas z płaskiego + konkretny bieg + limit czasu; to dokładnie "Czy dam radę?" | brak danych |
| "czy dam radę przebiec bieg górski", "czy zmieszczę się w limicie" | pytanie naturalne, bez narzędzia | fora (bieganie.pl forum "Górskie i ultra") | niska | brak danych |
| "kalkulator ITRA punkty", "ile punktów ITRA za bieg" | sprawdzenie punktów | kingrunner.com, bieganie.pl, itra.run | średnia; opcjonalnie dodać przelicznik km + D+/100 do słownika | brak danych |

## 2. Konkurenci w SERP

### 2.1 Top 5 (realnie zajmują nasze frazy)

| Serwis | Co rankuje | Tytuł / H1 | Schema | Linkowanie wewnętrzne | Słabości, które możemy wykorzystać |
|---|---|---|---|---|---|
| treningbiegacza.pl | landing kategorii "Biegi górskie 2026 / 2027 - Kalendarz Biegów w Polsce"; programatyczne landingi typ x miasto i typ x województwo; strony biegów | Tytuł z rokiem i podwójnym rokiem "2026 / 2027" (łapie oba sezony); H1 "Kalendarz Biegi górskie (16)" z licznikiem; strona biegu ma tytuł gołą nazwą ("Chorzowska Dycha") bez roku i miejsca | tak, najpełniejsze: CollectionPage + ItemList z SportsEvent (startDate, eventStatus, eventAttendanceMode, Place z geo, Offer z ceną i validFrom, organizer), BreadcrumbList, WebSite/SearchAction | stopka i sekcja "Biegi w pobliżu": linki do dziesiątek stron miasto x typ (biegi-gorskie-katowice, 10km-chorzow, maratony-chorzow), do województw, do bazy wiedzy i kalkulatora | w kategorii "biegi górskie" mają 16 biegów (my 250); setki pustych stron "(0)" to thin content; strony biegów bez roku w tytule |
| biegigorskie.pl | "kalendarz biegów górskich 2027" (strona /kalendarz-2027/), poradniki dla początkujących ("Jaki bieg górski na początek?"), newsy o zapisach ("Nowy termin i zapisy na Bieg Ultra Granią Tatr") | Tytuł "Kalendarz 2027 - BiegiGorskie.pl" (krótki, bez słowa "biegi górskie" w tytule, ratuje go domena); strona biegu "Beskidy Ultra Trail - BiegiGorskie.pl" z H1 i datą publikacji z 2013 | brak JSON-LD, brak meta description | WordPress: kategorie (news, zapowiedzi, relacje, trening, sprzęt), kalendarz roczny jako jedna długa strona po miesiącach, archiwum po dacie publikacji; brak stron per region, per dystans | technicznie z 2011: brak schema, brak opisów, strony biegów nieaktualne; wygrywa wiekiem domeny i treścią poradnikową; da się ich wyprzedzić na frazach z rokiem i na "dla początkujących" |
| kalendarzbiegowy.pl | strony biegów ("Beskidy Ultra Trail - KalendarzBiegowy.pl", "Pieniny Ultra-Trail 2026"), /kalendarz-biegow-gorskich/, /kalendarz-biegow-ultra/ | Tytuł "Nazwa - KalendarzBiegowy.pl", często z rokiem w slugu; H1 puste lub równe nazwie | tak: Event (eventStatus, eventAttendanceMode, Place, startDate) + BreadcrumbList + WebSite; ale dane nieaktualne (BUT: startDate 2024) | huby: kalendarz górskie, ultra, mapa; "dodaj bieg do kalendarza", "patronat medialny"; brak stron miesiąc/region | strony biegów cienkie (jedno zdanie opisu), nieaktualne daty w schema, brak meta description; nasza strona biegu z dystansami, oceną dla początkujących i limitem jest bogatsza |
| motivato.pl | "biegi górskie 2026 kalendarz" (landing), pillar /biegi-gorskie/, strony biegów "UltraKotlina 2026 - termin, zapisy \| Motivato" | Tytuł landingu "Biegi górskie 2026 - kalendarz \| Motivato", H1 "Kalendarz biegów górskich" + lead; strona biegu: "Nazwa ROK - termin, zapisy" (najlepszy wzorzec tytułu w stawce), H2 "Dystanse i warianty", "Informacje organizacyjne", "Podobne i pobliskie biegi", "Powiązane kalendarze" | landing: CollectionPage + ItemList + FAQPage (3 pytania: bieg górski a trail, sprzęt obowiązkowy, czy dystans mówi o trudności); strona biegu: tylko Breadcrumb, brak Event | strona biegu linkuje do podobnych i pobliskich biegów oraz do kalendarzy powiązanych; pillar /biegi-gorskie/ z sekcjami "Od czego zacząć?", "Kalendarz", "Sprzęt", "Trening"; /kalkulator-czasu/; /dla-organizatorow/ | najbliższy nam technicznie (Astro, nowa domena, SEO-świadomy), to benchmark struktury; braki: brak Event schema na stronie biegu, brak oceny trudności, brak narzędzia pod górskie |
| zawodybiegowe.pl | "Biegi Górskie 2026 \| ZawodyBiegowe.pl" (108 wydarzeń), strony per dystans ("Gorce Ultra Trail - 12km") | Tytuł "Nazwa - 12km \| ZawodyBiegowe.pl", H1 nazwa + miasto; meta: "Nazwa 2026 - bieg na dystansie 12 km w Miasto. Sprawdź termin, zapisy, pakiet startowy, trasę i cenę" | tak: SportsEvent + Offer + FAQPage (8 generycznych pytań: jak się zapisać, zwrot opłaty, parking, punkty z wodą, co zabrać latem) + Breadcrumb | strona biegu: "Podobne biegi i kolejne starty"; stopka programatyczna: "Biegi - miasta", "Biegi - województwa", "Biegi - kategorie" | FAQ to szablon powtarzany na każdej stronie (ryzyko dla nich przy ocenie jakości); osobna strona per dystans rozprasza siłę; brak oceny dla początkujących |

### 2.2 Pozostali

| Serwis | Rola w SERP | Uwagi |
|---|---|---|
| kingrunner.com | /biegi (lista + mapa), strony biegów z tytułem "UltraKotlina 15 - Piechowice - 10.10.2026, 11:00 - kingrunner.com", magazyn (porady, ITRA, kije), grupa FB teamkingrunnerultra | brak schema i meta; siła w treści i społeczności ultra, nie w kalendarzu |
| maratonypolskie.pl | stary PHP (iso-8859-2), listy po parametrach URL (dzial=3&grp=13) | rankuje wiekiem; technicznie nie do naśladowania |
| elektronicznezapisy.pl, b4sportonline.pl, datasport (online.datasport.pl) | platformy zapisów; rankują na "[nazwa] zapisy" i czasem "kalendarz biegów górskich" (elektronicznezapisy /62/bieg-gorski.html) | nie pokonamy ich na "zapisy", ale możemy linkować do nich z UTM i być źródłem przed zapisem |
| bieganie.pl | poradniki (NewsArticle) na "pierwszy bieg górski", "jaki dystans dla debiutującego", "jak przeliczyć górski dystans na płaski"; forum "Górskie i ultra" | najmocniejszy na poradnikach; nie ma kalendarza biegów górskich z oceną |
| runners-world.pl | kalendarz z 2022, nieaktualny | nie jest konkurentem w górskich |
| finishers.com | strony per pasmo ("Traile w Karkonoszach") i kraj | zagraniczny agregator, tłumaczenia; rankuje na pasma, bo nikt polski nie ma takich stron |
| poradnikbiegowy.pl, motivato (pillar), sklepy (8a, Skalnik, Decathlon, Brubeck, Iguana, Sportnovia) | poradniki dla początkujących | sklepy wygrywają autorytetem domeny; nie wygramy na "jak zacząć biegać w górach", wygramy na "jaki bieg na początek" dzięki konkretom z bazy |

### 2.3 Co robią, czego my nie robimy

1. Rok w tytule stron zbiorczych ("2026 / 2027") i w tytule strony biegu ("Nazwa 2026 - termin, zapisy"). My: "Kalendarz biegów górskich i trailowych" bez roku; "Nazwa, 9-10 maja 2025".
2. Strony-huby per województwo/miasto (treningbiegacza, zawodybiegowe), per typ (górskie/ultra/przełaje) i per pasmo (finishers). My: filtry w URL `?start=1`, których Google nie traktuje jak osobnych stron.
3. Lista biegów w HTML strony kalendarza z linkami do każdego biegu. My: `/biegi` ma w HTML 1 link do `/bieg/` (lista jest renderowana po stronie klienta z JSON), czyli 246 stron biegów nie ma żadnego linku wewnętrznego poza mapą witryny. To największa pojedyncza przyczyna "74 wykryte, niezindeksowane".
4. Sekcja "Podobne i pobliskie biegi" / "Kolejne starty" na stronie biegu (motivato, zawodybiegowe, treningbiegacza "Biegi w pobliżu"). My: strona biegu linkuje tylko do nawigacji.
5. ItemList z SportsEvent na stronie kalendarza i Offer + eventStatus na stronie biegu (treningbiegacza, zawodybiegowe). My: SportsEvent bez offers/eventStatus; a pole `url` wskazuje kalendarzbiegowy.pl zamiast naszej strony (szczegóły w 3.0).
6. FAQPage z pytaniami na landingu kategorii (motivato) i na stronie biegu (zawodybiegowe).
7. Formularz "dodaj bieg" + "dla organizatorów" + "patronat medialny" jako kanał zdobywania treści i linków (kalendarzbiegowy, treningbiegacza, motivato). My: mamy "Dodaj bieg", ale bez oferty dla organizatora.
8. Treści poradnikowe jako osobne strony (bieganie.pl, biegigorskie.pl). My: jeden słownik na jednej stronie.

## 3. Luki i szanse

### 3.0 Dwa nowe ustalenia techniczne (nie ma ich w `seo_audit_2026-10.md`)

| # | Problem | Dowód | Skutek | Poprawka |
|---|---|---|---|---|
| N1 | Lista biegów na `/biegi` nie jest w HTML: 1 link `href="/bieg/..."` w całym dokumencie, dane biegów siedzą w `self.__next_f` (JSON), karty renderuje klient | `curl https://plaskiejestnudne.pl/biegi \| grep -c "/bieg/"` = 1 | 246 stron biegów to sieroty (orphan pages): Google zna je tylko z mapy witryny, nie dostają żadnej siły z linków wewnętrznych, indeksacja idzie wolno (74 "wykryte, niezindeksowane") | renderować serwerowo przynajmniej listę nadchodzących biegów (nazwa, data, miejsce, link) jako zwykłe `<a href>`; filtry mogą dalej działać po stronie klienta na tej samej liście; dodatkowo huby z 3.1 |
| N2 | JSON-LD SportsEvent na stronie biegu ma `"url":"https://kalendarzbiegowy.pl/biegi/..."` (adres źródła danych), nie nasz adres | strona `/bieg/meble-wojcik-ultra-wysoczyzna-2025-05-09` | mówimy Google, że kanoniczna strona tego wydarzenia jest u konkurenta; wynik rozszerzony, jeśli powstanie, wyśle ruch do nich | `url` = nasz adres strony; link do organizatora w `organizer.url` i w `offers.url` (zapisy); źródło danych ewentualnie w `sameAs` |

### 3.1 Strony-landingi, które warto mieć (statyczne, własny tytuł, lead 2-4 zdania, lista z linkami, canonical na siebie)

| Strona | Przykładowy tytuł | Pod jakie frazy | Uwaga |
|---|---|---|---|
| `/biegi/dla-poczatkujacych` | "Biegi górskie dla początkujących 2026/2027: lista startów z zieloną oceną" | "biegi górskie dla początkujących", "pierwszy bieg górski jaki wybrać", "łatwe biegi górskie" | nasz wyróżnik (ocena zielona/żółta/czerwona), nikt tego nie ma |
| `/biegi/<pasmo>` (Beskidy, Sudety, Karkonosze, Tatry i Podhale, Bieszczady, Góry Świętokrzyskie, Jura, Pomorze/niziny) | "Biegi górskie i trailowe w Beskidach 2026/2027: terminy, dystanse, D+" | "biegi trailowe Beskidy", "biegi górskie Karkonosze" | finishers.com rankuje na to z tłumaczenia maszynowego; da się przeskoczyć |
| `/biegi/<rok>/<miesiac>` | "Biegi górskie i trailowe: listopad 2026" | "biegi górskie listopad 2026", "biegi trailowe grudzień" | nikt nie ma; tanie w generowaniu z bazy; odbyte miesiące zostają jako archiwum z linkiem do kolejnego roku |
| `/biegi/do-15-km`, `/biegi/polmaraton-gorski`, `/biegi/do-10-km` | "Krótkie biegi górskie do 15 km: kalendarz 2026/2027" | "bieg górski 10 km", "półmaraton górski kalendarz" | dystans to główne kryterium debiutanta |
| `/biegi/otwarte-zapisy` | "Biegi górskie z otwartymi zapisami: na co można się zapisać teraz" | "biegi górskie zapisy otwarte", "na jaki bieg górski się zapisać" | mamy status zapisów w bazie; aktualizowana przy każdym odświeżeniu danych |
| `/biegi/<wojewodztwo>` (małopolskie, śląskie, dolnośląskie, podkarpackie) | "Biegi górskie w Małopolsce 2026/2027" | "biegi górskie małopolskie" | treningbiegacza ma puste strony tego typu; jedna nasza z 40 biegami je pobije |
| `/biegi/przelajowe` | "Biegi przełajowe w Polsce 2026/2027: kalendarz" | "kalendarz biegów przełajowych" | oddziela przełaje od górskich; SERP ma mało stron biegowych (dużo kolarskich) |

### 3.2 Treści poradnikowe o realnym popycie (po jednej stronie, zawsze z linkami do konkretnych biegów z bazy)

| Temat | Pod jakie frazy | Dlaczego my |
|---|---|---|
| "Jaki bieg górski na początek? 10 biegów z zieloną oceną na 2027" | "jaki bieg górski na początek", "pierwszy bieg górski" | konkurenci piszą ogólnie, my dajemy listę z datami i linkami; aktualizowana co sezon |
| "Co to jest D+ i jak czytać przewyższenie w regulaminie" (osobna strona ze słownika) | "co to D+", "przewyższenie d+" | "d+" już daje nam wyświetlenia; osobna strona z DefinedTerm + FAQ |
| "Limit czasu (cutoff) na biegu górskim: jak sprawdzić, czy się zmieścisz" | "limit czasu bieg górski", "cutoff bieg" | naturalny most do `/czy-dam-rade` |
| "Sprzęt obowiązkowy na biegu górskim: lista 9 rzeczy, które powtarzają się w regulaminach" | "sprzęt obowiązkowy bieg górski" | poradnikbiegowy.pl ma to jako jedyny; możemy dodać, które biegi z bazy wymagają czego |
| "Ile czasu zajmie Ci bieg górski? Przelicznik z płaskiego" | "jak przeliczyć górski dystans na płaski", "kalkulator czasu bieg górski" | opis metody kalkulatora + przykłady z realnych biegów; linkuje do narzędzia |
| "Bieg górski a trail a przełaj: czym się różnią" | "bieg górski a trail różnica" | pytanie z FAQ motivato; mamy już hasło w słowniku |

### 3.3 FAQ pod "Podobne pytania" (People Also Ask)

Pytania, które wracają w SERP i w FAQ konkurentów (motivato, zawodybiegowe) oraz w artykułach bieganie.pl: Jaki dystans na pierwszy bieg górski? Czym różni się bieg górski od trailowego? Co to jest wyposażenie obowiązkowe? Ile trwa bieg górski 10 km / 20 km dla amatora? Czy można biec z kijami? Jak trenować do biegów górskich mieszkając na nizinach? Co to są punkty ITRA i czy początkującemu są potrzebne? Czy dystans mówi, jak trudny będzie bieg? Umieścić 3-5 takich pytań z krótkimi odpowiedziami (2-3 zdania, konkret z bazy) na `/biegi/dla-poczatkujacych`, na stronie każdego biegu (pytania zależne od danych: "Jaki jest najkrótszy dystans?", "Jaki jest limit czasu?", "Czy zapisy są otwarte?") i na stronach narzędzi, ze schema FAQPage. Nie powielać jednego szablonu na 250 stronach (błąd zawodybiegowe): pytania generować z danych konkretnego biegu.

### 3.4 Lista działań z priorytetem (wpływ vs koszt)

| # | Działanie | Wpływ | Koszt | Uzasadnienie z researchu |
|---|---|---|---|---|
| 1 | Lista nadchodzących biegów renderowana serwerowo na `/biegi` jako linki (N1) | bardzo wysoki | niski | 246 stron bez linków wewnętrznych; każdy konkurent ma listę w HTML |
| 2 | Tytuł i opis strony biegu: "Nazwa 2027: termin, dystanse, zapisy, limit czasu \| Płaskie jest nudne"; opis z datą, miejscem, dystansami, D+, statusem zapisów | bardzo wysoki | niski | jedyne nasze wyświetlenia to nazwa + rok; CTR 0-2% przy pozycji 8; motivato używa "Nazwa ROK - termin, zapisy" i rankuje |
| 3 | Schema SportsEvent: `url` = nasz adres (N2), + `offers` (url zapisów, availability), `eventStatus`, `eventAttendanceMode`, `organizer`, `description`, `image` | wysoki | niski | treningbiegacza i zawodybiegowe mają komplet; to warunek wyniku rozszerzonego z datą |
| 4 | Na stronie biegu sekcja "Podobne biegi" (to samo pasmo, ten sam miesiąc, zielona ocena) z 4-6 linkami + "Kolejna edycja / poprzednia edycja" | wysoki | niski | motivato, zawodybiegowe, treningbiegacza mają; łączy sieroty w sieć |
| 5 | Huby per pasmo (8 stron) | wysoki | średni | "biegi trailowe Beskidy", "biegi górskie Karkonosze": rankuje finishers.com z tłumaczenia; niska konkurencja |
| 6 | Hub `/biegi/dla-poczatkujacych` + artykuł "Jaki bieg górski na początek" z listą | wysoki | średni | nasza nisza; konkurenci piszą bez listy biegów; "biegi górskie dla początkujących" bez dedykowanej strony w SERP |
| 7 | Huby per miesiąc (rok/miesiąc) | średni | niski | zapytania "biegi górskie listopad 2026" bez dedykowanych stron u nikogo |
| 8 | Rok w tytule stron zbiorczych: "Kalendarz biegów górskich i trailowych 2026/2027" | średni | bardzo niski | wszyscy w top 5 mają rok; frazy z rokiem to główny wzorzec |
| 9 | Huby per dystans (do 10 km, do 15 km, półmaraton górski) i `/biegi/otwarte-zapisy` | średni | niski | dystans = kryterium debiutanta; status zapisów mamy w bazie, nikt nie ma takiej strony |
| 10 | Słownik: osobne strony dla D+, cutoff, sprzęt obowiązkowy, ITRA + DefinedTermSet/FAQPage | średni | niski | "d+" już w GSC; konkurencja to stare pojedyncze artykuły |
| 11 | Canonical na wszystkich stronach, filtry `?start=1` z canonical na `/biegi` (T1 z audytu) | średni | bardzo niski | duplikaty kalendarza rozmywają siłę, której i tak mamy mało |
| 12 | Strony odbytych biegów: baner "edycja odbyła się, kolejna: [link/termin nieznany]", `eventStatus`, przekierowanie 301 ze starej edycji na nową, gdy nowa ma stronę | średni | średni | 34 slugi z 2025 i większość z 2026 to po sezonie thin content; kalendarzbiegowy i biegigorskie pokazują stare daty i tracą na tym |
| 13 | FAQ generowane z danych biegu (3-4 pytania) + FAQPage; FAQ na hubach | średni | niski | PAA w SERP; zawodybiegowe robi szablonowo, motivato na landingu |
| 14 | Strona "Dla organizatorów": co dajemy (karta biegu, ocena dla początkujących, link z UTM), jak zgłosić poprawkę, baner "Dobry na start" do wstawienia na stronę organizatora z linkiem zwrotnym | średni (linki) | niski | treningbiegacza, motivato, kalendarzbiegowy mają; to najtańsze źródło linków (sekcja 4) |
| 15 | Artykuł-metoda do `/czy-dam-rade` ("Ile czasu zajmie Ci bieg górski") + OG/udostępnianie wyniku | niski do średniego | niski | w polskim SERP nie ma kalkulatora górskiego z limitem; frazy niszowe, ale bez konkurencji |

Kolejność wykonania: 1-4 w jednym tygodniu (same zmiany w szablonach, zero nowej treści), potem 8 i 11 (godzina), potem 5-7 i 9 (generowane z bazy), 10 i 13, na końcu 12, 14, 15.

## 4. Linki: skąd realnie wziąć pierwsze

| Źródło | Jak | Szansa | Uwagi |
|---|---|---|---|
| Organizatorzy biegów, do których linkujemy z UTM (ok. 250 stron) | po 4 tygodniach wyciągnąć z GA4/UTM, którzy organizatorzy dostają od nas kliknięcia; napisać do 20-30 najmniejszych (lokalne stowarzyszenia, kluby) z propozycją: "Wasz bieg ma u nas zieloną ocenę 'dobry na start', tu baner/odznaka do wstawienia" | wysoka | mali organizatorzy mają strony na WordPressie/FB i chętnie wstawiają odznaki; duzi (Rzeźnik, Łemkowyna) nie odpowiedzą |
| Strona "Dla organizatorów" + formularz "Dodaj bieg" | organizator, który sam dodaje bieg, dostaje link do swojej karty i prośbę o link zwrotny | średnia | tak robią kalendarzbiegowy i motivato |
| Forum bieganie.pl, dział "Górskie i ultra" (bieganie.pl/forum/viewforum.php?f=15) | odpowiadać w wątkach "jaki bieg na początek", "czy dam radę w limicie" linkiem do konkretnego biegu albo kalkulatora; profil z linkiem w stopce | średnia | link nofollow, ale ruch i sygnał; nie spamować, 1-2 wpisy tygodniowo z realną odpowiedzią |
| Grupy i strony FB: BiegiGórskiePL, Śląskie Biegi Górskie, Team Kingrunner Ultra, Forum Górskie, grupy regionalne ("Biegi górskie Beskidy", "Trail Beskid Niski") | post "zrobiłem kalendarz z oceną dla początkujących + kalkulator czy dam radę"; odpowiedzi w wątkach "pierwszy bieg" | średnia (ruch, nie link) | FB nie daje linku do SEO, ale daje pierwszych użytkowników i udostępnienia na blogi |
| Blogi trailowe: biegowe.pl (dział biegi górskie), runandfly.pl, drogadotokio.pl, maratongorski.pl, biegamwgorach.pl, lepiejbiegac.pl, pannaannabiega.pl, runandtravel.pl, trail-running.pl, siwejka.pl | mail z konkretem: "macie wpis o pierwszym biegu górskim, u nas jest narzędzie, które liczy czas vs limit; może się przyda czytelnikom"; zaproponować gościnny wpis "10 biegów na debiut 2027" | średnia | blogi hobbystyczne linkują chętniej niż portale; 1 na 5 odpowie |
| Portale górskie i lokalne: portalgorski.pl, portaltatrzanski.pl, tatromaniak.pl, krosno24.pl, atrakcjekrynicy.pl, lokalne portale miast-gospodarzy biegów | notka "powstał kalendarz biegów górskich dla początkujących" albo linkowanie z artykułu o lokalnym biegu | niska do średniej | lokalne portale piszą o każdym biegu w okolicy; podesłać im kartę biegu z danymi |
| Katalogi i agregatory biegowe: kalendarzbiegowy.pl, treningbiegacza.pl, motivato.pl ("dla organizatorów"), zawodybiegowe.pl, biegowyzawod.pl, ligabiegowa.pl, running.life | nie dodają linków do konkurencyjnych kalendarzy; sens tylko jako "patronat/partner" przy własnym wydarzeniu, co nie dotyczy nas | niska | odpuścić |
| Wikipedia | nie | brak | zgodnie z założeniem |
| Kluby biegowe i sekcje trailowe (strony klubów, "polecane strony") | mail do 20 klubów górskich (Beskidy, Sudety, Kraków, Śląsk) z linkiem do huba regionu | średnia | kluby mają zakładki "linki", stare, ale indeksowane |
| Własne profile: GitHub repo (jeśli publiczne), LinkedIn Piotra, profil na bieganie.pl, Strava club | link w opisie | pewna, niska wartość | sygnał istnienia domeny |

## 5. Search Console po 4 tygodniach (ok. 7.11.2026)

| Co obserwować | Gdzie | Czego oczekiwać / próg alarmu |
|---|---|---|
| Indeksacja: liczba zindeksowanych vs w mapie witryny | Strony > Indeksowanie | po poprawce N1 i canonical: >220 z 253; jeśli nadal <190, lista wciąż nie jest linkowana albo canonical źle |
| Zapytania z nazwą biegu + rok: CTR i pozycja po zmianie tytułu (działanie 2) | Skuteczność > Zapytania, filtr "2027" | CTR z 0-2% na 5-10% przy pozycji 5-10; jeśli zostaje <3%, tytuł nadal nie obiecuje terminu/zapisów |
| Zapytania "[nazwa] zapisy", "[nazwa] limit czasu", "[nazwa] trasa" | Zapytania, filtr "zapisy" / "limit" | pojawienie się nowych fraz z tych grup = strona biegu odpowiada na intencję |
| Pierwsze wyświetlenia na frazach ogólnych: "biegi górskie dla początkujących", "biegi trailowe Beskidy", "biegi górskie listopad 2026", "kalendarz biegów górskich 2027" | Zapytania, filtr "początkując", nazwy pasm, miesięcy | po 4 tygodniach od publikacji hubów: wyświetlenia na pozycjach 20-50; brak = huby niezindeksowane albo bez linków z nawigacji |
| Strony hubów (`/biegi/<pasmo>`, `/biegi/dla-poczatkujacych`, `/biegi/<rok>/<miesiac>`) | Skuteczność > Strony | każdy hub ma mieć >0 wyświetleń; huby z zerem sprawdzić w "Sprawdź URL" |
| Słownik i strony pojęć: "d+", "cutoff", "sprzęt obowiązkowy" | Zapytania | "d+" już jest; po rozbiciu słownika oczekiwać "co to d+", "przewyższenie d+" |
| Narzędzia `/czy-dam-rade`, `/kreator` | Strony | prawdopodobnie nadal blisko zera z wyszukiwarki; ruch do nich ma iść z linków wewnętrznych (mierzyć w GA4), nie z SERP |
| Wyniki rozszerzone Event | Ulepszenia > Wydarzenia (pojawi się po poprawce schema) | 0 błędów; liczba prawidłowych elementów rosnąca z indeksacją |
| Linki | Linki > Zewnętrzne | pierwsze 5-10 domen odsyłających (organizatorzy, blogi); zapisać, które przyszły z akcji z sekcji 4 |
| Strony odbytych biegów | Strony, sortowanie po wyświetleniach | jeśli stare edycje (2025) dostają wyświetlenia na "[nazwa] 2027", to sygnał do 301 na nową edycję albo banera z linkiem |

Dodatkowo raz w tygodniu: eksport zapytań z wyświetleniami i pozycją 8-20 (strefa "jeden krok od pierwszej strony") i dopisanie brakującego słowa do tytułu/leadu odpowiedniej strony.

## Źródła (odczyt 10.10.2026)

Konkurenci i strony odczytane bezpośrednio:
- https://treningbiegacza.pl/kalendarz-biegow/biegi-gorskie
- https://treningbiegacza.pl/kalendarz-biegow
- https://treningbiegacza.pl/kalendarz-biegow/biegi-gorskie-chorzow
- https://treningbiegacza.pl/kalendarz-biegow/chorzowska-dycha-chorzow
- https://treningbiegacza.pl/kalendarz-biegow/biegi-przelajowe
- https://www.biegigorskie.pl/kalendarz-2027/
- https://www.biegigorskie.pl/szczegolowy-kalendarz/beskidy-ultra-trail-2/
- https://www.biegigorskie.pl/o-biegach-gorskich/jaki-bieg-gorski-na-poczatek-jak-sie-przygotowac/
- https://www.biegigorskie.pl/o-biegach-gorskich/poradnik-poczatkujacego-gorala/
- https://www.biegigorskie.pl/news/najlepsze-trasy-na-biegi-gorskie-w-polsce/
- https://kalendarzbiegowy.pl/
- https://kalendarzbiegowy.pl/biegi/beskidy-ultra-trail/
- https://kalendarzbiegowy.pl/kalendarz-biegow-gorskich/
- https://motivato.pl/kalendarz-biegowy/biegi-gorskie/
- https://motivato.pl/biegi-gorskie/
- https://motivato.pl/biegi/ultrakotlina/
- https://zawodybiegowe.pl/biegi-gorskie
- https://zawodybiegowe.pl/gorce-ultra-trail-12km
- https://www.kingrunner.com/biegi
- https://www.kingrunner.com/bieg/ultrakotlina-15/4183
- https://www.maratonypolskie.pl/mp_index.php?dzial=3&action=1&grp=13
- https://elektronicznezapisy.pl/62/bieg-gorski.html
- https://elektronicznezapisy.pl/48/bieg-przelajowy.html
- https://www.online.datasport.pl/src/zawody.php
- https://b4sportonline.pl/ i https://b4sportonline.pl/LemkowynaUltraTrail/
- https://www.finishers.com/pl/d/europa/spots/polskie-gory
- https://www.finishers.com/pl/biegi-w-karkonoszach/traile-w-karkonoszach
- https://www.pzla.pl/biegi-gorskie
- https://plaskiejestnudne.pl/ , /biegi , /bieg/meble-wojcik-ultra-wysoczyzna-2025-05-09 , /kreator , /czy-dam-rade , /slownik , /sitemap.xml , /robots.txt

Poradniki i narzędzia widoczne w SERP:
- https://bieganie.pl/trening/pierwszy-bieg-gorski-co-musisz-wiedziec/
- https://bieganie.pl/sport/biegi-gorskie/jaki-dystans-dla-biegacza-debiutujacego-w-gorach/
- https://bieganie.pl/sport/jak-wybrac-bieg-gorski-pod-wlasne-mozliwosci-jak-przeliczyc-gorski-dystans-na-plaski/
- https://bieganie.pl/sport/punkty-itra/
- https://bieganie.pl/trening/pierwszy-plan-treningowy-pod-bieg-trailowy-przygotuj-sie-do-startu-w-gorach/
- https://poradnikbiegowy.pl/wyposazenie-obowiazkowe-bieg-gorski/
- https://poradnikbiegowy.pl/biegi-gorskie/
- https://poradnikbiegowy.pl/trail-running-od-czego-zaczac-przejscie-z-asfaltu-w-teren/
- https://biegigorskiegdynia.pl/slownik-nizinnego-trailowca-co-to-sa-przewyzszenia-vertical-i-grania/
- https://brubeck.pl/blog/zdobadz-szczyt-biegi-gorskie-dla-poczatkujacych/
- https://www.decathlon.pl/c/htc/bieganie-po-gorach-jak-zaczac-trenowac-do-biegow-gorskich_db9f6ab4-308a-4426-881c-5c3a6c558f2c
- https://8a.pl/8academy/bieganie-po-gorach-jak-zaczac/
- https://8a.pl/8academy/kije-do-biegania-po-gorach/
- https://www.skalnik.pl/blog/biegi-gorskie-przygotowanie-i-wyposazenie/
- https://www.skalnik.pl/blog/5-najlepszych-biegow-gorskich-w-sudetach/
- https://sportnovia.pl/blog/post/jak-przygotowac-sie-do-biegu-gorskiego-poradnik-trailowy
- https://treningbiegacza.pl/kalkulator-biegowy
- https://kalkulatorbiegu.pl/ , https://racepace.pl/kalkulator-biegowy/ , https://kalkulato.pl/kalkulatory/trening/kalkulator-czasu-biegu/ , https://biegnijmy.pl/kalkulator
- https://webp.pl/kalkulator-chodzenia-po-gorach
- https://www.festiwalbiegowy.pl/aktualnosci/punkty-itra-bardzo-wazne-czy-mam-je-w-nosie-tylko-dla-utmb-sonda
- https://findbed.pl/blog/jak-nie-ultra-trail-to-co-lista-hardkorowych-biegow-gorskich
- https://world.nessi-sport.com/12-biegow-ultra-polecanych-w-polsce

Biegi, zapisy, organizatorzy:
- https://www.biegrzeznika.pl/bieg-rzeznika/ , /maraton-rzeznika/ , /rzeznik-ultra/ , /rzezniczek/
- https://www.biegigorskie.pl/news/nowy-termin-i-zapisy-na-bieg-ultra-grania-tatr/
- https://www.ultralemkowyna.pl/zgloszenia
- https://biegowe.pl/2026/06/korona-polskich-ultramaratonow-bieg-7-dolin-wypada-ultra-wysoczyzna-dolacza.html
- https://www.kingrunner.com/artykul/mistrzostwa-polski-w-biegach-gorskich-i-trailowych-na-2026-rok/1311
- https://krosno24.pl/wydarzenia/lemkowyna-winter-trail-2026-biegi-w-beskidzie-niskim-w972
- https://www.atrakcjekrynicy.pl/kalendarz-wydarzen2506-21295.html
- https://www.siwejka.pl/biegi-gorskie-w-beskidzie-niskim.html
- https://portaltatrzanski.pl/aktywnosci/biegi-gorskie/zawody-biegowe-na-terenie-tatr,1036
- https://www.portalgorski.pl/sporty-gorskie/biegi-gorskie

Społeczności i blogi (kandydaci na linki):
- https://bieganie.pl/forum/viewforum.php?f=15
- https://www.facebook.com/biegigorskiepl/ , https://www.facebook.com/slaskiebiegigorskie/ , https://www.facebook.com/groups/teamkingrunnerultra , https://www.facebook.com/ForumGorskie/
- https://biegowe.pl/category/biegi-gorskie , https://runandfly.pl/ , https://drogadotokio.pl/ , https://maratongorski.pl/ , https://biegamwgorach.pl/blog/ , https://lepiejbiegac.pl/ , https://pannaannabiega.pl/ , https://runandtravel.pl/ , https://trail-running.pl/
- https://kalendarzbiegowy.pl/dodaj-bieg-do-kalendarza/ , https://motivato.pl/dla-organizatorow/ , https://www.biegowyzawod.pl/ , https://ligabiegowa.pl/kalendarz , https://running.life/running-calendar/poland

Dane własne: Google Search Console plaskiejestnudne.pl, okno 29.09-06.10.2026 (cytowane za `docs/seo_audit_2026-10.md`).
