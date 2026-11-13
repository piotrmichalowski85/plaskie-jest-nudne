import type { Race } from "./types";
import { utmbFull, utmbRaces, itraFull, itraRaces, verticalFull, verticalRaces } from "./slownik-pelne";

/** blok treści pełnego hasła; w tekstach linki jako [etykieta](/adres) albo [etykieta](https://...) */
export type Block = { h: string } | { p: string } | { ul: string[] } | { ol: string[] } | { table: { head: string[]; rows: string[][]; note?: string } };
/** pełna treść hasła składana z bazy przy buildzie (lib/slownik-pelne.ts): sekcje po akapicie otwierającym i pytania z odpowiedziami */
export type Full = { blocks: Block[]; faq: [string, string][] };

export type Term = {
  slug: string; term: string; title: string; // <title>
  h1?: string; // nagłówek strony, gdy ma być szerszy niż samo hasło
  description?: string; // meta description, gdy ma być inne niż short
  short: string; // 1 zdanie (indeks, meta description)
  body: string[]; // akapity; przy haśle z "full" pierwszy akapit jest odpowiedzią pod nagłówkiem
  tips: string[]; // "na pierwszym starcie" (lista)
  faq?: [string, string][];
  related?: { label: string; href: string }[];
  races?: (all: Race[], today: string) => { heading: string; note?: string; list: Race[] } | undefined; // lista biegów powiązana z pojęciem
  full?: (all: Race[], today: string) => Full; // sekcje i FAQ z liczbami z bazy; zastępuje tips i faq
};

const up = (all: Race[], today: string) => all.filter((r) => r.dateEnd >= today).sort((a, b) => a.dateStart.localeCompare(b.dateStart));

