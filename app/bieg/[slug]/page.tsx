import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { allRaces, raceById } from "@/lib/data";
import { fmtDate, fmtKm, scoreLabel, surfaceLabel } from "@/lib/format";
import { Score } from "@/components/RaceCard";
import { isVertical } from "@/lib/normalize";

export function generateStaticParams() { return allRaces.map((r) => ({ slug: r.id })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = raceById((await params).slug);
  if (!r) return {};
  return { title: `${r.eventName}, ${fmtDate(r.dateStart, r.dateEnd)}`, description: `${r.eventName} w ${r.city}${r.region ? ` (${r.region})` : ""}: dystanse ${r.distancesKm.map(fmtKm).join(", ") || "sprawdź regulamin"}. Dla początkujących: ${scoreLabel(r.beginnerScore)}.` };
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
  const r = raceById((await params).slug);
  if (!r) notFound();
  const ld = { "@context": "https://schema.org", "@type": "SportsEvent", name: r.eventName, startDate: r.dateStart, endDate: r.dateEnd, location: { "@type": "Place", name: r.city, address: { "@type": "PostalAddress", addressLocality: r.city, addressCountry: "PL" } }, url: r.url, sport: "Trail running" };
  return (
    <article className="max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/biegi" className="text-sm font-semibold text-[var(--moss)]">← kalendarz</Link>
      <p className="mt-4 text-sm font-semibold text-[var(--muted)]">{fmtDate(r.dateStart, r.dateEnd)}</p>
      <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{r.eventName}</h1>
      {r.name !== r.eventName && <p className="mt-1 text-[var(--muted)]">{r.name}</p>}
      <p className="mt-2 text-lg">{r.city}{r.region ? `, ${r.region}` : ""}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 items-center">
        <span className="chip">{surfaceLabel[r.surface]}</span>
        {r.category && <span className="chip">Liga Biegów Górskich: {r.category.split(" ")[0]}</span>}
        {r.vertical && <span className="chip">vertical</span>}
        {r.signupOpen && <span className="chip chip-sun">zapisy otwarte{r.participants ? `, ${r.participants} os.` : ""}</span>}
      </div>
      <section className="card mt-6">
        <div className="flex items-center justify-between"><h2 className="font-bold">Dla początkujących</h2><Score s={r.beginnerScore} /></div>
        <p className="mt-2 text-sm">{r.beginnerWhy}</p>
      </section>
      <section className="mt-6">
        <h2 className="font-bold mb-2">Dystanse</h2>
        {r.elevations.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">{r.elevations.map((e) => (
            <li key={e.km} className="card py-3 flex justify-between gap-3"><span className="font-semibold">{fmtKm(e.km)}</span><span className="text-[var(--muted)] text-right">{e.dplus ? (e.approx ? `ok. +${e.dplus} m wg strony organizatora` : `+${e.dplus} m${isVertical(e) ? " (vertical)" : ""}`) : "przewyższenie: patrz regulamin"}{e.limitH ? `, limit ${e.limitH} h` : ""}</span></li>
          ))}</ul>
        ) : <p className="text-[var(--muted)]">Dystanse nieznane, sprawdź u organizatora.</p>}
      </section>
      <section className="mt-6 card">
        <h2 className="font-bold">Zanim się zapiszesz</h2>
        <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
          <li>Sprawdź <strong>limit czasu</strong> (cutoff) na swoim dystansie i punkty kontrolne z limitami pośrednimi.</li>
          <li>Sprawdź <strong>sprzęt obowiązkowy</strong> w regulaminie: w górach zwykle kurtka z membraną, czołówka, folia NRC, telefon, zapas wody i jedzenia.</li>
          <li>Zobacz profil trasy: {r.elevations.some((e) => e.dplus) ? "przewyższenie na kilometr wyżej mówi, ile będzie marszu." : "organizator nie podał przewyższenia, więc spójrz na mapę trasy."}</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          {r.url && <a className="btn" href={r.url} target="_blank" rel="noopener">Strona organizatora / zapisy</a>}
          <Link href="/slownik" className="btn btn-ghost">Słownik pojęć</Link>
        </div>
      </section>
      <p className="mt-6 text-xs text-[var(--muted)]">Źródła: {r.sources.map((s) => <a key={s.name} className="underline mr-2" href={s.url} target="_blank" rel="noopener">{s.name}</a>)}. Dane mogą się zmienić, wiążący jest regulamin organizatora.</p>
    </article>
  );
}
