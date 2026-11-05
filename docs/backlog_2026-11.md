# Backlog batch 2 (decyzja Piotra 04.11.2026)

> Źródło: `docs/usprawnienia_2026-11.md` (research 04.11). Piotr wybrał pozycje 1, 3, 5, 6, 7, 8 oraz z pakietu higieny (#10) manifest i dostępność. Realizacja: kolejna sesja plaskie, bez udziału Piotra poza punktami oznaczonymi "Piotr".
> Pominięte świadomie: #2 newsletter, #4 "Moje biegi", #9 feedy i API, z #10 Vercel Web Analytics i tryb ciemny.

| Kolejność | # | Zakres | Szacunek | Udział Piotra |
|---|---|---|---|---|
| 1 | 1 | Szerszy wyciąg z regulaminów (ten sam automat co sprzęt): limit czasu per dystans, opłata i progi cenowe, godzina startu, biuro zawodów, bufety, kije, pies, bieg dla dzieci. Nowe pola w `Race`, FAQ, meta description, `offers.price`, filtry "z kijami / z psem / z biegiem dla dzieci" | 3-4 h | brak |
| 2 | 3 | Feedy iCal: `/kalendarz.ics` cały, per hub (`/biegi/pasmo/beskidy.ics`, `/biegi/dla-poczatkujacych.ics`), `VALARM` "zapisy do" i "tydzień przed startem"; przyciski "subskrybuj w kalendarzu" na hubach i kalendarzu | 1-2 h | brak |
| 3 | 5 | Odchudzenie payloadu: DTO karty zamiast pełnego biegu dla `/biegi`, hubów, kreatora i "czy dam radę"; `/data/races.lite.json` z nagłówkiem immutable; cel `/biegi` poniżej 150 KB HTML | 2-3 h | brak |
| 4 | 7 | Strony programatyczne z realną listą (min. 3 biegi): `/biegi/2027`, `/biegi/blisko/<miasto>` (Kraków, Wrocław, Katowice, Bielsko-Biała, Warszawa, Gdańsk, Rzeszów; promień 100 km), `/biegi/ten-weekend`; po #1 także `/biegi/z-kijami`, `/biegi/z-psem`, `/biegi/z-biegiem-dla-dzieci`, `/biegi/zimowe` | 2-3 h | brak |
| 5 | 8 | Pogoda na stronie biegu: prognoza Open-Meteo do 16 dni + "typowa pogoda w tym terminie" z 10 lat (okno +-7 dni), liczone w odświeżaniu (GitHub Actions), nie w runtime; atrybucja CC BY 4.0 | 2-3 h | brak |
| 6 | 6 | Strona `/dla-organizatorow` + odznaka SVG "dobry na start" z linkiem + widget `/embed?pasmo=...&limit=5` + snippet do wklejenia | 3-4 h | maile do 20-30 organizatorów (Piotr, po gotowej stronie; szkice maili pisze zespół) |
| 7 | 10 (część) | Manifest: `app/manifest.ts`, `theme-color`, ikony na ekran startowy. Dostępność: skip-link, `prefers-reduced-motion` dla tickera, kontrasty i focus na filtrach, `robots: max-image-preview:large` | 1-1,5 h | brak |

Razem: ok. 15-20 h pracy zespołu, 0 h Piotra poza mailami do organizatorów (osobne zadanie, gdy strona będzie gotowa).

## Zasady realizacji
- Każda pozycja = osobny commit i wpis w `docs/zmiany` (dziennik "Co nowego" pokazuje tylko zmiany w danych; zmiany funkcji opisujemy w commit message).
- Po #1 uruchomić ponownie `scripts/weekly_gear.sh` ręcznie, żeby nowe pola wypełniły się od razu, nie dopiero we wtorek.
- Po #5 i #7 sprawdzić Lighthouse lokalnie (`npx lighthouse`) i rozmiar HTML `/biegi` przed i po.
- Po #4 dopisać nowe huby do `app/sitemap.ts` i nawigacji `/biegi`.
