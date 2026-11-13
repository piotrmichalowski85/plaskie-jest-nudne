import type { Metadata } from "next";
import Link from "next/link";
import { raceById } from "@/lib/data";
import { computeStats, report, first, last, MIN_EVENTS, zl, zlKm, pct, kmTxt, type Rec } from "@/lib/raport-ceny";

const PATH = "/raporty/ile-kosztuje-bieg-gorski";
const URL = `https://plaskiejestnudne.pl${PATH}`;
const CSV = `${PATH}/dane.csv`;
const s = computeStats();
const [b12, b25, b45, bUltra] = s.buckets;
const d = (iso: string) => iso.split("-").reverse().join(".");
const season = report.season.join(" i ");
const months = (days: number) => (days / 30.4).toFixed(1).replace(".", ",");
const cen = (n: number) => `${n} ${n === 1 ? "cennik" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "cenniki" : "cenników"}`;
const kmRatio = (b12.perKmFirst.median / bUltra.perKmFirst.median).toFixed(1).replace(".", ",");

const TITLE = `Ile kosztuje bieg górski w Polsce? Opłaty startowe ${report.season.join("/")}`;
const DESC = `Mediana opłaty startowej w pierwszym progu zapisów: ${zl(b12.first.median)} do 12 km, ${zl(b25.first.median)} na 13-25 km, ${zl(b45.first.median)} na 26-45 km, ${zl(bUltra.first.median)} w ultra. Ostatni próg jest droższy o ${pct(s.rise.median)}. Dane z ${s.regulaminy} regulaminów, do pobrania.`;
export const metadata: Metadata = { title: TITLE, description: DESC, alternates: { canonical: PATH }, openGraph: { title: TITLE, description: DESC, url: PATH, type: "article" } };

const A = "underline font-semibold text-[var(--moss)]";
/** bieg z nazwy: link do strony biegu (jeśli nadal jest w kalendarzu), dystans, edycja i cena z linkiem do regulaminu */
function Named({ r }: { r: Rec }) {
  const page = raceById(r.raceId);
  return (
    <li>
      {page ? <Link className={A} href={`/bieg/${r.raceId}`}>{r.event}</Link> : <strong>{r.event}</strong>}, {r.route} ({kmTxt(r.km)}, edycja {r.editionYear}): <strong>{zl(first(r))}</strong>{last(r) !== first(r) ? ` w pierwszym progu, ${zl(last(r))} w ostatnim` : ""} (<a className="underline" href={r.regulaminUrl} rel="noopener nofollow" target="_blank">regulamin</a>)
    </li>
  );
}

