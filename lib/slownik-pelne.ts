/**
 * Pełne wersje trzech haseł słownika (UTMB Index i Running Stones, ITRA, vertical).
 * Zasady systemów (UTMB, ITRA, ISF) są wpisane w tekst po sprawdzeniu w źródłach pierwotnych 13.11.2026;
 * wszystkie liczby o biegach liczą się z bazy przy każdym buildzie (nic o kalendarzu nie jest wpisane na sztywno).
 * Linki w tekście: [etykieta](/adres) albo [etykieta](https://...), renderuje je strona hasła.
 */
import type { Race } from "./types";
import type { Block, Full } from "./slownik";
import { isVertical } from "./normalize";
import { fmtDate, fmtKm } from "./format";
import { predictMinutes } from "./predict";

type Dist = { e: Race["elevations"][number]; r: Race };

const num = (n: number, digits = 0) => n.toFixed(digits).replace(".", ",");
const hours = (h: number) => `${num(h, Number.isInteger(h) ? 0 : 1)} h`;
const plural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/** km-effort: 1 km za każdy kilometr trasy i 1 km za każde 100 m podejścia (ta sama definicja w UTMB i ITRA) */
const effort = (e: { km: number; dplus?: number }) => e.km + (e.dplus ?? 0) / 100;
const upcoming = (all: Race[], today: string) => all.filter((r) => r.dateEnd >= today).sort((a, b) => a.dateStart.localeCompare(b.dateStart));
const dists = (list: Race[]): Dist[] => list.flatMap((r) => r.elevations.map((e) => ({ e, r })));
const link = (r: Race) => `[${r.eventName.replace(/[[\]]/g, "")}](/bieg/${r.id})`;
const where = (r: Race) => `${fmtDate(r.dateStart, r.dateEnd)}, ${r.city}`;
const kmD = (e: Dist["e"]) => `${fmtKm(e.km)} i +${e.dplus} m`;
/** jedna pozycja na imprezę (cykle mają kilka edycji o tej samej nazwie) */
function uniqEvents<T extends { r: Race }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((x) => (seen.has(x.r.eventName) ? false : (seen.add(x.r.eventName), true)));
}
const dystansow = (n: number) => `${n} ${plural(n, "dystans", "dystanse", "dystansów")}`;
const biegow = (n: number) => `${n} ${plural(n, "bieg", "biegi", "biegów")}`;

/* ---------- UTMB Index i Running Stones ---------- */

/** kategorie UTMB World Series; przedziały km-effort orientacyjne (utmb.world/sports-system opisuje je słownie), stones = kamienie za ukończenie na imprezie cyklu i na Majorze */
const UTMB_CATS = [
  { k: "20K", min: 20, max: 50, range: "ok. 20-50", stones: "1 / 2" },
  { k: "50K", min: 50, max: 100, range: "ok. 50-100", stones: "2 / 4" },
  { k: "100K", min: 100, max: 170, range: "ok. 100-170", stones: "3 / 6" },
  { k: "100M", min: 170, max: Infinity, range: "powyżej 170", stones: "4 / 8" },
];
const utmbCat = (ef: number) => UTMB_CATS.find((c) => ef >= c.min && ef < c.max)?.k;
const isByUtmb = (r: Race) => /by utmb/i.test(`${r.eventName} ${r.name}`);

export function utmbRaces(all: Race[], today: string) {
  const up = upcoming(all, today);
  const long = up.filter((r) => r.elevations.some((e) => e.dplus && effort(e) >= 50));
  const list = uniqEvents([...long.filter(isByUtmb), ...long.filter((r) => !isByUtmb(r))].map((r) => ({ r }))).map((x) => x.r).slice(0, 8);
  return { heading: "Nadchodzące biegi z dystansem od 50 km-effort", note: "Długością odpowiadają kategoriom 50K, 100K i 100M. To, czy bieg jest zgłoszony do UTMB Index, sprawdź na stronie organizatora albo w wyszukiwarce na utmb.world: nie mamy tej informacji w bazie.", list };
}

