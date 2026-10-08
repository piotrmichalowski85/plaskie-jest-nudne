import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "O serwisie" };

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
          <p className="mt-3 leading-relaxed">Zbieramy wyłącznie fakty: nazwę, datę, miejsce, dystanse i przewyższenia, zawsze z linkiem do źródła i strony organizatora. Nie kopiujemy list startowych, wyników ani opisów. Baza odświeża się automatycznie raz w tygodniu.</p>
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

      <section className="mt-6 card p-5 flex flex-wrap items-center justify-between gap-4 max-w-[62rem]">
        <div><h2 className="text-[1.8rem]">Organizujesz bieg?</h2><p className="text-sm text-[var(--muted)]">Jeśli brakuje Twojego biegu albo dane są nieaktualne, napisz. Poprawki wchodzą przy najbliższym odświeżeniu.</p></div>
        <div className="flex flex-wrap gap-2"><a href="mailto:kontakt@plaskiejestnudne.pl" className="btn">kontakt@plaskiejestnudne.pl</a><Link href="/biegi" className="btn btn-ghost">Kalendarz</Link></div>
      </section>
    </article>
  );
}
