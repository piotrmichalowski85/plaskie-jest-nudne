# Automatycznie prowadzone profile plaskiejestnudne.pl na Facebooku i Instagramie: czy ma sens i ile kosztuje

> Analiza 04.11.2026 na prośbę Piotra ("przemyśl automatycznie prowadzone profile na FB i Insta, czy ma sens i jaki koszt"). Side project, poza kanonem B2B.

## Exec summary

Ma sens tylko w wąskiej roli: jako automatyczny "wyświetlacz" kalendarza (nowe biegi, otwarte zapisy, biegi w ten weekend), który istnieje po to, żeby serwis miał żywy profil, gdy ktoś go sprawdzi, żeby organizatorzy mieli kogo oznaczać i żeby Piotr miał gotowe posty do ręcznego wrzucenia do grup na Facebooku. Sam automat nie przyniesie ruchu: zasięg organiczny strony na Facebooku to ok. 1,5-2,5% obserwujących, a nowy profil ma zero obserwujących; jedyne miejsce, gdzie biegacze-amatorzy realnie czytają o biegach, to grupy na Facebooku, a do grup od kwietnia 2024 nie da się publikować przez API (Meta wyłączyła Groups API). Koszt: ok. 5-6 h budowy jednorazowo, 0 zł miesięcznie (Graph API Meta jest bezpłatne, grafiki renderujemy z naszego generatora obrazków OG), plus ok. 30 min Piotra na założenie strony FB, konta firmowego IG i aplikacji deweloperskiej Meta.

Rekomendacja: zrobić wariant minimum (automat 3 posty tygodniowo na FB Page + IG z naszych danych) tylko razem z jedną ręczną czynnością Piotra: raz w tygodniu, w poniedziałek, wkleić jeden z tych postów do 2-3 grup biegowych (ok. 10 min). Bez tej ręcznej części automat jest martwym profilem i nie warto go stawiać. Falsyfikator: po 8 tygodniach (do 11.01.2027) poniżej 20 sesji tygodniowo ze źródła social w Analytics albo poniżej 100 obserwujących łącznie: zostawiamy automat (nic nie kosztuje), ale Piotr przestaje poświęcać na to czas. Decyzja Piotra, bo dotyczy jego czasu i ruchu na zewnątrz w jego imieniu.

## 1. Co da się zautomatyzować z naszych danych (zero pisania ręcznego)

| Post | Źródło danych | Kadencja | Grafika |
|---|---|---|---|
| "Nowe biegi w kalendarzu" (3-6 kart) | `data/zmiany.json` (added) po odświeżeniu pon i czw | pon 9:00 | karuzela 1080x1350 z naszego renderera (mamy `opengraph-image.tsx` per bieg; wystarczy drugi format) |
| "Zapisy ruszyły: <bieg>" | `zmiany.json` (signupChanged → otwarte) | gdy się zdarzy, maks. 1 dziennie | pojedyncza karta biegu |
| "Biegi w ten weekend" | `races.json`, filtr sob-nd + 7 dni | czw 18:00 | karuzela |
| "Za tydzień mija termin zapisów" | `signupDeadline` | gdy się zdarzy | karta |
| "Bieg tygodnia dla początkujących" | nasz scoring (ocena, dystans, D+) | niedziela | karta + 3 zdania z FAQ biegu |
| Zmiana terminu / odwołanie | `zmiany.json` (dateChanged, removed) | gdy się zdarzy | karta z przekreślonym terminem |

Tekst postu: szablon z pól (nazwa, data, miasto, dystanse, limit, link). Bez LLM, bez "głosu Piotra", bez komentarza redakcyjnego: to komunikat kalendarza, podpisany "plaskiejestnudne.pl, kalendarz biegów górskich dla początkujących". Oznaczenie konta organizatora, jeśli znamy (później, ręcznie uzupełniana mapa organizator → konto IG/FB).

## 2. Jak technicznie

