import type { Race } from "./types";
import { isVertical } from "./normalize";

export type Term = {
  slug: string; term: string; title: string; // <title>
  short: string; // 1 zdanie (indeks, meta description)
  body: string[]; // akapity
  tips: string[]; // "na pierwszym starcie" (lista)
  faq?: [string, string][];
  related?: { label: string; href: string }[];
  races?: (all: Race[], today: string) => { heading: string; list: Race[] } | undefined; // lista biegów powiązana z pojęciem
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
  { slug: "vertical", term: "Vertical (VK)", title: "Vertical (VK): bieg tylko pod górę",
    short: "Vertical to bieg prawie wyłącznie pod górę, zwykle około 1 000 m przewyższenia na maksymalnie 5 km.",
    body: ["Bieg prawie wyłącznie pod górę, zwykle z około 1 000 m przewyższenia na maksymalnie 5 km. Krótki, ale bardzo intensywny. Dobry jako sprawdzian, słaby jako pierwszy kontakt z górami, bo nie uczy zbiegania.", "W kalendarzu oznaczamy verticale osobno i nie liczymy ich do oceny \"dobry na start\", bo 1 000 m w górę na 4 km to zupełnie inna dyscyplina niż trail dla początkujących, choć dystans wygląda niewinnie."],
    tips: ["Kije są na verticalu zwykle dozwolone i bardzo pomagają.", "Nie ma zbiegu: na dół zjeżdżasz kolejką albo schodzisz poza rywalizacją.", "Czas wyniku to często 40-90 minut, ale tętno jak na dysze na maksa."],
    related: [{ label: "Biegi do 15 km (bez verticali)", href: "/biegi/do-15-km" }],
    races: (all, t) => ({ heading: "Nadchodzące verticale", list: up(all, t).filter((r) => r.vertical || r.elevations.some((e) => isVertical(e))).slice(0, 8) }) },
  { slug: "skyrunning", term: "Skyrunning", title: "Skyrunning: biegi wysokogórskie",
    short: "Skyrunning to biegi wysokogórskie po graniach i stromych, technicznych trasach; w Polsce głównie Tatry.",
    body: ["Biegi wysokogórskie po graniach i stromych, technicznych trasach. W Polsce głównie Tatry. Dla początkujących: najpierw beskidzkie łąki.", "Skyrunning wymaga pewności na ekspozycji, umiejętności poruszania się po skale i piargu oraz sprzętu jak na wyjście w góry. To cel na drugi lub trzeci sezon, nie na pierwszy start."],
    tips: ["Zacznij od marszobiegów po tatrzańskich szlakach poza zawodami, żeby poznać ekspozycję.", "Sprawdź limity pośrednie: na technicznych trasach są ciasne."],
    related: [{ label: "Biegi: Tatry, Pieniny i Gorce", href: "/biegi/pasmo/tatry-pieniny-gorce" }] },
  { slug: "itra", term: "ITRA", title: "ITRA: punkty, Performance Index i po co to biegaczowi",
    short: "ITRA to międzynarodowa federacja trailu; ocenia trudność biegów w punktach 0-6 i prowadzi ranking zawodników.",
    body: ["International Trail Running Association, międzynarodowa federacja trailu. Ocenia trudność biegów w punktach 0-6 na podstawie dystansu i przewyższenia (tzw. km-effort) oraz prowadzi ranking osób startujących (Performance Index). Punkty ITRA bywają wymagane przy zapisach na długie biegi jako dowód doświadczenia.", "Km-effort to dystans plus przewyższenie podzielone przez 100: 20 km z +800 m to 28 km-effort. Od tej liczby zależy, ile punktów (0-6) dostaje dystans. Nasz kalkulator \"Czy dam radę?\" używa tej samej logiki do szacowania czasu."],
    tips: ["Na pierwszy start punkty ITRA nie są potrzebne; przydają się dopiero przy zapisach na duże ultra.", "Performance Index rośnie z wyników na biegach z oceną ITRA, więc warto, żeby pierwsze starty były na imprezach ocenianych."],
    related: [{ label: "UTMB Index i Running Stones", href: "/slownik/utmb-index-running-stones" }, { label: "Czy dam radę?", href: "/czy-dam-rade" }] },
  { slug: "utmb-index-running-stones", term: "UTMB Index i Running Stones", title: "UTMB Index i Running Stones: jak dostać się do Chamonix",
    short: "UTMB Index to wskaźnik wyników w kategoriach 20K, 50K, 100K i 100M; Running Stones to kamienie z biegów UTMB World Series, bilet do loterii finałów.",
    body: ["UTMB Index to wskaźnik wyników w czterech kategoriach (20K, 50K, 100K, 100M), liczony z biegów UTMB World Series i biegów partnerskich (UTMB Index races). Running Stones to kamienie zdobywane na biegach UTMB World Series i Majors; są biletem do loterii finałów w Chamonix. Do loterii trzeba mieć co najmniej jeden kamień z ostatnich 24 miesięcy i ważny indeks w wymaganej kategorii: na OCC wystarczy 20K, na CCC 50K, na UTMB 100K lub 100M. Więcej kamieni to więcej losów, ale nie gwarancja startu.", "W Polsce kamienie zdobywa się na biegach z serii UTMB World Series; indeks naliczają też biegi partnerskie. Dla początkujących to odległy horyzont, ale dobrze wiedzieć, że droga z pierwszej dychy w terenie do Chamonix jest policzalna."],
    tips: ["Zacznij od indeksu 20K: wystarczy ukończyć bieg partnerski na dystansie ok. 20 km.", "Kamienie przedawniają się po 24 miesiącach, planuj starty w parach lat."],
    related: [{ label: "ITRA", href: "/slownik/itra" }, { label: "Biegi ultra", href: "/biegi/ultra" }] },
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