export function utmbFull(all: Race[], today: string): Full {
  const up = upcoming(all, today);
  const allD = dists(up);
  const known = allD.filter((x) => x.e.dplus);
  const counts = UTMB_CATS.map((c) => known.filter((x) => utmbCat(effort(x.e)) === c.k).length);
  const tooShort = known.filter((x) => effort(x.e) < 20).length;
  const over20 = up.filter((r) => r.elevations.some((e) => effort(e) >= 20)).length;
  const byUtmb = up.filter(isByUtmb);
  const day = fmtDate(today);

  // przykład z bazy: kategoria 50K przy trasie krótszej niż 50 km (najpierw z biegu cyklu, jeśli jest w kalendarzu)
  const c50 = known.filter((x) => utmbCat(effort(x.e)) === "50K" && x.e.km < 50);
  const ex50 = c50.find((x) => isByUtmb(x.r)) ?? c50[0];
  const ex50Txt = ex50 ? ` Przykład z naszego kalendarza: ${kmD(ex50.e)} (${link(ex50.r)}) to ${num(effort(ex50.e))} km-effort, czyli kategoria 50K, choć trasa ma mniej niż 50 km.` : "";

  // dystanse na pierwszy wynik do indeksu: kategoria 20K na biegach z oceną "dobry na start"
  const first = uniqEvents(known.filter((x) => x.r.beginnerScore >= 4 && utmbCat(effort(x.e)) === "20K")).slice(0, 3);

  const blocks: Block[] = [
    { h: "Jak powstaje UTMB Index, krok po kroku" },
    { ol: [
      "Organizator zgłasza bieg do UTMB Index (dla organizatora jest to bezpłatne) i po zawodach przesyła komplet wyników. Wyniku nie da się dodać samodzielnie.",
      "Za każdy ukończony bieg dostajesz wynik punktowy (score). Ten wynik zależy od czasu na tej trasie w tej edycji, a nie od zajętego miejsca: model statystyczny porównuje czasy z wynikami tych samych osób na podobnych trasach, więc gdy w trudnych warunkach wszyscy biegną wolniej, punktacja pozostaje porównywalna.",
      "Indeks to średnia ważona maksymalnie pięciu najlepszych wyników z ostatnich 36 miesięcy. Najlepszy wynik waży najwięcej, a wyniki starsze niż 12 miesięcy liczą się słabiej.",
      "Indeks jest ważny, jeśli masz ukończony co najmniej jeden bieg z ostatnich 24 miesięcy. To samo dotyczy każdej kategorii osobno: żeby mieć ważny indeks 50K, potrzebujesz biegu kategorii 50K z ostatnich 24 miesięcy.",
      "Indeks przelicza się raz na dobę. Słaby bieg albo DNF (bieg nieukończony) go nie obniża, bo do średniej wchodzą tylko najlepsze wyniki; indeks spada sam z siebie, gdy wyniki się starzeją.",
    ] },
    { p: "Indeks pojawia się już po jednym ukończonym biegu, ale z lekko obniżoną wagą w porównaniu z indeksem osoby, która ma pięć wyników. Wynik biegu i indeks są na tej samej skali punktowej. Dla orientacji: w zasadach cyklu UTMB World Series wynik dający elicie bezpośrednią kwalifikację do finałów to 615-690 punktów u kobiet i 780-840 u mężczyzn, zależnie od kategorii. Na profilu w utmb.world jest wykres, który pokazuje indeks na tle innych osób tej samej płci, wieku i kraju." },

    { h: "Kategorie 20K, 50K, 100K i 100M: liczy się km-effort, nie kilometry" },
    { p: `Kategoria biegu wynika z km-effort, czyli z dystansu powiększonego o 1 km za każde 100 m podejścia. Przykład podawany przez UTMB: 50 km i 2500 m w górę to 75 km-effort.${ex50Txt} Biegi z pogranicza dwóch kategorii liczą się do indeksu w obu, o ile masz już w danej kategorii choć jeden wynik. Poniżej 20 km-effort (np. 15 km i +400 m, czyli 19) wynik nie jest liczony; nie dostają go też biegi typu Vertical Kilometer, biegi wirtualne i formuły typu backyard. Więcej o samym przewyższeniu: [co to jest D+](/slownik/przewyzszenie-d-plus).` },
    { table: {
      head: ["Kategoria", "Km-effort", "Running Stones: impreza cyklu / Major", "Dystanse w naszym kalendarzu"],
      rows: UTMB_CATS.map((c, i) => [c.k, c.range, c.stones, String(counts[i])]),
      note: `Przedziały km-effort są orientacyjne (UTMB opisuje je słownie); kategorię konkretnego biegu podaje jego strona w utmb.world. Ostatnia kolumna: dystanse nadchodzących biegów z naszego kalendarza, dla których znamy przewyższenie (${known.length} z ${allD.length}), stan na ${day}.`,
    } },

    { h: "Ile takich biegów jest w naszym kalendarzu" },
    { p: `Na ${day} mamy w kalendarzu ${biegow(up.length)} przed startem. ${over20} z nich ${plural(over20, "ma", "mają", "ma")} co najmniej jeden dystans powyżej 20 km-effort, czyli wystarczająco długi, żeby dać wynik do indeksu. ${tooShort} z ${known.length} dystansów z podanym przewyższeniem ${plural(tooShort, "ma", "mają", "ma")} mniej niż 20 km-effort: to typowe trasy na pierwszy start. Uwaga: w bazie nie mamy informacji, które biegi organizator zgłosił do UTMB Index. Sprawdzisz to na stronie biegu (logo UTMB Index) albo w wyszukiwarce biegów na utmb.world.` },
    ...(first.length ? [
      { p: `Dystanse z biegów z oceną "dobry na start", które długością mieszczą się w kategorii 20K (wynik do indeksu dadzą tylko wtedy, gdy organizator zgłosił bieg):` },
      { ul: first.map((x) => `${link(x.r)} (${where(x.r)}): ${kmD(x.e)}, czyli ${num(effort(x.e))} km-effort`) },
    ] as Block[] : []),

    { h: "Running Stones: losy do Chamonix" },
    { p: "Running Stone (dosłownie \"biegowy kamień\") to jeden los w losowaniu miejsc na finały cyklu UTMB World Series: biegi OCC (finał kategorii 50K), CCC (100K) i UTMB (100M), rozgrywane podczas UTMB Mont-Blanc w Chamonix. Poza kwalifikacją sportową (czołowe miejsca na imprezach cyklu) to jedyna droga na te trzy biegi." },
    { ul: [
      "Kamienie dostaje każda osoba, która ukończy bieg kategorii 20K, 50K, 100K albo 100M na imprezie cyklu UTMB World Series: odpowiednio 1, 2, 3 i 4 kamienie. Na imprezach z rangą Major jest ich dwa razy więcej: 2, 4, 6 i 8.",
      "Zwykły bieg z UTMB Index kamieni nie daje. Aktualizuje tylko indeks.",
      "Do losowania potrzebujesz co najmniej jednego kamienia zdobytego w ciągu dwóch lat przed zamknięciem zgłoszeń oraz ważnego indeksu: na OCC w dowolnej kategorii (20K, 50K, 100K lub 100M), na CCC w kategorii 50K, 100K lub 100M, na UTMB w kategorii 100K lub 100M.",
      "Każdy kamień to jeden dodatkowy los. Do losowania wchodzi się ze wszystkimi kamieniami naraz i tylko na jeden z trzech biegów w danej edycji.",
      "Kamienie się sumują i nie mają terminu ważności. Zerują się dopiero po wylosowaniu miejsca. Jeśli przez dwa lata nie masz ukończonego żadnego biegu cyklu, stare kamienie zostają, ale przed losowaniem trzeba zdobyć co najmniej jeden nowy.",
    ] },
    { p: "Szczegółowe warunki zapisów na UTMB Mont-Blanc 2027 organizator dopiero przygotowuje (stan na 13 listopada 2026). Zasady opisane wyżej pochodzą z obowiązującego regulaminu cyklu UTMB World Series; przed zapisem sprawdź je na [utmb.world](https://utmb.world/sports-system)." },

    { h: "Impreza cyklu UTMB World Series w naszym kalendarzu" },
    ...(byUtmb.length ? byUtmb.flatMap((r): Block[] => {
      const ds = r.elevations.filter((e) => e.dplus && effort(e) >= 20);
      return [
        { p: `W kalendarzu jest ${link(r)} (${where(r)}). Dopisek "by UTMB" w nazwie oznacza imprezę cyklu, czyli taką, na której zdobywa się Running Stones. Liczbę kamieni za każdy dystans organizator podaje na swojej stronie.${ds.length ? " Dystanse, dla których mamy przewyższenie:" : ""}` },
        ...(ds.length ? [{ ul: ds.map((e) => `${kmD(e)}: ${num(effort(e))} km-effort, kategoria ${utmbCat(effort(e))}`) }] : []),
      ];
    }) : [{ p: `Na ${day} nie mamy w kalendarzu nadchodzącej imprezy z dopiskiem "by UTMB" w nazwie. Listę imprez cyklu w Europie znajdziesz na utmb.world.` } as Block]),

    { h: "Na pierwszym starcie" },
    { ul: [
      "Przed pierwszym startem w górach indeks nie jest do niczego potrzebny. Organizatorzy krótkich biegów o niego nie pytają.",
      `Pierwszy bieg (do 15 km) ma często mniej niż 20 km-effort, więc wyniku do indeksu w ogóle nie daje. W naszym kalendarzu dotyczy to ${tooShort} z ${known.length} dystansów z podanym przewyższeniem.`,
      "Jeśli kiedyś zechcesz stanąć na starcie OCC, potrzebujesz minimum dwóch warunków: ważnego indeksu w dowolnej kategorii i jednego Running Stone z imprezy cyklu. Oba spełnisz, kończąc dystans 20K na biegu \"by UTMB\".",
      "Wynik trafia na profil sam, jeśli dane podane przy zapisie na bieg zgadzają się z kontem My UTMB. Gdy się różnią, powstaje osobny profil i wynik trzeba przypiąć do konta ręcznie.",
    ] },

    { h: "Najczęstsze nieporozumienia" },
    { ul: [
      "\"Running Stones przepadają po dwóch latach.\" Nie przepadają. Warunek jest inny: co najmniej jeden kamień musi pochodzić z ostatnich dwóch lat.",
      "\"Więcej kamieni to pewny start.\" Każdy kamień to kolejny los, a nie miejsce na liście startowej.",
      "\"Bieg z logo UTMB Index daje kamienie.\" Kamienie dają wyłącznie imprezy cyklu UTMB World Series. Bieg z UTMB Index aktualizuje tylko indeks.",
      "\"20K to bieg na 20 km.\" Kategoria wynika z km-effort, więc górska piętnastka z dużym przewyższeniem też może być biegiem 20K.",
      "\"Im wyższe miejsce, tym wyższy indeks.\" Miejsce nie ma znaczenia, liczy się czas porównany z wynikami na tej trasie.",
      "\"UTMB Index i ranking ITRA to to samo.\" To dwa osobne systemy dwóch organizacji. Do losowania na UTMB Mont-Blanc liczy się UTMB Index; o drugim systemie piszemy w haśle [ITRA](/slownik/itra).",
    ] },
  ];

  const faq: [string, string][] = [
    ["UTMB Index: co to jest?", "To liczba opisująca poziom sportowy osoby biegającej w terenie, liczona jako średnia ważona maksymalnie pięciu najlepszych wyników z ostatnich 36 miesięcy. Jest liczona osobno w kategoriach 20K, 50K, 100K i 100M oraz jako indeks ogólny."],
    ["Jak zdobyć UTMB Index?", "Wystarczy ukończyć jeden bieg o długości co najmniej 20 km-effort, który organizator zgłosił do UTMB Index albo który należy do cyklu UTMB World Series. Wyniki przesyła organizator, a indeks pojawia się na profilu w utmb.world."],
    ["Jak długo jest ważny UTMB Index?", "Indeks jest ważny, dopóki masz ukończony co najmniej jeden bieg z ostatnich 24 miesięcy (osobno w każdej kategorii). Do obliczeń wchodzą wyniki z ostatnich 36 miesięcy."],
    ["Ile Running Stones trzeba mieć, żeby wziąć udział w losowaniu na UTMB?", "Co najmniej jeden, zdobyty w ciągu dwóch lat przed zamknięciem zgłoszeń, plus ważny UTMB Index w kategorii 100K lub 100M. Każdy kolejny kamień to dodatkowy los w losowaniu."],
    ["Czy Running Stones tracą ważność?", "Nie. Sumują się bez terminu ważności i zerują dopiero po wylosowaniu miejsca. Trzeba tylko mieć co najmniej jeden kamień z ostatnich dwóch lat."],
  ];
  return { blocks, faq };
}