- **Facebook Page + Instagram (konto firmowe albo twórcy) połączone ze stroną.** Publikacja przez Graph API Meta: strona (`/{page-id}/photos`, `/feed`) i Instagram (`/{ig-user-id}/media` → `media_publish`, karuzele do 10 obrazów). Limit Instagrama: 100 publikacji na 24 h, nas dotyczy maks. kilka tygodniowo.
- **Uprawnienia:** `pages_manage_posts`, `instagram_business_content_publish`. Dla publikacji na własne konta, którymi administruje właściciel aplikacji, wystarczy aplikacja w trybie deweloperskim z Piotrem jako administratorem (bez App Review). App Review i weryfikacja firmy są potrzebne dopiero, gdy aplikacja ma publikować na cudzych kontach. Token: długoterminowy token strony (60 dni) albo token użytkownika systemowego z Business Managera (bez wygasania); odnawianie dopisujemy do automatu.
- **Gdzie działa:** ten sam automat, co odświeżenie kalendarza (GitHub Actions pon i czw) plus mały krok "weekend" w czwartek; sekrety w GitHub Secrets. Bez Buffera, Postiza ani innego pośrednika (Buffer darmowy ma 3 kanały i kolejkę 10 postów na kanał, ale niczego nam nie upraszcza, bo i tak musimy wygenerować treść i grafikę).
- **Grafika:** mamy już renderer obrazków OG per bieg (`app/bieg/[slug]/opengraph-image.tsx`, 1200x630). Potrzebny wariant 1080x1350 (karta) i 1080x1080 (karuzela), ten sam kod, inne wymiary; render w skrypcie przez satori/resvg albo przez pobranie z naszej strony.
- **Facebook Groups:** niemożliwe przez API od 2024 (Meta usunęła Groups API w v19). Zostaje ręczne wklejenie albo natywne planowanie w grupie przez administratora grupy. To jest jednocześnie jedyny kanał z realnym zasięgiem dla naszej grupy odbiorców.

## 3. Koszt

| Pozycja | Jednorazowo | Miesięcznie |
|---|---|---|
| Założenie strony FB, konta IG firmowego, aplikacji Meta, połączenie kont, tokeny | 30 min Piotra (konta są jego; ja nie zakładam kont) + 30 min zespołu | 0 |
| Generator grafik (2 formaty z istniejącego renderera) | 1,5 h | 0 |
| Generator tekstów z szablonów + logika "co dziś publikować" (bez duplikatów, bez postów, gdy nic się nie zmieniło) | 1,5 h | 0 |
| Publikacja przez Graph API + odnawianie tokena + log | 1,5 h | 0 |
| Utrzymanie (zmiany API Meta, wygaśnięcie tokena) | | ok. 15 min, głównie przy awarii |
| Opłaty | 0 zł | 0 zł (Graph API bezpłatne, GitHub Actions w limicie darmowym) |
| Ręczne wklejenie 1 postu tygodniowo do 2-3 grup FB (jedyna część, która daje ruch) | | ok. 40 min Piotra (4 x 10 min) |

Razem: ok. 5-6 h zespołu jednorazowo, 0 zł, 30 min Piotra na start i 10 min tygodniowo, jeśli wchodzi część ręczna.

## 4. Czy ma sens: argumenty

**Za**
- Profil istnieje "na wszelki wypadek": organizator, bloger albo biegacz, który trafi na serwis, znajdzie żywe konto, a nie pustkę. Organizatorzy mogą nas oznaczać i udostępniać nasze karty ich biegów (to tanie linki i zasięg w ich społeczności, spójne z pozycją 6 backlogu: strona dla organizatorów i odznaka).
- Koszt krańcowy po zbudowaniu jest zerowy: dane i grafiki już mamy, automat już chodzi dwa razy w tygodniu.
- Posty-karty są gotowym materiałem do grup: Piotr nie musi nic pisać, tylko udostępnić.
- Instagram jest miejscem, gdzie biegacze-amatorzy w Polsce faktycznie są (relacje z zawodów, profile organizatorów). Karta "biegi w ten weekend" ma szansę być zapisywana i udostępniana w relacjach, jeśli trafi do kogoś z zasięgiem.

