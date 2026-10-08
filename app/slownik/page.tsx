import type { Metadata } from "next";
export const metadata: Metadata = { title: "Słownik trailowy dla początkujących", description: "D+, cutoff, ITRA, UTMB Index, Running Stones, vertical, sprzęt obowiązkowy: pojęcia z biegów górskich wyjaśnione prosto." };

const T: [string, string][] = [
  ["Bieg górski a trail", "Bieg górski zwykle ma wyraźny podbieg i zbieg, często jest krótszy i stromy. Trail to bieg w terenie naturalnym: po ścieżkach, lasach, łąkach, pagórkach, czasem górach. Przełaj to krótki bieg terenowy po miękkiej nawierzchni, często w mieście albo parku. Granice są płynne, w kalendarzu oznaczamy je szacunkowo."],
  ["Przewyższenie (D+, plus)", "Suma wszystkich metrów w górę na trasie. 20 km z +800 m oznacza, że łącznie wspinasz się na 800 metrów, niezależnie od tego, ile razy schodzisz. Ważniejsza od samego D+ jest jego gęstość: 40 m na kilometr to spokojny trail, 60-80 m na kilometr to góry, powyżej 100 m na kilometr często oznacza dużo marszu. W kalendarzu pokazujemy D+ dla najkrótszego dystansu, jeśli organizator go podał."],
  ["Limit czasu (cutoff)", "Godzina lub czas, do którego trzeba dotrzeć na metę albo punkt kontrolny. Na pierwszym biegu wybieraj hojne limity: 3 godziny na 15 km w górach dają spokój, 2 godziny to już ściganie. Limity pośrednie na punktach potrafią być bardziej bolesne niż limit na mecie."],
  ["Sprzęt obowiązkowy", "Lista rzeczy, które trzeba mieć przy sobie przez cały bieg. Organizator może ją sprawdzić, a za braki grozi kara czasowa albo dyskwalifikacja. Typowo: kurtka przeciwdeszczowa z kapturem, czołówka, folia NRC, telefon z numerem organizatora, gwizdek, zapas wody i jedzenia, czasem rękawiczki i czapka. Zawsze czytaj regulamin konkretnego biegu, bo listy różnią się nawet na tym samym dystansie w różnych latach."],
  ["Vertical (VK)", "Bieg prawie wyłącznie pod górę, zwykle z około 1 000 m przewyższenia na maksymalnie 5 km. Krótki, ale bardzo intensywny. Dobry jako sprawdzian, słaby jako pierwszy kontakt z górami, bo nie uczy zbiegania."],
  ["Skyrunning", "Biegi wysokogórskie po graniach i stromych, technicznych trasach. W Polsce głównie Tatry. Dla początkujących: najpierw beskidzkie łąki."],
  ["ITRA", "International Trail Running Association, międzynarodowa federacja trailu. Ocenia trudność biegów w punktach 0-6 na podstawie dystansu i przewyższenia (tzw. km-effort) oraz prowadzi ranking osób startujących (Performance Index). Punkty ITRA bywają wymagane przy zapisach na długie biegi jako dowód doświadczenia."],
  ["UTMB Index i Running Stones", "UTMB Index to wskaźnik wyników w czterech kategoriach (20K, 50K, 100K, 100M), liczony z biegów UTMB World Series i biegów partnerskich (UTMB Index races). Running Stones to kamienie zdobywane na biegach UTMB World Series i Majors; są biletem do loterii finałów w Chamonix. Do loterii trzeba mieć co najmniej jeden kamień z ostatnich 24 miesięcy i ważny indeks w wymaganej kategorii: na OCC wystarczy 20K, na CCC 50K, na UTMB 100K lub 100M. Więcej kamieni to więcej losów, ale nie gwarancja startu."],
  ["Kije", "Dozwolone na większości ultra i biegów górskich, na niektórych krótkich trasach zabronione. Zawsze sprawdź regulamin. Na pierwszym biegu do 20 km nie są potrzebne; powyżej i przy stromych podbiegach oszczędzają nogi. Trzeba umieć ich używać, zanim wystartujesz."],
  ["Liga Biegów Górskich (Kat. I, II, M)", "Klasyfikacja portalu biegigorskie.pl: biegi ligowe podzielone na kategorie zależnie od rangi i profilu. W kalendarzu pokazujemy kategorię, gdy jest podana. Kat. I to imprezy o najwyższej randze w danym roku."],
  ["Jak czytać regulamin", "Szukasz czterech rzeczy, w tej kolejności: limit czasu (na mecie i na punktach), sprzęt obowiązkowy, punkty z wodą i jedzeniem (co ile kilometrów) oraz profil trasy. Piąta rzecz: co się dzieje po wycofaniu z biegu, w tym transport z trasy. Resztę możesz przeczytać później."],
  ["Pierwsze 12 tygodni z płaskiego w góry", "Nie zmieniaj wszystkiego naraz. Zostaw swoje tygodniowe kilometry, ale jeden bieg w tygodniu zamień na teren z podbiegami, a co drugi weekend zrób długi marszobieg po górach z plecakiem. Naucz się chodzić pod górę szybko (to nie wstyd, tak robią najlepsi) i zbiegać z krótkim krokiem. Po 8-10 tygodniach wybierz bieg do 15-20 km z oceną 4-5 w naszym kalendarzu."],
];

export default function Slownik() {
  return (
    <article className="max-w-3xl">
      <h1 className="text-[3rem] mb-1">Słownik początkującego biegacza trailowego i górskiego</h1>
      <p className="text-[var(--muted)] mb-6">Pojęcia, które spotkasz w regulaminach i na forach, wyjaśnione prosto, jak na podbiegu.</p>
      <dl className="space-y-5">{T.map(([k, v]) => <div key={k} className="card"><dt className="font-bold">{k}</dt><dd className="mt-1 text-sm leading-relaxed">{v}</dd></div>)}</dl>
    </article>
  );
}
