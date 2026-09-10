import type { Metadata } from "next";
export const metadata: Metadata = { title: "O serwisie" };
export default function About() {
  return (
    <article className="prose max-w-2xl space-y-4">
      <h1 className="text-3xl font-extrabold">O serwisie</h1>
      <p><strong>Płaskie jest nudne</strong> to niekomercyjny kalendarz biegów górskich, trailowych i przełajowych w Polsce, zbudowany z myślą o osobach, które biegają po płaskim i chcą spróbować gór, ale nie wiedzą, od czego zacząć.</p>
      <h2 className="text-xl font-bold">Kto to robi</h2>
      <p>Piotr Michałowski, biegacz amator, który sam przechodził tę drogę i marzy o starcie w Chamonix. Serwis prowadzą w dużej mierze automaty (pobieranie kalendarzy, liczenie oceny "dobry na start"), a ja pilnuję, żeby miało to sens.</p>
      <h2 className="text-xl font-bold">Skąd dane</h2>
      <p>Agregujemy wyłącznie fakty: nazwę, datę, miejsce, dystanse i przewyższenia, zawsze z linkiem do źródła i do strony organizatora. Nie kopiujemy list startowych, wyników ani opisów. Źródła: kalendarz biegigorskie.pl (Liga Biegów Górskich), elektronicznezapisy.pl, strony organizatorów. Baza odświeża się automatycznie raz w tygodniu.</p>
      <h2 className="text-xl font-bold">Ocena "dobry na start"</h2>
      <p>Liczona z najkrótszego dystansu imprezy, przewyższenia na kilometr i formuły biegu (vertical, kilka dystansów). Trzy stopnie: zielony "dobry na start" (możesz przyjść z płaskiego bez większego ryzyka), żółty "ujdzie" (dla biegających regularnie), czerwony "zły na start" (długo, stromo albo formuła dla zaawansowanych). To podpowiedź, nie wyrocznia: zawsze sprawdź regulamin i limit czasu.</p>
      <h2 className="text-xl font-bold">Organizujesz bieg?</h2>
      <p>Jeśli brakuje Twojego biegu albo dane są nieaktualne, napisz: <a className="underline" href="mailto:kontakt@plaskiejestnudne.pl">kontakt@plaskiejestnudne.pl</a>. Poprawki wchodzą przy najbliższym odświeżeniu.</p>
    </article>
  );
}