/* ---------- ITRA ---------- */

/** ITRA Endurance Points: dolna granica km-effort dla 0, 1, ... 6 punktów (tabela z itra.run/FAQ/Organizers) */
const ITRA_MIN = [0, 25, 45, 75, 115, 155, 210];
const ITRA_RANGE = ["0-24", "25-44", "45-74", "75-114", "115-154", "155-209", "210 i więcej"];
const itraPoints = (ef: number) => ITRA_MIN.reduce((p, min, i) => (ef >= min ? i : p), 0);

export function itraRaces(all: Race[], today: string) {
  return { heading: "Nadchodzące biegi z dystansem od 25 km-effort", note: "Tyle trzeba na 1 punkt ITRA, licząc sam dystans i przewyższenie. Punkty przyznaje ITRA tylko biegom zgłoszonym przez organizatora: nie mamy tej informacji w bazie.", list: uniqEvents(upcoming(all, today).filter((r) => r.elevations.some((e) => e.dplus && effort(e) >= 25)).map((r) => ({ r }))).map((x) => x.r).slice(0, 8) };
}

export function itraFull(all: Race[], today: string): Full {
  const up = upcoming(all, today);
  const allD = dists(up);
  const known = allD.filter((x) => x.e.dplus);
  const byPts = ITRA_MIN.map((_, p) => known.filter((x) => itraPoints(effort(x.e)) === p));
  const zero = byPts[0].length;
  const pct = known.length ? Math.round((zero / known.length) * 100) : 0;
  const day = fmtDate(today);
  // limity czasu z całej bazy (także minione edycje): mediana na przedział punktów, pokazujemy od 5 dystansów
  const limits = ITRA_MIN.map((_, p) => dists(all).filter((x) => x.e.dplus && x.e.limitH && itraPoints(effort(x.e)) === p).map((x) => x.e.limitH!));
  const limitCell = (p: number) => (limits[p].length >= 5 ? `${hours(median(limits[p]))} (${limits[p].length})` : "za mało danych");
  // po jednym przykładzie na przedział 0-3 punktów, każdy z innej imprezy
  const used = new Set<string>();
  const examples = [0, 1, 2, 3].flatMap((p) => {
    const free = byPts[p].filter((y) => !used.has(y.r.eventName));
    const x = (p === 0 ? free.find((y) => y.r.beginnerScore >= 4 && !isVertical(y.e)) : undefined) ?? free[0]; // 0 punktów: najpierw bieg z oceną "dobry na start"
    if (!x) return [];
    used.add(x.r.eventName);
    return [`${p} ${plural(p, "punkt", "punkty", "punktów")}: ${link(x.r)} (${where(x.r)}), ${kmD(x.e)}, czyli ${num(effort(x.e))} km-effort`];
  });

  const blocks: Block[] = [
    { h: "Punkty ITRA (0-6): miara trudności biegu" },
    { p: "Punkty ITRA, w pełnej nazwie ITRA Endurance Points, opisują bieg, a nie osobę. Podstawą jest km-effort: każdy kilometr trasy liczy się jako 1, każde 100 m podejścia też jako 1. Bieg 20 km z +800 m ma więc 28 km-effort. Z tej liczby wynika liczba punktów od 0 do 6, taka sama dla każdej osoby, która dotrze do mety." },
    { table: {
      head: ["Punkty ITRA", "Km-effort", "Dystanse w naszym kalendarzu", "Mediana limitu czasu w naszej bazie"],
      rows: ITRA_MIN.map((_, p) => [String(p), ITRA_RANGE[p], String(byPts[p].length), limitCell(p)]),
      note: `Trzecia kolumna: dystanse nadchodzących biegów, dla których znamy przewyższenie (${known.length} z ${allD.length}), stan na ${day}. Czwarta: mediana limitu czasu dla dystansów z całej naszej bazy, w nawiasie liczba dystansów z podanym limitem. Liczymy sam km-effort, bez korekt ITRA opisanych niżej.`,
    } },
    { ul: [
      "Punkty dostają osoby kończące biegi, których organizator jest członkiem ITRA i przesłał ślad GPX trasy. Minimalna długość biegu w ITRA to 5 km-effort.",
      "Punkty nie uwzględniają trudności technicznej terenu, tylko dystans i przewyższenie.",
      "Gęste bufety obniżają ocenę, bo bieg wymaga wtedy mniej samodzielności. Przykład ITRA: 40 km i +1500 m to 55 km-effort, ale przy 6 punktach odżywczych odejmuje się 15, zostaje 40, czyli 1 punkt zamiast 2.",
      "Biegi etapowe dostają o jeden punkt mniej, niż wynikałoby z łącznego km-effort.",
      "Punkty przydają się przy zapisach: część organizatorów długich biegów wymaga określonej liczby punktów jako dowodu doświadczenia.",
    ] },

    { h: "Ile punktów dają biegi z naszego kalendarza" },
    { p: `Spośród ${known.length} dystansów nadchodzących biegów, dla których znamy przewyższenie, ${zero} (${pct}%) ${plural(zero, "ma", "mają", "ma")} mniej niż 25 km-effort, czyli 0 punktów. W bazie nie mamy informacji, które biegi faktycznie mają ocenę ITRA, bo zależy to od zgłoszenia organizatora. Sprawdzisz to na stronie biegu albo w kalendarzu na itra.run.` },
    ...(examples.length ? [{ p: "Przykłady z kalendarza (punkty policzone przez nas z samego km-effort):" }, { ul: examples }] as Block[] : []),

    { h: "Performance Index: ranking osób, krok po kroku" },
    { ol: [
      "Za każdy ukończony bieg, którego wyniki trafiły do ITRA, dostajesz wynik (Race Score) w skali do 1000, gdzie szczyt skali odpowiada teoretycznie najlepszemu możliwemu wynikowi. Czas porównuje się z trasą przeliczoną na płaski odpowiednik (dystans, podejścia i zejścia, wysokość nad poziomem morza), a potem koryguje współczynnikiem warunków, jednakowym dla wszystkich na tym biegu.",
      "Performance Index to średnia ważona maksymalnie pięciu najlepszych wyników z ostatnich 36 miesięcy. Biegi nieukończone nie są brane pod uwagę.",
      "Przez pierwsze 12 miesięcy wynik liczy się w pełni. Potem co pół roku jego waga lekko spada (0,995, 0,990, 0,985, 0,980), a po 36 miesiącach wynik wypada z obliczeń.",
      "Indeks pojawia się już po jednym biegu, ale przy mniej niż pięciu wynikach wagi są niższe (przy jednym wyniku 0,97), więc osoby z pięcioma startami mają lekką przewagę.",
      "Jest indeks ogólny, ze wszystkich dystansów, oraz osobne indeksy w kategoriach dystansu. Wszystkie przeliczają się codziennie.",
    ] },
    { p: "Z Performance Index powstaje światowy ranking ITRA, uznawany przez World Athletics. Dodanie biegu do kalendarza ITRA i przesłanie wyników jest dla organizatora bezpłatne, a ocena trasy w punktach to usługa dla organizatorów z płatnym członkostwem. Szczegóły obu systemów są na [itra.run](https://itra.run/FAQ/PerformanceIndex)." },

    { h: "Na pierwszym starcie" },
    { ul: [
      `Na pierwszy start punkty ITRA nie są potrzebne: ${zero} z ${known.length} dystansów w kalendarzu z podanym przewyższeniem to trasy na 0 punktów.`,
      "Wymóg punktów pojawia się przy długich biegach. Szukaj go w regulaminie w części o warunkach uczestnictwa.",
      "Sam km-effort przydaje się od razu: pozwala porównać bieg górski z płaskim. Tej samej logiki używa nasz kalkulator [Czy dam radę?](/czy-dam-rade).",
      "Wyniki z biegów zgłoszonych do ITRA trafiają na konto automatycznie, więc ranking buduje się przy okazji startów.",
    ] },

    { h: "Najczęstsze nieporozumienia" },
    { ul: [
      "\"Punkty ITRA to moje miejsce w rankingu.\" Punkty (0-6) opisują bieg. Ranking osób to Performance Index w skali do 1000.",
      "\"Więcej punktów to trudniejsza technicznie trasa.\" Punkty mierzą wytrzymałość: dystans i przewyższenie. Skał, błota i ekspozycji nie uwzględniają.",
      "\"Każdy bieg górski daje punkty ITRA.\" Tylko taki, którego organizator jest członkiem ITRA i zgłosił trasę do oceny.",
      "\"Punkty ITRA są potrzebne na UTMB.\" Do losowania na UTMB Mont-Blanc potrzebne są Running Stones i ważny [UTMB Index](/slownik/utmb-index-running-stones), a nie punkty ITRA.",
    ] },
  ];

  const faq: [string, string][] = [
    ["ITRA: co to jest?", "ITRA (International Trail Running Association) to międzynarodowe stowarzyszenie biegów trailowych. Prowadzi kalendarz biegów, bazę wyników i światowy ranking uznawany przez World Athletics."],
    ["Punkty ITRA: co to jest i ile ich daje bieg?", "To ocena trudności biegu w skali 0-6, liczona z km-effort (kilometry plus 1 za każde 100 m podejścia): 0-24 to 0 punktów, 25-44 to 1, 45-74 to 2, 75-114 to 3, 115-154 to 4, 155-209 to 5, od 210 to 6. Punkty dostaje każda osoba, która ukończy bieg oceniony przez ITRA."],
    ["Jak sprawdzić swój ranking ITRA?", "Ranking to Performance Index. Pojawia się po pierwszym ukończonym biegu, którego wyniki organizator przesłał do ITRA, i jest widoczny w wyszukiwarce biegaczy na itra.run."],
    ["Czym różni się ITRA Performance Index od UTMB Index?", "To dwa osobne systemy. Oba liczą średnią ważoną maksymalnie pięciu najlepszych wyników z 36 miesięcy, ale każdy ma własną bazę biegów i własny model. Ranking ITRA jest uznawany przez World Athletics, a UTMB Index decyduje o dopuszczeniu do losowania na biegi UTMB Mont-Blanc."],
    ["Czy punkty ITRA są potrzebne na pierwszy bieg górski?", "Nie. Krótkie biegi nie wymagają żadnych punktów. Wymóg pojawia się dopiero przy zapisach na niektóre długie biegi i zawsze jest opisany w regulaminie."],
  ];
  return { blocks, faq };
}