export const TERMS: Term[] = [
  { slug: "bieg-gorski-a-trail", term: "Bieg górski a trail", title: "Bieg górski, trail, przełaj: czym się różnią",
    short: "Bieg górski ma wyraźne podbiegi i zbiegi, trail to bieg w terenie naturalnym, przełaj to krótki bieg po miękkiej nawierzchni.",
    body: ["Bieg górski zwykle ma wyraźny podbieg i zbieg, często jest krótszy i stromy. Trail to bieg w terenie naturalnym: po ścieżkach, lasach, łąkach, pagórkach, czasem górach. Przełaj to krótki bieg terenowy po miękkiej nawierzchni, często w mieście albo parku. Granice są płynne, w kalendarzu oznaczamy je szacunkowo.", "Dla osoby z płaskiego różnica jest praktyczna: na przełaju liczy się tempo, na trailu technika stawiania stóp, w górach umiejętność szybkiego marszu pod górę i zbiegania. Z asfaltu najłagodniej wchodzi się przez przełaj albo trail z małym przewyższeniem."],
    tips: ["Pierwszy start: przełaj albo trail do 15 km z przewyższeniem poniżej 50 m na kilometr.", "Góry z prawdziwego zdarzenia (60-80 m na kilometr) najlepiej po dwóch, trzech startach w terenie.", "Nazwa biegu bywa myląca: \"maraton górski\" może mieć też dystans 10 km, sprawdzaj listę dystansów."],
    related: [{ label: "Biegi przełajowe", href: "/biegi/przelaje" }, { label: "Biegi do 15 km", href: "/biegi/do-15-km" }, { label: "Dla początkujących", href: "/biegi/dla-poczatkujacych" }] },
  { slug: "przewyzszenie-d-plus", term: "Przewyższenie (D+)", title: "Co to jest D+ (przewyższenie) i ile to dużo",
    short: "D+ to suma wszystkich metrów w górę na trasie; 20 km z +800 m oznacza łącznie 800 metrów wspinania.",
    body: ["Suma wszystkich metrów w górę na trasie. 20 km z +800 m oznacza, że łącznie wspinasz się na 800 metrów, niezależnie od tego, ile razy schodzisz. Ważniejsza od samego D+ jest jego gęstość: 40 m na kilometr to spokojny trail, 60-80 m na kilometr to góry, powyżej 100 m na kilometr często oznacza dużo marszu. W kalendarzu pokazujemy D+ dla każdego dystansu, jeśli organizator go podał albo policzyliśmy go z pliku GPX.", "Organizatorzy liczą D+ różnie: z zegarka, z mapy, z GPX wygładzonego albo nie. Różnice 10-20% między źródłami są normalne. Jeśli przy dystansie widzisz \"przewyższenie nieznane\", organizator nie podał liczby, a my nie znaleźliśmy śladu GPX."],
    tips: ["Przelicz na kilometry wysiłku: każde 100 m w górę to mniej więcej dodatkowy kilometr biegu po płaskim (tak liczy ITRA i nasz kalkulator \"Czy dam radę?\").", "Na pierwszy start szukaj D+ poniżej 50 m na kilometr: 15 km z +600 m to już wyraźne góry.", "Zbiegi (D-) męczą mięśnie bardziej niż podbiegi; trasa z +800/-800 m jest trudniejsza, niż sugeruje samo D+."],
    faq: [["Ile D+ to dużo dla początkującego?", "Powyżej 50 m na kilometr zaczynają się góry, powyżej 100 m na kilometr duża część trasy to marsz. Na pierwszy start celuj w 20-45 m na kilometr."], ["Czy D+ obejmuje zbiegi?", "Nie, D+ to tylko metry w górę. Zbiegi to D-. Na trasie z metą w miejscu startu D+ i D- są równe."]],
    related: [{ label: "Czy dam radę? Kalkulator czasu", href: "/czy-dam-rade" }, { label: "Biegi do 15 km", href: "/biegi/do-15-km" }],
    races: (all, t) => ({ heading: "Nadchodzące biegi z małym przewyższeniem (do 45 m na km)", list: up(all, t).filter((r) => r.elevations.some((e) => e.dplus && e.km >= 5 && e.dplus / e.km <= 45)).slice(0, 8) }) },
  { slug: "limit-czasu-cutoff", term: "Limit czasu (cutoff)", title: "Limit czasu (cutoff) na biegu górskim: jak go czytać",
    short: "Limit czasu to godzina lub czas, do którego trzeba dotrzeć na metę albo punkt kontrolny; po jego przekroczeniu bieg kończy się dla zawodnika.",
    body: ["Godzina lub czas, do którego trzeba dotrzeć na metę albo punkt kontrolny. Na pierwszym biegu wybieraj hojne limity: 3 godziny na 15 km w górach dają spokój, 2 godziny to już ściganie. Limity pośrednie na punktach potrafią być bardziej bolesne niż limit na mecie.", "Limit bywa podany jako czas od startu (\"6 h\") albo jako godzina zegarowa (\"meta zamykana o 16:00\"). Przy starcie falowym liczy się Twoja fala. Po przekroczeniu limitu na punkcie organizator zdejmuje z trasy, a wynik jest oznaczony jako DNF."],
    tips: ["Policz swój szacowany czas kalkulatorem \"Czy dam radę?\" i porównaj z limitem: zapas poniżej 15% to ryzyko.", "Sprawdź w regulaminie limity pośrednie, nie tylko metę.", "Pogoda wydłuża czas: błoto i deszcz to łatwo +10-20%."],
    faq: [["Co się dzieje po przekroczeniu limitu?", "Organizator kończy Twój bieg na punkcie kontrolnym albo na mecie, wynik to DNF. Zwykle zapewnia transport do bazy, ale sprawdź to w regulaminie."], ["Jaki limit jest bezpieczny na pierwszy bieg?", "Taki, w którym Twój szacowany czas mieści się z zapasem co najmniej 15-20%. Dla 15 km w górach z asfaltowej dychy w 55 minut to zwykle 3 godziny."]],
    related: [{ label: "Czy dam radę? Porównanie z limitem", href: "/czy-dam-rade" }, { label: "Jak czytać regulamin", href: "/slownik/jak-czytac-regulamin" }],
    races: (all, t) => ({ heading: "Nadchodzące biegi z podanym limitem czasu", list: up(all, t).filter((r) => r.elevations.some((e) => e.limitH)).slice(0, 8) }) },
  { slug: "sprzet-obowiazkowy", term: "Sprzęt obowiązkowy", title: "Sprzęt obowiązkowy na biegu górskim: co to jest i co zwykle na liście",
    short: "Lista rzeczy, które trzeba mieć przy sobie przez cały bieg; organizator może ją sprawdzić, a za braki grozi kara czasowa albo dyskwalifikacja.",
    body: ["Lista rzeczy, które trzeba mieć przy sobie przez cały bieg. Organizator może ją sprawdzić, a za braki grozi kara czasowa albo dyskwalifikacja. Typowo: kurtka przeciwdeszczowa z kapturem, czołówka, folia NRC, telefon z numerem organizatora, gwizdek, zapas wody i jedzenia, czasem rękawiczki i czapka. Zawsze czytaj regulamin konkretnego biegu, bo listy różnią się nawet na tym samym dystansie w różnych latach.", "Na krótkich biegach do 15 km lista jest zwykle krótka (telefon, czasem folia NRC i kubek), na ultra i w zimie rośnie do kilkunastu pozycji. Przy wielu biegach w naszym kalendarzu wyciągamy listę sprzętu z regulaminu automatycznie i pokazujemy ją na stronie biegu; przed startem i tak sprawdź oryginał."],
    tips: ["Kubek lub bidon: większość biegów nie daje jednorazowych kubków na punktach.", "Kurtka \"przeciwdeszczowa\" w regulaminie to zwykle membrana z kapturem, nie wiatrówka.", "Pakuj sprzęt tak, żeby dało się go pokazać w minutę na kontroli."],
    faq: [["Czy na biegu 10 km też jest sprzęt obowiązkowy?", "Często tylko telefon i kubek, ale bywają wyjątki (folia NRC, czołówka przy starcie o zmierzchu). Lista jest w regulaminie konkretnego biegu."], ["Co grozi za brak sprzętu?", "Zależnie od regulaminu: kara czasowa (zwykle 15-60 minut), niedopuszczenie do startu albo dyskwalifikacja."]],
    related: [{ label: "Jak czytać regulamin", href: "/slownik/jak-czytac-regulamin" }],
    races: (all, t) => ({ heading: "Nadchodzące biegi, dla których mamy listę sprzętu z regulaminu", list: up(all, t).filter((r) => r.gear && r.gear.length).slice(0, 8) }) },
  { slug: "vertical", term: "Vertical (VK)", h1: "Vertical (VK): bieg tylko pod górę", title: "Vertical (VK): co to za bieg, ile ma przewyższenia i dla kogo",
    description: "Vertical to bieg wyłącznie pod górę; klasyczny Vertical Kilometer ma 1000 m w pionie na trasie do 5 km. Definicje, liczby z polskich biegów i starty.",
    short: "Vertical to bieg wyłącznie pod górę; klasyczny Vertical Kilometer (VK) ma 1000 m przewyższenia na trasie nie dłuższej niż 5 km.",
    body: ["Vertical to bieg wyłącznie pod górę: start jest na dole, meta na górze, a zejście nie wchodzi do wyniku. Klasyczna odmiana, Vertical Kilometer (VK), to 1000 m w pionie na trasie nie dłuższej niż 5 km. W Polsce verticalami nazywa się też krótsze i niższe podbiegi; liczby z naszej bazy biegów są niżej."],
    tips: [], full: verticalFull, races: verticalRaces,
    related: [{ label: "Przewyższenie (D+)", href: "/slownik/przewyzszenie-d-plus" }, { label: "Skyrunning", href: "/slownik/skyrunning" }, { label: "Kije", href: "/slownik/kije" }, { label: "Biegi do 15 km", href: "/biegi/do-15-km" }, { label: "Biegi dla początkujących", href: "/biegi/dla-poczatkujacych" }] },
  { slug: "skyrunning", term: "Skyrunning", title: "Skyrunning: biegi wysokogórskie",
    short: "Skyrunning to biegi wysokogórskie po graniach i stromych, technicznych trasach; w Polsce głównie Tatry.",
    body: ["Biegi wysokogórskie po graniach i stromych, technicznych trasach. W Polsce głównie Tatry. Dla początkujących: najpierw beskidzkie łąki.", "Skyrunning wymaga pewności na ekspozycji, umiejętności poruszania się po skale i piargu oraz sprzętu jak na wyjście w góry. To cel na drugi lub trzeci sezon, nie na pierwszy start."],
    tips: ["Zacznij od marszobiegów po tatrzańskich szlakach poza zawodami, żeby poznać ekspozycję.", "Sprawdź limity pośrednie: na technicznych trasach są ciasne."],
    related: [{ label: "Biegi: Tatry, Pieniny i Gorce", href: "/biegi/pasmo/tatry-pieniny-gorce" }] },
  { slug: "itra", term: "ITRA", h1: "ITRA: punkty ITRA i Performance Index", title: "ITRA: co to jest, punkty ITRA i Performance Index (ranking)",
    description: "ITRA to międzynarodowe stowarzyszenie biegów trailowych. Punkty ITRA (0-6) opisują trudność biegu, Performance Index (do 1000) to ranking. Tabela progów.",
    short: "ITRA to międzynarodowe stowarzyszenie biegów trailowych; punkty ITRA (0-6) opisują trudność biegu, a Performance Index (do 1000) to ranking osób biegających.",
    body: ["ITRA (International Trail Running Association) to międzynarodowe stowarzyszenie biegów trailowych, które prowadzi kalendarz biegów, bazę wyników i światowy ranking. Pod hasłem \"punkty ITRA\" kryją się dwie różne rzeczy. Pierwsza to punkty biegu w skali 0-6: mówią, jak długi i stromy jest bieg, i dostaje je każda osoba na mecie. Druga to Performance Index, czyli indywidualna ocena poziomu w skali do 1000, z której powstaje ranking."],
    tips: [], full: itraFull, races: itraRaces,
    related: [{ label: "UTMB Index i Running Stones", href: "/slownik/utmb-index-running-stones" }, { label: "Przewyższenie (D+)", href: "/slownik/przewyzszenie-d-plus" }, { label: "Limit czasu (cutoff)", href: "/slownik/limit-czasu-cutoff" }, { label: "Czy dam radę?", href: "/czy-dam-rade" }, { label: "Biegi ultra", href: "/biegi/ultra" }] },
  { slug: "utmb-index-running-stones", term: "UTMB Index i Running Stones", title: "UTMB Index: co to jest, jak działa i po co są Running Stones",
    description: "UTMB Index to ocena poziomu w biegach trailowych: średnia z maks. 5 najlepszych wyników z 36 miesięcy. Running Stones to losy na UTMB, CCC i OCC.",
    short: "UTMB Index (indeks UTMB) to liczba opisująca poziom w biegach trailowych, liczona z wyników biegów; Running Stones to losy w losowaniu miejsc na UTMB, CCC i OCC w Chamonix.",
    body: ["UTMB Index (indeks UTMB) to liczba opisująca poziom sportowy w biegach trailowych: średnia ważona maksymalnie pięciu najlepszych wyników z ostatnich 36 miesięcy, liczona osobno w kategoriach 20K, 50K, 100K i 100M oraz jako indeks ogólny. Running Stones to coś innego: losy w losowaniu miejsc na biegi OCC, CCC i UTMB w Chamonix, zdobywane wyłącznie za ukończenie biegów cyklu UTMB World Series. Do losowania potrzeba jednego i drugiego: ważnego indeksu i co najmniej jednego kamienia."],
    tips: [], full: utmbFull, races: utmbRaces,
    related: [{ label: "ITRA: punkty i Performance Index", href: "/slownik/itra" }, { label: "Przewyższenie (D+)", href: "/slownik/przewyzszenie-d-plus" }, { label: "Biegi ultra", href: "/biegi/ultra" }, { label: "Czy dam radę?", href: "/czy-dam-rade" }] },
  { slug: "kije", term: "Kije", title: "Kije na biegu górskim: kiedy pomagają i kiedy są zabronione",
    short: "Kije są dozwolone na większości ultra i biegów górskich, na niektórych krótkich trasach zabronione; zawsze sprawdź regulamin.",
    body: ["Dozwolone na większości ultra i biegów górskich, na niektórych krótkich trasach zabronione. Zawsze sprawdź regulamin. Na pierwszym biegu do 20 km nie są potrzebne; powyżej i przy stromych podbiegach oszczędzają nogi. Trzeba umieć ich używać, zanim wystartujesz.", "Regulaminy różnią się też w szczegółach: czasem kije wolno mieć od startu do mety albo wcale, czasem wolno je wziąć dopiero z depozytu na punkcie. Na startach masowych i w wąskich miejscach kije bywają zakazane ze względów bezpieczeństwa."],
    tips: ["Składane kije węglowe ważą 150-200 g para i mieszczą się w plecaku; na pierwszy raz wystarczą.", "Trenuj z kijami kilka razy przed startem: zły rytm męczy bardziej niż brak kijów."],
    related: [{ label: "Sprzęt obowiązkowy", href: "/slownik/sprzet-obowiazkowy" }] },
  { slug: "jak-czytac-regulamin", term: "Jak czytać regulamin", title: "Jak czytać regulamin biegu górskiego: pięć rzeczy do sprawdzenia",
    short: "W regulaminie szukaj w tej kolejności: limitów czasu, sprzętu obowiązkowego, punktów odżywczych, profilu trasy i zasad po wycofaniu.",
    body: ["Szukasz czterech rzeczy, w tej kolejności: limit czasu (na mecie i na punktach), sprzęt obowiązkowy, punkty z wodą i jedzeniem (co ile kilometrów) oraz profil trasy. Piąta rzecz: co się dzieje po wycofaniu z biegu, w tym transport z trasy. Resztę możesz przeczytać później.", "Na stronie każdego biegu w kalendarzu linkujemy regulamin, jeśli go znaleźliśmy, i wyciągamy z niego limity czasu oraz listę sprzętu. To skrót, nie zamiennik: regulaminy zmieniają się między edycjami, a wersja ostateczna pojawia się często tydzień przed startem."],
    tips: ["Zapisz sobie numer alarmowy organizatora w telefonie przed startem.", "Sprawdź godzinę odbioru pakietu: na wielu biegach górskich tylko dzień wcześniej.", "Szukaj słowa \"zwrot\": zasady zwrotu opłaty przy rezygnacji różnią się bardzo."],
    related: [{ label: "Limit czasu (cutoff)", href: "/slownik/limit-czasu-cutoff" }, { label: "Sprzęt obowiązkowy", href: "/slownik/sprzet-obowiazkowy" }] },
  { slug: "pierwsze-12-tygodni", term: "Pierwsze 12 tygodni z płaskiego w góry", title: "Z płaskiego w góry w 12 tygodni: prosty plan dla biegacza z asfaltu",
    short: "Nie zmieniaj wszystkiego naraz: jeden trening tygodniowo w terenie z podbiegami, co drugi weekend długi marszobieg po górach, po 8-10 tygodniach pierwszy start do 15-20 km.",
    body: ["Nie zmieniaj wszystkiego naraz. Zostaw swoje tygodniowe kilometry, ale jeden bieg w tygodniu zamień na teren z podbiegami, a co drugi weekend zrób długi marszobieg po górach z plecakiem. Naucz się chodzić pod górę szybko (to nie wstyd, tak robią najlepsi) i zbiegać z krótkim krokiem. Po 8-10 tygodniach wybierz bieg do 15-20 km z oceną \"dobry na start\" w naszym kalendarzu.", "Trzy rzeczy, które zaskakują biegaczy z płaskiego: tempo na podbiegu jest o 2-3 min/km wolniejsze i to normalne; mięśnie czwórek bolą po zbiegach, nie po podbiegach; w górach zjada się i pije więcej, bo bieg trwa dłużej."],
    tips: ["Tydzień 1-4: jeden trening z podbiegami (schody, wiadukt, pagórek), reszta jak zwykle.", "Tydzień 5-8: co drugi weekend 2-3 godziny marszobiegu po szlaku z plecakiem i wodą.", "Tydzień 9-12: wybór biegu z kalendarza, przeczytanie regulaminu, jeden trening w sprzęcie obowiązkowym, start."],
    related: [{ label: "Kreator: wybierz pierwszy bieg", href: "/kreator" }, { label: "Biegi dla początkujących", href: "/biegi/dla-poczatkujacych" }] },
];
export const termBySlug = (slug: string) => TERMS.find((t) => t.slug === slug);
