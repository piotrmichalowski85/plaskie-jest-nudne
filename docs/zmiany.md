# Zmiany funkcji (dziennik techniczny)

> Dziennik "Co nowego" na stronie (`/zmiany`) pokazuje tylko zmiany w danych. Tu zapisujemy zmiany funkcji serwisu, po jednym wpisie na pozycję backlogu.

## Batch 2 (08.11.2026, gałąź `batch2`)

- **#1 Szerszy wyciąg z regulaminów.** Nowy skrypt `scripts/regulamin_llm.ts` (ten sam automat co sprzęt, `claude -p`, wpięty w `scripts/weekly_gear.sh`) zapisuje do `data/regulamin_info.json`: limity czasu per dystans, opłaty i progi cenowe, godziny startu, biuro zawodów, bufety, kije, pies, bieg dla dzieci. Nakładane przy buildzie w `lib/data.ts` (races.json bez zmian): limity uzupełniają brakujące `limitH`, reszta w `Race.info` (`stale`, gdy regulamin dotyczy innej edycji). Strona biegu: sekcja "Z regulaminu", 5 nowych pytań w FAQ, cena w meta description i `offers.price` (tylko regulamin tej samej edycji). Kalendarz: filtry "Z kijami", "Z psem", "Bieg dla dzieci" (także `?kije=1&pies=1&dzieci=1`). Karta: "od N zł". Pierwsze wypełnienie 08.11: 54 regulaminy (sesja `claude` CLI wygasła, ekstrakcja tym samym promptem przez agentów, import `--import`).
