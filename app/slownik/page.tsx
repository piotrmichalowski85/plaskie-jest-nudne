import type { Metadata } from "next";
import Link from "next/link";
import { slugify } from "@/lib/normalize";
export const metadata: Metadata = { title: "Słownik trailowy dla początkujących", description: "D+, cutoff, ITRA, UTMB Index, Running Stones, vertical, sprzęt obowiązkowy: pojęcia z biegów górskich wyjaśnione prosto.", alternates: { canonical: "/slownik" } };

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
  ["Jak czytać regulamin", "Szukasz czterech rzeczy, w tej kolejności: limit czasu (na mecie i na punktach), sprzęt obowiązkowy, punkty z wodą i jedzeniem (co ile kilometrów) oraz profil trasy. Piąta rzecz: co się dzieje po wycofaniu z biegu, w tym transport z trasy. Resztę możesz przeczytać później."],
  ["Pierwsze 12 tygodni z płaskiego w góry", "Nie zmieniaj wszystkiego naraz. Zostaw swoje tygodniowe kilometry, ale jeden bieg w tygodniu zamień na teren z podbiegami, a co drugi weekend zrób długi marszobieg po górach z plecakiem. Naucz się chodzić pod górę szybko (to nie wstyd, tak robią najlepsi) i zbiegać z krótkim krokiem. Po 8-10 tygodniach wybierz bieg do 15-20 km z oceną \"dobry na start\" w naszym kalendarzu."],
];
const entries = T.map(([k, v], i) => ({ k, v, id: slugify(k), n: String(i + 1).padStart(2, "0") }));

export default function Slownik() {
  return (
    <article>
      <header className="max-w-3xl">
        <h1 className="text-[3rem] sm:text-[3.6rem]">Słownik początkującego biegacza trailowego i górskiego</h1>
        <p className="text-[var(--muted)] mt-1">Pojęcia, które spotkasz w regulaminach i na forach, wyjaśnione prosto, jak na podbiegu.</p>
      </header>

      <nav aria-label="Hasła" className="noscroll mt-5 flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:hidden">
        {entries.map((e) => <a key={e.id} href={`#${e.id}`} className="qchip">{e.k}</a>)}
      </nav>

      <div className="mt-4 md:mt-8 md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10 items-start">
        <nav aria-label="Hasła" className="hidden md:block md:sticky md:top-24">
          <p className="step">Hasła</p>
          <ol className="mt-2 space-y-1">{entries.map((e) => <li key={e.id}><a href={`#${e.id}`} className="toc"><span className="display text-[var(--clay)] w-7 inline-block">{e.n}</span>{e.k}</a></li>)}</ol>
        </nav>

        <dl className="max-w-[46rem]">
          {entries.map((e) => (
            <div key={e.id} id={e.id} className="entry">
              <dt className="grid grid-cols-[3.6rem_1fr] items-start gap-3"><span className="display text-[2.8rem] leading-none text-[var(--clay)]">{e.n}</span><h2 className="text-[1.9rem] leading-none pt-1">{e.k}</h2></dt>
              <dd className="mt-3 md:ml-[3.6rem] md:pl-3 leading-relaxed">{e.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="mt-10 card p-5 flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-[1.8rem]">Słówka znasz. Teraz bieg.</h2><p className="text-sm text-[var(--muted)]">Pięć pytań i trzy biegi dopasowane do Twojego stażu, albo szacunek czasu na konkretnym dystansie.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/kreator" className="btn">Wybierz pierwszy bieg</Link><Link href="/czy-dam-rade" className="btn btn-ghost">Czy dam radę?</Link></div>
      </section>
    </article>
  );
}