export default function RaportCen() {
  const kpis: [string, string][] = [
    [zl(b25.first.median), `Tyle wynosi mediana opłaty za start na 13-25 km w pierwszym progu zapisów (n=${b25.first.n}); w ostatnim progu to ${zl(b25.last.median)}.`],
    [`+${pct(s.rise.median)}`, `O tyle drożej płaci osoba, która zapisuje się w ostatnim progu zamiast w pierwszym (mediana, n=${s.rise.n}); w złotówkach to ${zl(s.riseZl.median)}.`],
    [`${Math.round(s.days.median)} dni`, `Na tyle dni przed startem kończy się najtańszy próg (mediana, n=${s.days.n}), czyli około ${months(s.days.median)} miesiąca przed biegiem.`],
    [`${zlKm(b12.perKmFirst.median)} za km`, `Tyle w pierwszym progu kosztuje kilometr trasy do 12 km (mediana, n=${b12.perKmFirst.n}); w ultra ${zlKm(bUltra.perKmFirst.median)} (n=${bUltra.perKmFirst.n}), czyli ${kmRatio} raza mniej.`],
    [`+${pct(s.onsiteRise.median)}`, `O tyle droższa od pierwszego progu jest opłata w biurze zawodów tam, gdzie regulamin ją przewiduje (mediana, n=${s.onsiteRise.n}).`],
  ];
  const ld = [
    { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESC, url: URL, mainEntityOfPage: URL, inLanguage: "pl", datePublished: report.generatedAt, dateModified: report.generatedAt, author: { "@type": "Organization", name: "Płaskie jest nudne", url: "https://plaskiejestnudne.pl" }, publisher: { "@type": "Organization", name: "Płaskie jest nudne", url: "https://plaskiejestnudne.pl" }, image: `${URL}/opengraph-image` },
    { "@context": "https://schema.org", "@type": "Dataset", name: `Opłaty startowe biegów górskich i trailowych w Polsce, edycje ${season}`, description: `${s.n} cenników (bieg i dystans) z ${s.regulaminy} regulaminów organizatorów: progi cenowe z terminami, długość trasy, data startu, województwo, adres regulaminu. Każdy cennik sprawdzony z tekstem regulaminu.`, url: URL, license: "https://creativecommons.org/licenses/by/4.0/deed.pl", dateModified: report.generatedAt, temporalCoverage: `${report.season[0]}/${report.season[report.season.length - 1]}`, spatialCoverage: "Polska", inLanguage: "pl", creator: { "@type": "Organization", name: "Płaskie jest nudne", url: "https://plaskiejestnudne.pl" }, distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `https://plaskiejestnudne.pl${CSV}` }] },
  ];
  return (
    <article>
      <header className="max-w-[46rem]">
        <p className="step"><Link href="/raporty" className="underline">Raporty</Link> · dane z regulaminów · edycje {season}</p>
        <h1 className="text-[2.6rem] sm:text-[3.6rem] mt-1">Ile kosztuje bieg górski i trailowy w Polsce</h1>
        <p className="mt-3 text-[1.1rem] leading-relaxed text-[#3d4d34]">Przeczytaliśmy {s.regulaminy} regulaminów biegów górskich i trailowych z edycji {season} i spisaliśmy z nich {s.n} cenników: opłatę za start indywidualny na każdej trasie, próg po progu. Próg to okres zapisów, w którym obowiązuje jedna cena; kolejne progi są zwykle droższe. Poniżej mediany dla czterech przedziałów dystansu, cena za kilometr i to, o ile drożej płaci się za późny zapis.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">Stan na {d(report.generatedAt)}. Kwoty brutto, tak jak w regulaminach. Przy każdej liczbie podajemy n, czyli liczbę cenników, z których jest policzona.</p>
      </header>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-[62rem]" aria-label="Najważniejsze liczby">
        {kpis.map(([num, txt]) => <div key={num} className="card p-4"><p className="kpi">{num}</p><p className="mt-2 text-sm leading-relaxed">{txt}</p></div>)}
      </section>

      <section className="mt-9 max-w-[62rem]">
        <h2 className="text-[2rem]">Opłata startowa według dystansu</h2>
        <p className="mt-1 text-sm text-[var(--muted)] max-w-[46rem]">Pierwszy próg to najniższa cena z regulaminu, ostatni próg to cena pod koniec zapisów internetowych. Rozstęp to cena najtańszego i najdroższego cennika w pierwszym progu.</p>
        <div className="mt-3 card p-0 overflow-x-auto">
          <table className="rpt">
            <thead><tr><th scope="col">Dystans</th><th scope="col">Cenniki (n)</th><th scope="col">Mediana, pierwszy próg</th><th scope="col">Mediana, ostatni próg</th><th scope="col">Rozstęp, pierwszy próg</th><th scope="col">Mediana za km, pierwszy próg</th><th scope="col">Mediana za km, ostatni próg</th></tr></thead>
            <tbody>
              {s.buckets.map((b) => (
                <tr key={b.id}><th scope="row">{b.label}</th><td>{b.n}</td><td><strong>{zl(b.first.median)}</strong></td><td>{zl(b.last.median)}</td><td>{zl(b.first.min)} do {zl(b.first.max)}</td><td>{zlKm(b.perKmFirst.median)}</td><td>{zlKm(b.perKmLast.median)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">Środkowa połowa cenników (bez najtańszej i najdroższej ćwiartki) mieści się w pierwszym progu w przedziałach: {s.buckets.map((b) => `${b.label}: ${zl(b.first.q1)} do ${zl(b.first.q3)}`).join("; ")}.</p>
      </section>

      <div className="mt-8 grid gap-x-10 md:grid-cols-2 max-w-[62rem]">
        <section className="entry">
          <p className="step">01 · Zwlekanie</p>
          <h2 className="text-[1.9rem] mt-1">Ostatni próg jest droższy o {pct(s.rise.median)}</h2>
          <p className="mt-3 leading-relaxed">W {s.nTiered} z {s.n} cenników opłata rośnie z terminem; typowy cennik ma {Math.round(s.tiersCount.median)} progi. Mediana różnicy między pierwszym a ostatnim progiem zapisów internetowych to {pct(s.rise.median)}, czyli {zl(s.riseZl.median)} (n={s.rise.n}). W środkowej połowie cenników wzrost mieści się między {pct(s.rise.q1)} a {pct(s.rise.q3)}.</p>
          <p className="mt-3 leading-relaxed">W przedziałach dystansu: {s.buckets.map((b) => `${b.label} ${pct(b.rise.median)} (${zl(b.riseZl.median)}, n=${b.rise.n})`).join(", ")}. Dopłata w złotówkach rośnie z dystansem, a w procentach jest najwyższa na najkrótszych trasach.</p>
          <p className="mt-3 leading-relaxed">{s.onsiteRise.n} cenników przewiduje osobną opłatę w biurze zawodów. Jest ona wyższa od pierwszego progu o {pct(s.onsiteRise.median)} (mediana) i o {zl(s.onsiteVsLast.median)} od ostatniego progu internetowego. Część organizatorów w ogóle nie przyjmuje zapisów w dniu startu.</p>
        </section>
        <section className="entry">
          <p className="step">02 · Termin</p>
          <h2 className="text-[1.9rem] mt-1">Najtańszy próg kończy się {Math.round(s.days.median)} dni przed startem</h2>
          <p className="mt-3 leading-relaxed">To mediana z {s.days.n} cenników, w których pierwszy próg ma datę końcową: około {months(s.days.median)} miesiąca przed biegiem. W środkowej połowie cenników najniższa cena kończy się między {Math.round(s.days.q3)} a {Math.round(s.days.q1)} dniem przed startem; najkrótszy odstęp w zbiorze to {s.days.min} dni, najdłuższy {s.days.max}.</p>
          <p className="mt-3 leading-relaxed">W przedziałach dystansu: {s.buckets.map((b) => `${b.label} ${Math.round(b.days.median)} dni (n=${b.days.n})`).join(", ")}. Kto planuje start na kolejny sezon, najniższą cenę zwykle znajdzie pół roku wcześniej, a nie na miesiąc przed biegiem.</p>
        </section>
        <section className="entry">
          <p className="step">03 · Cena za kilometr</p>
          <h2 className="text-[1.9rem] mt-1">Krótka trasa: {zlKm(b12.perKmFirst.median)} za km, ultra: {zlKm(bUltra.perKmFirst.median)}</h2>
          <p className="mt-3 leading-relaxed">Opłata rośnie wolniej niż dystans. W pierwszym progu kilometr kosztuje (mediana): {s.buckets.map((b) => `${zlKm(b.perKmFirst.median)} na trasach ${b.label} (n=${b.perKmFirst.n})`).join(", ")}. W ostatnim progu odpowiednio: {s.buckets.map((b) => zlKm(b.perKmLast.median)).join(", ")}.</p>
          <p className="mt-3 leading-relaxed">Stałe koszty organizacji (pomiar czasu, zabezpieczenie medyczne, biuro zawodów, pakiet) rozkładają się na mniej kilometrów, dlatego start na dychę wychodzi drożej w przeliczeniu na kilometr niż start na setkę. To nasza interpretacja, regulaminy nie podają struktury kosztów.</p>
        </section>
        <section className="entry">
          <p className="step">04 · Województwa</p>
          <h2 className="text-[1.9rem] mt-1">{s.woj.length === 3 ? "Ceny w trzech województwach" : "Ceny w województwach"} z wystarczającą próbą</h2>
          <p className="mt-3 leading-relaxed">Województwo pokazujemy od {MIN_EVENTS} biegów z kalendarza, a medianę w przedziale dystansu od {MIN_EVENTS} cenników. Ten warunek spełniają:</p>
          <ul className="mt-2 space-y-1 text-[.95rem] leading-relaxed list-disc pl-5">
            {s.woj.map((w) => <li key={w.woj}><strong>{w.woj}</strong> ({w.events} biegów, {cen(w.n)}), mediana pierwszego progu: {w.buckets.filter((b) => b.first).map((b) => `${b.label} ${zl(b.first!.median)} (n=${b.n})`).join(", ")}{w.buckets.some((b) => !b.first) ? `; pozostałe przedziały mają mniej niż ${MIN_EVENTS} cenników` : ""}.</li>)}
          </ul>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">Pominięte z powodu zbyt małej próby: {s.wojSkipped.map((w) => `${w.woj} (${w.events})`).join(", ")}. Podziału na pasma górskie nie liczymy: żadne pasmo nie ma {MIN_EVENTS} biegów ze sprawdzonym cennikiem.</p>
        </section>
      </div>

      <section className="mt-2 max-w-[62rem] entry">
        <p className="step">05 · Skrajne cenniki</p>
        <h2 className="text-[1.9rem] mt-1">Najtańsze i najdroższe starty w każdym przedziale</h2>
        <p className="mt-1 text-sm text-[var(--muted)] max-w-[46rem]">Według ceny w pierwszym progu. Każda kwota pochodzi z regulaminu podlinkowanego przy biegu; część biegów z edycji {report.season[0]} już się odbyła.</p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {s.buckets.map((b) => (
            <div key={b.id} className="card p-4">
              <h3 className="font-bold text-[1.05rem]">{b.label} <span className="font-normal text-sm text-[var(--muted)]">n={b.n}</span></h3>
              <p className="mt-2 text-sm font-semibold text-[var(--moss-dark)]">Najtańsze</p>
              <ul className="mt-1 space-y-1 text-sm leading-relaxed">{b.cheapest.map((r) => <Named key={r.raceId + r.route} r={r} />)}</ul>
              <p className="mt-3 text-sm font-semibold text-[var(--moss-dark)]">Najdroższe</p>
              <ul className="mt-1 space-y-1 text-sm leading-relaxed">{b.priciest.map((r) => <Named key={r.raceId + r.route} r={r} />)}</ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--muted)] max-w-[46rem]">Wysoka opłata często obejmuje więcej niż sam start, na przykład bilet wstępu do parku narodowego, transport albo opłatę charytatywną wliczoną przez organizatora. Porównujemy opłaty, a nie zawartość pakietów.</p>
      </section>

      <section id="metoda" className="mt-6 card p-5 max-w-[62rem]">
        <h2 className="text-[1.8rem]">Jak liczyliśmy</h2>
        <div className="mt-2 space-y-3 text-[.95rem] leading-relaxed">
          <p><strong>Źródło.</strong> Regulaminy opublikowane przez organizatorów, odczytane od {d(report.readFrom)} do {d(report.readTo)}. Adres regulaminu i data odczytu są podane przy każdym wierszu pliku z danymi.</p>
          <p><strong>Próba.</strong> {s.n} cenników (jedna trasa w jednym biegu) z {s.events} biegów w naszym kalendarzu (biegi górskie, trailowe i przełajowe) i {s.regulaminy} regulaminów; {s.byYear.map((y) => `${y.n} cenników z edycji ${y.year}`).join(", ")}. To nie jest pełna lista biegów w Polsce: w zbiorze są tylko biegi z kalendarza plaskiejestnudne.pl, których organizator opublikował regulamin z kwotami.</p>
          <p><strong>Weryfikacja.</strong> Kwoty z regulaminów odczytuje u nas automat, więc do raportu każdy z {report.counts.regulaminyChecked} regulaminów z cenami został porównany z tekstem: {report.counts.autoRowsChecked} wierszy z kwotami, z czego {report.counts.autoRowsOk} zgodnych, {report.counts.autoRowsWrong} poprawionych i {report.counts.autoRowsOutOfScope} poza zakresem raportu (sztafety, pary, marsze, karnety na cykl, zniżki, regulamin innej edycji). Z {report.counts.pricelistsRead} spisanych cenników {report.counts.pricelistsDropped} odrzuciliśmy, między innymi dlatego, że regulamin podawał sprzeczne kwoty albo trasy nie było w kalendarzu.</p>
          <p><strong>Zasady włączenia.</strong></p>
          <ul className="list-disc pl-5 space-y-1 text-sm">{report.rules.map((r) => <li key={r}>{r}</li>)}</ul>
          <p><strong>Wzory.</strong> Mediana i kwartyle liczone z interpolacją liniową. Cena za kilometr to opłata podzielona przez długość trasy z regulaminu. Wzrost to różnica między ostatnim a pierwszym progiem zapisów internetowych podzielona przez pierwszy próg, tylko dla cenników z co najmniej dwoma progami. Odstęp w dniach to data startu minus ostatni dzień pierwszego progu.</p>
          <p><strong>Ograniczenia.</strong> Opłaty bez pakietów dodatkowych i bez zniżek. Organizator może zmienić regulamin po dacie odczytu. Edycje {season} liczymy razem, dlatego nie porównujemy cen rok do roku: zbiór z poprzedniego sezonu nie istnieje. Biegów o podobnej nazwie i wspólnym regulaminie (cykle) nie łączymy, każdy termin liczy się osobno.</p>
        </div>
      </section>

      <section id="dane" className="mt-6 card p-5 max-w-[62rem] flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-[40rem]">
          <h2 className="text-[1.8rem]">Dane do pobrania i cytowanie</h2>
          <p className="mt-1 text-sm leading-relaxed">Dane można cytować z podaniem źródła i linkiem do tej strony: <span className="font-semibold">plaskiejestnudne.pl{PATH}</span>. Plik CSV zawiera wszystkie {s.n} cenników z progami, datami i adresem regulaminu (licencja <a className="underline" href="https://creativecommons.org/licenses/by/4.0/deed.pl" rel="license noopener" target="_blank">CC BY 4.0</a>). Błąd w danych? Napisz: <a className="underline" href="mailto:kontakt@plaskiejestnudne.pl">kontakt@plaskiejestnudne.pl</a>.</p>
        </div>
        <a href={CSV} className="btn" download>Pobierz CSV ({s.n} wierszy)</a>
      </section>
      {ld.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
    </article>
  );
}