/* ---------- Vertical ---------- */

/** dystans, który spełnia naszą miarę verticalu (do 8 km i co najmniej 100 m podejścia na kilometr) */
const strictV = (r: Race) => r.elevations.find(isVertical);
const verticalList = (all: Race[], today: string) => {
  const up = upcoming(all, today).map((r) => ({ r }));
  return uniqEvents([...up.filter((x) => strictV(x.r)), ...up.filter((x) => !strictV(x.r) && x.r.vertical)]).map((x) => x.r);
};

export function verticalRaces(all: Race[], today: string) {
  return { heading: "Nadchodzące biegi z dystansem vertical", note: "Najpierw biegi z dystansem, który ma co najmniej 100 m podejścia na kilometr, potem te, w których nazwa \"vertical\" pojawia się tylko w opisie dystansu.", list: verticalList(all, today).slice(0, 8) };
}

export function verticalFull(all: Race[], today: string): Full {
  const up = upcoming(all, today);
  const strictAll = dists(all).filter((x) => isVertical(x.e));
  const grads = strictAll.map((x) => x.e.dplus! / x.e.km);
  const kms = strictAll.map((x) => x.e.km), dps = strictAll.map((x) => x.e.dplus!);
  const fullVk = strictAll.filter((x) => x.e.dplus! >= 1000).length;
  const normal = dists(up).filter((x) => x.e.dplus && x.e.km >= 5 && !isVertical(x.e)).map((x) => x.e.dplus! / x.e.km);
  const events = (list: Race[]) => uniqEvents(list.map((r) => ({ r }))).length; // cykl z kilkoma edycjami liczymy raz
  const nStrict = events(up.filter((r) => strictV(r)));
  const nNamed = events(up.filter((r) => !strictV(r) && r.vertical));
  const day = fmtDate(today);
  // dystans do przykładu: najbliższy nadchodzący, a gdy go nie ma, ostatni z bazy
  const ref = strictAll.filter((x) => x.r.dateEnd >= today).sort((a, b) => a.r.dateStart.localeCompare(b.r.dateStart))[0] ?? [...strictAll].sort((a, b) => b.r.dateStart.localeCompare(a.r.dateStart))[0];
  const list = verticalList(all, today).slice(0, 4);

  const numbers: Block[] = strictAll.length ? [
    { p: `W naszym kalendarzu vertical to dystans do 8 km, który ma co najmniej 100 m podejścia na kilometr. W bazie ${plural(strictAll.length, "jest", "są", "jest")} ${dystansow(strictAll.length)} ${plural(strictAll.length, "spełniający", "spełniające", "spełniających")} tę miarę (każda edycja liczona osobno): od ${fmtKm(Math.min(...kms))} do ${fmtKm(Math.max(...kms))} i od +${Math.min(...dps)} do +${Math.max(...dps)} m, z medianą ${num(median(grads))} m podejścia na kilometr.${normal.length ? ` Dla porównania zwykły dystans w nadchodzących biegach ma medianę ${num(median(normal))} m na kilometr, więc vertical jest średnio ${num(median(grads) / median(normal), 1)} razy bardziej stromy.` : ""} ${fullVk ? `Pełne 1000 m w pionie ${plural(fullVk, "ma", "mają", "ma")} ${fullVk} z nich.` : "Żaden z nich nie ma pełnych 1000 m w pionie: polskie verticale to najczęściej krótsze wersje klasycznego VK."}` },
    ...(ref ? [{ p: `Jak to czytać na przykładzie: ${kmD(ref.e)} (${link(ref.r)}) to ${num(ref.e.dplus! / ref.e.km)} m podejścia na kilometr, czyli średnie nachylenie ${num(ref.e.dplus! / ref.e.km / 10)}%. Nasz kalkulator [Czy dam radę?](/czy-dam-rade) szacuje taki dystans na ok. ${predictMinutes({ km: 10, minutes: 55 }, ref.e.km, ref.e.dplus, "gorski", "zero").minutes} minut dla osoby, która biega 10 km po płaskim w 55 minut i nie ma doświadczenia w terenie${ref.e.limitH ? ` (limit organizatora: ${hours(ref.e.limitH)})` : ""}. Na asfalcie ta sama osoba pokonałaby ${fmtKm(ref.e.km)} w ok. ${Math.round(55 * Math.pow(ref.e.km / 10, 1.06))} minut.` } as Block] : []),
  ] : [{ p: "W naszym kalendarzu vertical to dystans do 8 km, który ma co najmniej 100 m podejścia na kilometr. W bazie nie ma teraz żadnego dystansu, który spełnia tę miarę." }];

  const blocks: Block[] = [
    { h: "Definicje: od Vertical Kilometer do polskich verticali" },
    { ul: [
      "Vertical Kilometer (VK) to formuła Międzynarodowej Federacji Skyrunningu (ISF): 1000 m w pionie na trasie nie dłuższej niż 5 km. Pierwszy taki bieg odbył się w 1994 roku we włoskiej Cervinii. Federacja uznaje też podwójne i potrójne VK.",
      "W aktualnych przepisach ISF dyscyplina \"vertical\" to biegi wyłącznie pod górę z co najmniej 800 m podejścia i średnim nachyleniem minimum 20% (200 m na kilometr), przy czym 5% trasy musi mieć ponad 33%.",
      "ITRA ma w rankingu osobną kategorię Vertical: biegi od 2 do 12 km, w których podejść jest co najmniej dziesięć razy więcej niż zejść.",
      "W UTMB Index biegi typu Vertical Kilometer nie dostają wyniku, więc nie budują indeksu.",
      "Polscy organizatorzy używają nazwy swobodnie: verticalem bywa każdy krótki bieg pod górę, także dużo łagodniejszy niż w definicjach federacji.",
    ] },

    { h: "Vertical w liczbach z naszej bazy" },
    ...numbers,

    { h: "Jak wygląda start w verticalu" },
    { ol: [
      "Start jest na dole, meta na górze. Nie ma zbiegu, czyli tej części biegu górskiego, która najmocniej obciąża mięśnie ud.",
      "Na stromych odcinkach większość osób przechodzi z biegu do szybkiego marszu, z rękami na udach albo z kijami. Wysiłek jest krótki, ale przez cały czas wysoki.",
      "O kijach decyduje regulamin konkretnego biegu. W przepisach ISF to organizator ustala, czy i na których odcinkach wolno ich używać.",
      "Po mecie trzeba jeszcze wrócić na dół, pieszo albo kolejką, jeśli jest. Ten odcinek nie liczy się do wyniku, ale warto mieć na niego ciepłą warstwę i zapas czasu.",
    ] },

    { h: "Verticale w kalendarzu" },
    { p: `Na ${day} wśród ${up.length} nadchodzących biegów ${nStrict ? `${nStrict} ${plural(nStrict, "impreza ma", "imprezy mają", "imprez ma")} dystans spełniający naszą miarę verticalu` : "żadna impreza nie ma dystansu spełniającego naszą miarę verticalu"}.${nNamed ? ` W ${nNamed} ${plural(nNamed, "kolejnej imprezie", "kolejnych imprezach", "kolejnych imprezach")} nazwa "vertical" pojawia się w opisie dystansu, ale nie mamy jego przewyższenia albo wychodzi on łagodniej niż 100 m na kilometr.` : ""}` },
    ...(list.length ? [{ ul: list.map((r) => { const e = strictV(r); return `${link(r)} (${where(r)})${e ? `: ${kmD(e)}, ${num(e.dplus! / e.km)} m na kilometr` : ": nazwa \"vertical\" w opisie dystansu, bez potwierdzonego nachylenia"}`; }) } as Block] : []),
    { p: "Verticale oznaczamy w kalendarzu osobno i nie wliczamy ich do oceny \"dobry na start\". Na liście [biegów do 15 km](/biegi/do-15-km) krótki vertical wygląda na łatwy dystans, a to inna dyscyplina niż trail dla początkujących." },

    { h: "Na pierwszym starcie" },
    { ul: [
      "Vertical to dobry sprawdzian siły na podejściu, ale słaby wybór na pierwszy start w górach: nie uczy zbiegania ani gospodarowania siłami na dłuższej trasie.",
      "Jeśli ciągnie Cię do stromych podbiegów, zacznij od treningu: 20-30 minut ciągłego marszu pod górę pokaże, czym jest taki wysiłek.",
      "Na pierwszy bieg w terenie lepiej wybrać trasę z oceną \"dobry na start\": lista jest w zestawieniu [biegów dla początkujących](/biegi/dla-poczatkujacych).",
      "Przed zapisem sprawdź w regulaminie trzy rzeczy: czy wolno mieć kije, jak wraca się z mety i czy jest limit czasu.",
    ] },

    { h: "Najczęstsze nieporozumienia" },
    { ul: [
      "\"Vertical to zawsze 1000 m w górę.\" Tyle ma klasyczny Vertical Kilometer. Biegi nazywane verticalami bywają dużo niższe: liczby z naszej bazy są wyżej.",
      "\"3 km to krótko, więc łatwo.\" Liczy się przewyższenie: 3 km z +500 m to według km-effort wysiłek jak 8 km po płaskim, a czasowo zwykle jeszcze więcej, bo teren jest stromy.",
      "\"Skoro nie ma zbiegu, to bieg dla początkujących.\" Brak zbiegu oszczędza nogi, ale intensywność jest bardzo wysoka od startu do mety.",
      "\"Vertical da mi punkty i indeks.\" Biegi typu VK nie dostają wyniku w UTMB Index, a kilka km-effort to w ITRA przedział 0 punktów. Więcej w hasłach [UTMB Index](/slownik/utmb-index-running-stones) i [ITRA](/slownik/itra).",
    ] },
  ];

  const faq: [string, string][] = [
    ["Bieg vertical: co to jest?", "To bieg wyłącznie pod górę: start na dole, meta na górze, bez zbiegu. Klasyczna odmiana, Vertical Kilometer (VK), ma 1000 m w pionie na trasie nie dłuższej niż 5 km."],
    ["Ile przewyższenia ma vertical?", strictAll.length ? `W klasycznym Vertical Kilometer 1000 m. W naszej bazie dystanse spełniające miarę verticalu mają od +${Math.min(...dps)} do +${Math.max(...dps)} m na trasach od ${fmtKm(Math.min(...kms))} do ${fmtKm(Math.max(...kms))}, z medianą ${num(median(grads))} m podejścia na kilometr.` : "W klasycznym Vertical Kilometer 1000 m na trasie do 5 km. Krótsze biegi nazywane verticalami mają zwykle kilkaset metrów."],
    ["Czy na verticalu można używać kijów?", "Zależy od regulaminu konkretnego biegu. W przepisach Międzynarodowej Federacji Skyrunningu to organizator decyduje, czy i gdzie wolno używać kijów."],
    ["Czy vertical nadaje się na pierwszy bieg górski?", "Raczej nie. To krótki, ale bardzo intensywny wysiłek, który nie uczy zbiegania ani rozkładania sił. Na początek lepszy jest trail do 15 km z umiarkowanym przewyższeniem."],
  ];
  return { blocks, faq };
}
