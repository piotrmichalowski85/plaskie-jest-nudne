# Weryfikacja opłat startowych z regulaminów (brief dla weryfikatora)

Cel: raport dla mediów "Ile kosztuje bieg górski w Polsce". Automat (LLM) wyciągnął z regulaminów progi cenowe; wiemy, że się mylił. Twoje zadanie: dla każdego regulaminu ze swojej partii przeczytać w TEKŚCIE regulaminu fragment o opłatach i (1) ocenić każdy wiersz automatu, (2) spisać od zera prawdziwy cennik startów indywidualnych dorosłych. Liczy się wyłącznie to, co stoi w tekście. Niczego nie zgadujesz, niczego nie bierzesz z pamięci ani z internetu. Nie otwierasz stron www. Niczego nie zmieniasz poza zapisem swoich plików wyniku.

## Narzędzia

Teksty regulaminów to pliki jednowierszowe, więc czytaj je pomocnikiem (Bash):

```
python3 ~/Claude/plaskie-raport/.weryfikacja/ex.py batch N            # twoja partia: sha, url, races, autoYear, autoFees (z idx)
python3 ~/Claude/plaskie-raport/.weryfikacja/ex.py fees SHA           # początek tekstu + wszystkie fragmenty z kwotami/opłatami, z pozycjami znaków
python3 ~/Claude/plaskie-raport/.weryfikacja/ex.py slice SHA A B      # znaki A..B
python3 ~/Claude/plaskie-raport/.weryfikacja/ex.py grep SHA 'regex'   # okna wokół dopasowań (np. 'dystans|trasa', 'termin|odbęd')
```

Pracuj regulamin po regulaminie: `fees SHA`, przeczytaj, w razie potrzeby dociągnij `slice` albo `grep` (np. żeby ustalić długość tras w km, datę imprezy, rok edycji). Werdykt wydajesz po przeczytaniu fragmentu, nie na podstawie dopasowania wzorca. Uwaga: tabele z PDF i stron bywają spłaszczone do jednego ciągu (najpierw nagłówki kolumn, potem kwoty); rozplącz je uważnie, a gdy przypisanie kwot do dystansów albo terminów nie jest jednoznaczne, napisz to w `notes` i ustaw `confidence: "niska"`.

## Zasady włączenia (co jest "cennikiem" w raporcie)

- Tylko STARTY INDYWIDUALNE DOROSŁYCH w biegu (także bieg pod górę / vertical, bieg etapowy liczony jako jedna opłata).
- Poza raportem (wpisz do `excluded` z powodem): biegi dzieci i młodzieży, sztafety i drużyny, starty "w parze"/duety (gdy cena jest za parę albo wariant jest osobny), bieg z psem (canicross, dogtrekking), nordic walking, marsze i rajdy piesze, rower, pakiety na cały cykl / karnety na kilka biegów, pakiety VIP i charytatywne z dopłatą, opłaty dodatkowe (koszulka, medal, posiłek, nocleg, depozyt, zmiana dystansu, przepisanie pakietu, ubezpieczenie, kaucja za chip).
- Zniżki (mieszkańcy gminy, klubowicze, seniorzy, służby, Karta Dużej Rodziny, uczestnicy poprzednich edycji, kody rabatowe) pomijamy: bierzemy cenę podstawową dla zwykłej osoby. Jeżeli opłata dla wszystkich wynosi 0 zł (bieg bezpłatny), to jest to normalny cennik z `pln: 0`.
- Gdy ten sam dystans ma wariant "z koszulką/pakiet rozszerzony" i "bez koszulki/pakiet podstawowy": bierzemy pakiet podstawowy, a w `note` cennika piszesz, co pominięto.
- Progi: każdy próg to kwota i termin, do którego obowiązuje (`until`, YYYY-MM-DD, włącznie). "Od 01.11 do 30.11" daje until 30.11. Próg ostatni bez daty końcowej ("po 31.10", "do wyczerpania limitu") ma `until: null`. Próg ograniczony liczbą miejsc zamiast datą ("pierwsze 100 osób", "pakiety 1-200") ma `until: null` i `limitPlaces: 100`. Opłata płatna dopiero w biurze zawodów / w dniu startu ma `onsite: true` (jeśli ta sama kwota obowiązuje online od jakiejś daty i w biurze, to `onsite: false`, a o biurze wspomnij w note).
- Rok w datach progów bierz z tekstu; jeżeli tekst podaje dzień i miesiąc bez roku, wywnioskuj rok z daty imprezy i zaznacz to w `notes`.
- Dystans: `km` to długość trasy podana w regulaminie (liczba). Jeżeli regulamin nazywa trasę tylko nazwą (np. "Rzeźniczek", "Maraton") i nigdzie nie podaje km, ustaw `km: null` i podaj `name`; nie zgaduj. "Półmaraton" i "maraton" bez liczby km też dają `km: null` (nazwa w `name`).
- Regulamin może dotyczyć kilku imprez albo kilku terminów (cykl). Spisz cennik pojedynczego startu; w `notes` opisz, o który bieg/termin chodzi.

## Ocena wierszy automatu (`autoChecks`, po jednym wpisie na każdy `idx` z autoFees)

