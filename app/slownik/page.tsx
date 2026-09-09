import type { Metadata } from "next";
export const metadata: Metadata = { title: "Słownik początkującego biegacza górskiego", description: "D+, cutoff, ITRA, UTMB Index, Running Stones, vertical, sprzęt obowiązkowy: pojęcia z biegów górskich wyjaśnione prosto." };

const T: [string, string][] = [
  ["Bieg górski a trail", "Bieg górski to zwykle wyraźny podbieg i zbieg, często krótszy i stromy (typowa Liga Biegów Górskich). Trail to bieg w terenie naturalnym: ścieżki, lasy, łąki, pagórki, czasem góry. Przełaj to krótki bieg terenowy po miękkim, często w mieście lub parku. Granice są płynne, w kalendarzu oznaczamy je szacunkowo."],
  ["Przewyższenie (D+, plus)", "Suma wszystkich metrów w górę na trasie. 20 km z +800 m oznacza, że łącznie wspinasz się na 800 metrów, niezależnie od tego, ile razy schodzisz. Ważniejsza od samego D+ jest jego gęstość: 40 m na kilometr to spokojny trail, 60-80 m na kilometr to góry, powyżej 100 m na kilometr to marsz z kijami. W kalendarzu pokazujemy D+ dla najkrótszego dystansu, jeśli organizator go podał."],
  ["Limit czasu (cutoff)", "Czas, po którym organizator zamyka metę albo punkt kontrolny. Na pierwszym biegu wybieraj hojne limity: 3 godziny na 15 km w górach to komfort, 2 godziny to już wyścig. Limity pośrednie na punktach potrafią być bardziej bolesne niż limit na mecie."],
  ["Sprzęt obowiązkowy", "Lista rzeczy, które musisz mieć przy sobie przez cały bieg, sprawdzana losowo (brak = kara czasowa albo dyskwalifikacja). Typowo: kurtka z membraną z kapturem, czołówka, folia NRC, telefon z numerem organizatora, gwizdek, zapas wody i jedzenia, czasem rękawiczki i czapka. Zawsze czytaj regulamin konkretnego biegu, listy różnią się nawet na tym samym dystansie w różnych latach."],
  ["Vertical (VK)", "Bieg prawie wyłącznie pod górę, często 1 000 m przewyższenia na 3-5 km. Krótki, ale bardzo intensywny. Fajny jako sprawdzian, mniej fajny jako pierwszy kontakt z górami, bo nie uczy zbiegania."],
  ["Skyrunning", "Biegi wysokogórskie po graniach i stromych, technicznych trasach. W Polsce głównie Tatry. Dla początkujących: najpierw beskidzkie łąki."],
  ["ITRA", "Międzynarodowa federacja trailu. Nadaje biegom punkty (0-6) zależnie od dystansu i przewyższenia oraz prowadzi ranking zawodników. Punkty ITRA są wymagane na niektórych dużych ultra jako dowód doświadczenia."],
  ["UTMB Index i Running Stones", "UTMB Index to ranking wyników w czterech kategoriach (20K, 50K, 100K, 100M) liczony z biegów partnerskich. Running Stones to kamienie zbierane na biegach z serii UTMB World Series; są biletem do loterii na UTMB w Chamonix. Do loterii na 100M potrzebujesz co najmniej jednego kamienia z ostatnich 24 miesięcy i ważnego indeksu w kategorii 100K lub 100M. Więcej kamieni = więcej losów, ale nie gwarancja."],
  ["Kije", "Legalne na większości ultra i biegów górskich, na niektórych krótkich zabronione (regulamin). Na pierwszym biegu do 20 km nie są potrzebne; powyżej i przy stromych podbiegach oszczędzają nogi. Trzeba umieć ich używać zanim wystartujesz."],
  ["Liga Biegów Górskich (Kat. I, II, M)", "Klasyfikacja portalu biegigorskie.pl: biegi ligowe podzielone na kategorie zależnie od rangi i profilu. W kalendarzu pokazujemy kategorię, gdy jest podana. Kat. I to imprezy o najwyższej randze w danym roku."],
  ["Jak czytać regulamin", "Szukasz czterech rzeczy, w tej kolejności: limit czasu (na mecie i na punktach), sprzęt obowiązkowy, punkty z wodą i jedzeniem (co ile kilometrów) oraz profil trasy. Piąta: co się dzieje, gdy się wycofasz (transport z trasy). Resztę możesz przeczytać później."],
  ["Pierwsze 12 tygodni z płaskiego w góry", "Nie zmieniaj wszystkiego naraz. Zostaw swoje tygodniowe kilometry, ale jeden bieg w tygodniu zamień na teren z podbiegami, a co drugi weekend zrób długi marszobieg po górach z plecakiem. Naucz się chodzić pod górę szybko (to nie wstyd, tak robią najlepsi) i zbiegać z krótkim krokiem. Po 8-10 tygodniach wybierz bieg do 15-20 km z oceną 4-5 w naszym kalendarzu."],
];

export default function Slownik() {
  return (
    <article className="max-w-3xl">
      <h1 className="text-3xl font-extrabold mb-1">Słownik początkującego</h1>
      <p className="text-[var(--muted)] mb-6">Pojęcia, które spotkasz w regulaminach i na forach, wyjaśnione tak, jak tłumaczy się je koledze na podbiegu.</p>
      <dl className="space-y-5">{T.map(([k, v]) => <div key={k} className="card"><dt className="font-bold">{k}</dt><dd className="mt-1 text-sm leading-relaxed">{v}</dd></div>)}</dl>
    </article>
  );
}
