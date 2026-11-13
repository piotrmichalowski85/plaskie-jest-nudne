# Raport cen: jak powstaje zbiór `data/raport_ceny.json`

Raport "Ile kosztuje bieg górski i trailowy w Polsce" (`/raporty/ile-kosztuje-bieg-gorski`) liczy się z zamrożonego zbioru, a nie z bieżącego `data/regulamin_info.json`. Wyciągi z regulaminów robi automat (LLM) i bez sprawdzenia nie nadają się do cytowania.

## Kroki (edycja 13.11.2026, stan danych: commit d7890c8)

1. Lista regulaminów: pary bieg-regulamin z `fit: true` (`data/regulamin_fit.json`), w których wyciąg ma pole `fees`. W 2026: 61 regulaminów, 908 wierszy z cenami.
2. Weryfikacja ręczna z tekstu regulaminu (`data/.regulaminy_text/<sha1 adresu>.txt`, poza gitem): każdy regulamin czytany we fragmentach z opłatami (`ex.py fees <sha>`), każdy wiersz automatu dostaje werdykt (zgodne, błędne, poza zakresem, brak w tekście), a cennik startów indywidualnych dorosłych jest spisywany od zera z dosłownym cytatem. Zasady i format: `brief_weryfikacji.md`. Wyniki: `.weryfikacja/out/<sha>.json` (katalog roboczy, poza gitem).
3. Kontrola mechaniczna: cytat musi być dosłownym wycinkiem tekstu, a każda kwota musi stać w cytacie. Dodatkowo druga osoba czyta próbkę oraz wszystkie cenniki biegów wymienianych w raporcie z nazwy.
4. Składanie zbioru: `python3 scripts/raport_ceny/zbuduj_zbior.py` (zasady włączenia, decyzje ręczne z powodem, dopasowanie dystansu do kalendarza). Wynik: `data/raport_ceny.json` (rekordy z adresem regulaminu i cytatem) oraz `data/raport_ceny_weryfikacja.json` (werdykty per regulamin, błędy automatu, cenniki odrzucone z powodem).
5. Liczby: `npx tsx scripts/raport_ceny.ts` (wzory w nagłówku skryptu; te same funkcje liczą stronę i CSV: `lib/raport-ceny.ts`).

## Za rok

Powtórzyć kroki 1-5 na nowych regulaminach, poprzedni zbiór zachować pod nazwą z rokiem (`data/raport_ceny_2026.json`); dopiero wtedy wolno porównywać rok do roku, i tylko dla tych samych imprez i dystansów.
