import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { upcomingRaces, allRaces } from "@/lib/data";
import { allHubs } from "@/lib/hubs";
import { year } from "@/lib/seo";
import { BadgeSnippet, WeatherBadgeSnippet, WidgetSnippet } from "@/components/Snippets";

export const metadata: Metadata = {
  title: "Dla organizatorów biegów: odznaka, plakietka z pogodą, widget, poprawki danych",
  description: "Organizujesz bieg górski, trailowy albo przełajowy? Sprawdź, co pokazujemy o Twoim biegu, jak zgłosić poprawkę, i wstaw na stronę odznakę \"dobry na start\", plakietkę z pogodą na dzień biegu albo widget z kalendarzem regionu.",
  alternates: { canonical: "/dla-organizatorow" },
};

export default function DlaOrganizatorow() {
  const races = upcomingRaces().sort((a, b) => a.dateStart.localeCompare(b.dateStart)).map((r) => ({ id: r.id, label: `${r.eventName} ${year(r)}, ${r.city}`, good: r.beginnerScore >= 4, name: r.eventName }));
  const hubs = allHubs().filter((h) => ["pasmo", "wojewodztwo", "blisko"].includes(h.kind) || (h.kind === "temat" && h.path[0] === "dla-poczatkujacych")).map((h) => ({
    q: `${h.kind === "pasmo" ? "pasmo" : h.kind === "wojewodztwo" ? "woj" : h.kind === "blisko" ? "miasto" : "zestawienie"}=${h.path[h.path.length - 1]}`,
    label: h.kind === "wojewodztwo" ? `woj. ${h.label}` : h.label,
  }));
  const good = races.filter((r) => r.good).length;
  return (
    <article className="max-w-[52rem]">
      <h1 className="text-[3rem] sm:text-[3.6rem] leading-none">Dla organizatorów</h1>
      <p className="mt-3 leading-relaxed text-[#3d4d34]">Płaskie jest nudne to niekomercyjny kalendarz biegów górskich, trailowych i przełajowych w Polsce, pisany z myślą o osobach, które szukają pierwszego startu w terenie. Mamy {allRaces.length} biegów w bazie, w tym {races.length} nadchodzących, a {good} z nich ma ocenę &quot;dobry na start&quot;. Każdy link do Waszej strony ma parametry UTM (<code>utm_source=plaskiejestnudne.pl</code>), więc ruch od nas widać w Waszych statystykach.</p>

      <section className="entry">
        <h2 className="text-[1.9rem]">Co pokazujemy o Waszym biegu</h2>
        <ul className="mt-3 list-disc pl-5 space-y-1 leading-relaxed">
          <li>termin, miejsce, dystanse i przewyższenia (z GPX, strony trasy, regulaminu albo kalendarzy, zawsze z podanym źródłem),</li>
          <li>z regulaminu: limity czasu, opłaty i progi cenowe, godziny startu, biuro zawodów, bufety, sprzęt obowiązkowy, zasady dotyczące kijów i psów,</li>
          <li>status zapisów, profil trasy i mapę (gdy jest ślad GPX), pogodę w terminie biegu,</li>
          <li>ocenę &quot;dobry na start&quot; liczoną z najkrótszego dystansu i przewyższenia na kilometr (<Link className="underline" href="/o-serwisie">jak liczymy</Link>).</li>
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">Nie kopiujemy list startowych, wyników ani Waszych opisów. Zawsze odsyłamy do oryginalnego regulaminu i do Waszej strony zapisów.</p>
      </section>

      <section className="entry">
        <h2 className="text-[1.9rem]">Poprawki i nowe biegi</h2>
        <p className="mt-3 leading-relaxed">Brakuje biegu, termin się zmienił albo dane są nieaktualne? Napiszcie na <a className="underline font-semibold text-[var(--moss)]" href="mailto:kontakt@plaskiejestnudne.pl?subject=Dodaj%20albo%20popraw%20bieg">kontakt@plaskiejestnudne.pl</a> z linkiem do strony biegu i regulaminu. Poprawki wchodzą przy najbliższym odświeżeniu (dwa razy w tygodniu).</p>
        <p className="mt-2 leading-relaxed">Najbardziej pomaga nam <strong>plik GPX trasy</strong>: z niego liczymy przewyższenie i rysujemy profil oraz mapę, a dla osoby przed pierwszym startem to najważniejsza informacja.</p>
      </section>

      <section className="entry">
        <h2 className="text-[1.9rem]">Odznaka na stronę biegu</h2>
        <p className="mt-3 leading-relaxed">Bieg z zieloną oceną dostaje odznakę &quot;Dobry na start&quot;, pozostałe odznakę &quot;W kalendarzu&quot;. Odznaka prowadzi do strony biegu u nas: z limitem, sprzętem, profilem trasy i kalkulatorem &quot;Czy dam radę?&quot;. Wybierzcie bieg i skopiujcie kod do strony (HTML).</p>
        <div className="card mt-4"><BadgeSnippet races={races} /></div>
      </section>

      <section className="entry" id="plakietka-pogoda">
        <h2 className="text-[1.9rem]">Plakietka z pogodą na dzień biegu</h2>
        <p className="mt-3 leading-relaxed">Przed startem biegacze pytają o pogodę i o to, jak się ubrać. Plakietka pokazuje na Waszej stronie prognozę w miejscu startu na dzień biegu: temperaturę w dzień i w nocy, szansę opadów i wiatr. Prognoza pojawia się na 16 dni przed startem; wcześniej plakietka pokazuje typową pogodę w tym terminie z ostatnich 10 lat, a po biegu informację, że bieg się odbył.</p>
        <p className="mt-2 leading-relaxed">Plakietka aktualizuje się sama: to obrazek pobierany z naszego serwera, a prognozę odświeżamy co kilka godzin (data prognozy jest na plakietce). Prowadzi do strony biegu u nas, bez skryptów i bez ramki. Wybierzcie bieg i skopiujcie kod do strony (HTML).</p>
        <div className="card mt-4"><Suspense fallback={<p className="text-sm text-[var(--muted)]">Wczytuję generator plakietki.</p>}><WeatherBadgeSnippet races={races} /></Suspense></div>
        <p className="mt-2 text-xs text-[var(--muted)]">Na grzbietach zwykle jest chłodniej i bardziej wietrznie niż w miejscu startu. Dane pogodowe: <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a>, licencja <a className="underline" href="https://creativecommons.org/licenses/by/4.0/deed.pl" target="_blank" rel="noopener">CC BY 4.0</a>; podpis źródła jest na plakietce.</p>
      </section>

      <section className="entry">
        <h2 className="text-[1.9rem]">Widget z kalendarzem regionu</h2>
        <p className="mt-3 leading-relaxed">Lista najbliższych biegów z wybranego pasma, województwa albo okolic miasta, do wstawienia na stronę klubu, bloga albo imprezy. Aktualizuje się sama, a każdy bieg prowadzi do jego strony w kalendarzu.</p>
        <div className="card mt-4"><WidgetSnippet hubs={hubs} /></div>
      </section>

      <p className="mt-8 text-sm text-[var(--muted)]">Serwis jest niekomercyjny: nie sprzedajemy wyróżnień i nie przyjmujemy płatności za ocenę.</p>
    </article>
  );
}
