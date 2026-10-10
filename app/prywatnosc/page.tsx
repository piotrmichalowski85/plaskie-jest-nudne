import type { Metadata } from "next";
export const metadata: Metadata = { title: "Polityka prywatności", description: "Jakie dane zbiera plaskiejestnudne.pl (prawie żadne), jak działają statystyki i jak się z nami skontaktować.", alternates: { canonical: "/prywatnosc" } };
export default function Prywatnosc() {
  return (
    <article className="max-w-2xl space-y-4 text-sm leading-relaxed">
      <h1 className="text-[3rem]">Polityka prywatności</h1>
      <p>Serwis plaskiejestnudne.pl prowadzi Piotr Michałowski (kontakt: <a className="underline" href="mailto:kontakt@plaskiejestnudne.pl">kontakt@plaskiejestnudne.pl</a>). Serwis jest niekomercyjny i nie wymaga zakładania konta.</p>
      <h2 className="text-xl font-bold">Jakie dane zbieramy</h2>
      <p>Nie zbieramy danych osobowych. Nie ma formularzy rejestracji, list startowych ani wyników. Jeśli napiszesz do nas maila, przetwarzamy Twój adres wyłącznie po to, żeby odpowiedzieć.</p>
      <h2 className="text-xl font-bold">Statystyki (Google Analytics)</h2>
      <p>Za Twoją zgodą korzystamy z Google Analytics 4, żeby wiedzieć, które strony i narzędzia są używane. Adresy IP są anonimizowane, nie łączymy statystyk z tożsamością. Bez zgody nie powstaje żadne ciasteczko analityczne, a serwis działa normalnie. Zgodę można zmienić, usuwając dane strony w przeglądarce. Administratorem danych w Google Analytics jest Google Ireland Ltd.</p>
      <h2 className="text-xl font-bold">Lokalizacja</h2>
      <p>Filtr "blisko mnie" w kalendarzu pyta przeglądarkę o Twoje położenie tylko po kliknięciu i używa go wyłącznie w Twojej przeglądarce. Nie wysyłamy go na serwer i nie zapisujemy.</p>
      <h2 className="text-xl font-bold">Ustawienia zapamiętane w przeglądarce</h2>
      <p>W pamięci przeglądarki (localStorage) trzymamy jedynie Twoją decyzję w sprawie statystyk.</p>
      <h2 className="text-xl font-bold">Mapy</h2>
      <p>Mapy pochodzą z OpenFreeMap (dane OpenStreetMap). Przeglądarka pobiera kafelki mapy bezpośrednio z ich serwerów, co przekazuje im Twój adres IP, tak jak każdej odwiedzanej stronie.</p>
      <h2 className="text-xl font-bold">Skąd dane o biegach</h2>
      <p>Zbieramy publicznie dostępne fakty o zawodach (nazwa, termin, miejsce, dystanse, przewyższenia, regulamin) z kalendarzy, platform zapisów i stron organizatorów. Organizatorzy mogą prosić o poprawki i usunięcie pod adresem kontaktowym.</p>
      <p className="text-[var(--muted)]">Ostatnia zmiana: 30.09.2026.</p>
    </article>
  );
}