**Przeciw**
- Zasięg organiczny strony na FB: ok. 1,5-2,5% obserwujących, nowy profil ma 0 obserwujących, więc przez miesiące automat pisze do nikogo. Instagram bez relacji, reelsów i interakcji też nie rozdaje zasięgu kontom publikującym same karty.
- Profil w 100% automatyczny wygląda jak bot: brak odpowiedzi na komentarze, brak zdjęć z tras, brak człowieka. Meta od 2025 obniża zasięg treściom nieoryginalnym i powtarzalnym; nasze karty są oryginalne (własne dane i grafika), ale są schematyczne, więc nie liczyć na algorytm.
- Jedyny kanał z zasięgiem (grupy) wymaga ręki Piotra i trzymania się regulaminów grup (część zakazuje "reklam" i linków; kalendarz bez reklam zwykle przechodzi, ale admini bywają różni).
- Ryzyko reputacyjne małe, ale istnieje: błąd w danych (zły termin) rozsiany automatycznie na trzy kanały zamiast jednej strony; stąd publikujemy tylko biegi z potwierdzonym terminem (bez `provisional`) i z linkiem do źródła.

## 5. Warianty

| Wariant | Co | Koszt | Kiedy ma sens |
|---|---|---|---|
| A. Nic | brak profili, zostaje strona i Google | 0 | gdy Piotr nie chce ani 10 min tygodniowo; Google i ChatGPT już dają ruch rosnący |
| B. Wyświetlacz (rekomendacja, tylko z ręczną częścią) | FB Page + IG, 3 posty/tydz automatem z danych; Piotr 1 post/tydz do 2-3 grup | 5-6 h raz, 10 min/tydz Piotra | gdy chcemy mieć obecność i materiał do grup bez pisania |
| C. Wyświetlacz + człowiek | jak B plus raz w tygodniu relacja/zdjęcie Piotra z gór albo krótki komentarz do "biegu tygodnia" | jak B plus 20-30 min/tydz Piotra | dopiero gdy B pokaże, że ktokolwiek to ogląda (falsyfikator po 8 tygodniach) |
| D. Tylko IG | pomija FB Page; ale IG API i tak wymaga połączonej strony FB, więc strona powstaje | jak B minus nic | bez sensu, strona FB jest darmowym dodatkiem |

## 6. Co trzeba rozstrzygnąć (Piotr)

1. Czy wchodzimy w wariant B z ręczną częścią (10 min tygodniowo), czy zostajemy przy A.
2. Jeśli B: nazwa profili (`plaskiejestnudne` na obu, do sprawdzenia dostępność) i czy profile podpisujemy Piotrem (twarz, "prowadzi Piotr Michałowski") czy anonimowo jako serwis. Rekomendacja: jako serwis, bez twarzy; to nie jest marka osobista i nie łączymy tego z profilem B2B.
3. Jeśli B: Piotr zakłada stronę FB, konto IG (firmowe) i aplikację w developers.facebook.com, dodaje mnie do konfiguracji przez Chrome; dalej robię sam.

## Źródła (odczyt 04.11.2026)
- Meta, Instagram Platform, Content Publishing (limit 100 publikacji / 24 h, wymóg konta firmowego lub twórcy i połączonej strony FB): https://developers.facebook.com/documentation/instagram-platform/content-publishing
- Deprecjacja Facebook Groups API (Graph API v19, usunięcie w 90 dni, kwiecień 2024): https://www.cloudcampaign.com/blog/important-notice-regarding-metas-deprecation-of-facebook-groups , https://community.make.com/t/due-to-the-deprecation-of-the-facebook-groups-api-we-make-will-be-discontinuing-our-facebook-groups-app/32624
- Zasięg organiczny stron FB ok. 1,65% obserwujących (Social Insider 2025, cytowane): https://profiletree.com/facebook-organic-reach/ ; benchmark 2026 ok. 1,25%: https://www.webtonic.io/blog/social-media-reach-statistics
- Buffer, plan darmowy: 3 kanały, kolejka 10 postów na kanał: https://buffer.com/pricing
- Wymogi App Review dla `instagram_business_content_publish` (produkcja, cudze konta): https://www.getphyllo.com/post/instagram-api-guide
