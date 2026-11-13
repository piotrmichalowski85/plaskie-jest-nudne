import type { Metadata } from "next";
import Link from "next/link";
import { generatedAt } from "@/lib/data";
import { DATASET } from "@/lib/open-data";
export const metadata: Metadata = { title: "O serwisie", description: "Kto robi kalendarz biegów górskich dla początkujących, skąd bierzemy dane i jak liczymy ocenę 'dobry na start'.", alternates: { canonical: "/o-serwisie" } };

const LEVELS: [string, string, string][] = [
  ["lvl-good", "dobry na start", "możesz przyjść z ulicy bez większego ryzyka"],
  ["lvl-ok", "ujdzie na start", "dla biegających regularnie"],
  ["lvl-bad", "zły na start", "długo, stromo albo formuła dla zaawansowanych"],
];

export default function About() {
  return (
    <article>
      <header className="max-w-[46rem]">
        <h1 className="text-[3rem] sm:text-[3.6rem]">O serwisie</h1>
        <p className="mt-3 text-[1.1rem] leading-relaxed text-[#3d4d34]"><strong>Płaskie jest nudne</strong> to niekomercyjny kalendarz biegów górskich, trailowych i przełajowych w Polsce, zbudowany z myślą o osobach, które biegają po płaskim i chcą spróbować gór, ale nie wiedzą, od czego zacząć.</p>
      </header>

      <div className="mt-8 grid gap-x-10 md:grid-cols-2 max-w-[62rem]">
        <section className="entry">
          <p className="step">01 · Kto to robi</p>
          <h2 className="text-[1.9rem] mt-1">Biegacz amator, AI do pomocy</h2>
          <p className="mt-3 leading-relaxed">Piotr Michałowski, biegacz amator, który sam przechodził tę drogę i marzy o starcie na festiwalu UTMB w Chamonix. W prowadzeniu strony pomaga mu oczywiście AI ;) Automaty pobierają kalendarze i liczą ocenę "dobry na start", a ja pilnuję, żeby miało to sens.</p>
        </section>
        <section className="entry">
          <p className="step">02 · Skąd dane</p>
          <h2 className="text-[1.9rem] mt-1">Tylko fakty, zawsze ze źródłem</h2>
          <p className="mt-3 leading-relaxed">Zbieramy wyłącznie fakty: nazwę, datę, miejsce, dystanse i przewyższenia, zawsze z linkiem do źródła i strony organizatora. Z regulaminów automat wyciąga limity czasu, opłaty, godziny startu i sprzęt obowiązkowy (zawsze z linkiem do oryginału). Nie kopiujemy list startowych, wyników ani opisów. Baza odświeża się automatycznie dwa razy w tygodniu. Pogoda przy biegach pochodzi z <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a> (licencja CC BY 4.0).</p>
        </section>
        <section className="entry md:col-span-2">
          <p className="step">03 · Ocena "dobry na start"</p>
          <h2 className="text-[1.9rem] mt-1">Trzy kolory, jedna podpowiedź</h2>
          <p className="mt-3 leading-relaxed max-w-[46rem]">Liczona z najkrótszego dystansu imprezy (verticale pomijamy, na start szukamy raczej krótkich tras z podbiegami), przewyższenia na kilometr i tego, czy impreza daje wybór dystansów.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {LEVELS.map(([cls, name, why]) => <li key={cls} className="card p-4"><span className={`lvl ${cls}`}><span className="dot" />{name}</span><p className="mt-2 text-sm text-[var(--muted)]">{why}</p></li>)}
          </ul>
          <p className="mt-3 text-sm text-[var(--muted)]">To podpowiedź, nie wyrocznia: zawsze sprawdź regulamin i limit czasu.</p>
        </section>
      </div>

      <section id="dane" className="mt-6 card p-5 max-w-[62rem]">
        <h2 className="text-[1.8rem]">Dane do pobrania</h2>
        <p className="mt-1 text-sm leading-relaxed">Lista nadchodzących biegów jest dostępna jako plik: <a className="underline font-semibold text-[var(--moss)]" href="/api/races.json">JSON</a> i <a className="underline font-semibold text-[var(--moss)]" href="/api/races.csv">CSV</a> (termin, miejsce, dystanse, przewyższenia, limity czasu, zapisy, ocena dla początkujących). Nowe biegi publikujemy też w <a className="underline font-semibold text-[var(--moss)]" href="/feed.xml">kanale RSS</a>, a cały kalendarz da się zasubskrybować jako <a className="underline font-semibold text-[var(--moss)]" href="/kalendarz.ics">iCal</a>.</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Stan danych: {generatedAt.slice(0, 10).split("-").reverse().join(".")}. Zestawienie udostępniamy na licencji <a className="underline" href="https://creativecommons.org/licenses/by/4.0/deed.pl" rel="license noopener" target="_blank">CC BY 4.0</a>: można je kopiować i cytować z podaniem źródła (plaskiejestnudne.pl) i linkiem. Terminy, ceny i limity pochodzą od organizatorów, więc przed zapisem trzeba je sprawdzić u źródła.</p>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Dataset", name: DATASET.name, description: DATASET.description, url: "https://plaskiejestnudne.pl/o-serwisie#dane", license: DATASET.license, dateModified: generatedAt, inLanguage: "pl", creator: { "@type": "Organization", name: "Płaskie jest nudne", url: "https://plaskiejestnudne.pl" }, distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: "https://plaskiejestnudne.pl/api/races.json" }, { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: "https://plaskiejestnudne.pl/api/races.csv" }] }) }} />
      </section>

      <section className="mt-6 card p-5 flex flex-wrap items-center justify-between gap-4 max-w-[62rem]">
        <div><h2 className="text-[1.8rem]">Organizujesz bieg?</h2><p className="text-sm text-[var(--muted)]">Jeśli brakuje Twojego biegu albo dane są nieaktualne, napisz. Poprawki wchodzą przy najbliższym odświeżeniu.</p></div>
        <div className="flex flex-wrap gap-2"><a href="mailto:kontakt@plaskiejestnudne.pl" className="btn">kontakt@plaskiejestnudne.pl</a><Link href="/dla-organizatorow" className="btn btn-ghost">Odznaka i widget</Link></div>
      </section>
    </article>
  );
}