- `"zgodne"`: kwota, dystans i termin zgadzają się z tekstem i wiersz dotyczy startu indywidualnego dorosłych (drobna różnica km wynikająca z zaokrąglenia nazwy trasy, np. 100 vs 103 km, to nadal zgodne; brak etykiety to nie błąd).
- `"bledne"`: wiersz dotyczy startu indywidualnego dorosłych, ale ma złą kwotę, zły dystans, zły termin albo zły rok w dacie. W `problem` napisz "było -> jest" i podaj `quote` (dosłowny fragment tekstu, który to pokazuje).
- `"poza_zakresem"`: kwota jest w tekście, ale to nie start indywidualny dorosłych (sztafeta, para, dzieci, NW, pakiet dodatkowy, zniżka, cykl) albo to cena z innej edycji. W `problem` napisz powód jednym zdaniem; ustaw `category`: jedno z `dzieci`, `sztafeta_druzyna`, `para`, `pies`, `nw_marsz`, `pakiet_dodatkowy`, `znizka`, `cykl`, `inna_edycja`, `inne`.
- `"brak_w_tekscie"`: takiej kwoty dla takiego dystansu w tekście nie ma (halucynacja albo cena spoza dostępnego tekstu).

Dodatkowo `missing`: progi i cenniki startów indywidualnych dorosłych, które są w tekście, a których automat nie wyciągnął (krótko: "50 km: brak progu 3: 320 zł do 30.04.2027").

## Format wyniku

Dla każdego regulaminu zapisz narzędziem Write plik `~/Claude/plaskie-raport/.weryfikacja/out/<sha>.json` (poprawny JSON, UTF-8, proste cudzysłowy w treściach zamień na apostrofy albo escapuj):

```json
{
  "sha": "...",
  "url": "...",
  "eventName": "nazwa imprezy z tekstu",
  "editionYear": 2027,
  "editionYearQuote": "dosłowny fragment, z którego wynika rok edycji",
  "eventDate": "2027-03-06",
  "eventDateEnd": "2027-03-07",
  "eventDateQuote": "dosłowny fragment z terminem imprezy",
  "feeSectionFound": true,
  "pricelists": [
    {
      "name": "nazwa trasy z regulaminu, np. Ultra 50",
      "km": 50,
      "kmQuote": "dosłowny fragment, z którego wynika długość trasy (albo null)",
      "raceDate": "2027-03-06",
      "tiers": [
        {"pln": 180, "until": "2026-11-30", "limitPlaces": null, "onsite": false},
        {"pln": 220, "until": "2027-01-31", "limitPlaces": null, "onsite": false},
        {"pln": 260, "until": null, "limitPlaces": null, "onsite": false}
      ],
      "quote": "DOSŁOWNY fragment tekstu z kwotami tego cennika (kopiuj znak po znaku z wyjścia ex.py, do ok. 500 znaków; przy spłaszczonej tabeli wklej cały ciąg z nagłówkami)",
      "note": "opcjonalnie: co pominięto, wątpliwości",
      "confidence": "wysoka"
    }
  ],
  "excluded": [{"what": "Bieg dzieci 500 m, 20 zł", "category": "dzieci"}],
  "autoChecks": [
    {"idx": 0, "verdict": "zgodne"},
    {"idx": 1, "verdict": "bledne", "problem": "było 50 km 200 zł do 2026-12-31 -> jest 220 zł do 2027-01-31", "quote": "..."},
    {"idx": 2, "verdict": "poza_zakresem", "category": "sztafeta_druzyna", "problem": "opłata za sztafetę 4-osobową"}
  ],
  "missing": ["..."],
  "notes": "wszystko, co ważne dla osoby liczącej raport: cennik obcięty, tekst urwany, dwa regulaminy w jednym pliku, VAT, opłata w euro itd."
}
```

Wymagania twarde:
- `quote`, `kmQuote`, `eventDateQuote`, `editionYearQuote` to DOSŁOWNE wycinki tekstu (będą sprawdzane automatem `in` na tekście regulaminu; nie poprawiaj spacji, literówek ani znaków). Kopiuj z wyjścia `ex.py`. Jeśli potrzebujesz dwóch odległych fragmentów, połącz je znakami ` [...] `.
- `raceDate` cennika = dzień startu tego dystansu, jeśli tekst go podaje; inaczej data imprezy.
- `confidence`: `wysoka` (jednoznaczne), `srednia` (drobna niepewność, opisana), `niska` (nie da się pewnie przypisać kwot; cennik nie wejdzie do raportu).
- Jeżeli regulamin w ogóle nie zawiera kwot (odsyła do strony zapisów), ustaw `feeSectionFound: false`, `pricelists: []`, a wiersze automatu oceń jako `brak_w_tekscie`.
- Jeżeli tekst jest regulaminem innej imprezy niż biegi z pola `races` albo innej edycji (rok), napisz to wyraźnie na początku `notes` (np. "INNA EDYCJA: tekst dotyczy 2024").
- Kwoty w tekście są brutto dla uczestnika; jeśli regulamin mówi co innego (netto, euro), zapisz w `notes`.

## Raport końcowy (krótki, w odpowiedzi)

Tabela: sha (8 znaków) | impreza | wierszy automatu | zgodne | bledne | poza_zakresem | brak_w_tekscie | brakujące | liczba cenników | uwagi. Plus 3-5 najciekawszych błędów automatu z "było -> jest". Bez opisywania procesu. Nie sprawdzonych regulaminów nie udawaj: jeśli któregoś nie zdążysz albo nie da się go ocenić, napisz to wprost.
