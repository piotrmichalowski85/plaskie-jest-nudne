import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { allRaces, raceById, today } from "@/lib/data";
import { fmtDate, fmtKm, scoreLabel, surfaceLabel, level, levelLabel } from "@/lib/format";
import { isVertical, distanceLevel } from "@/lib/normalize";
import { geoFor } from "@/lib/geo";
import { Score, RaceCard } from "@/components/RaceCard";
import { RaceMap } from "@/components/RaceMap";
import { ShareButton } from "@/components/ShareButton";
import { ElevationProfile } from "@/components/ElevationProfile";
import { loadTrack } from "@/lib/gpxdata";

const srcLabel: Record<string, string> = { gpx: "policzone z GPX", trasa: "wg podstrony Trasa organizatora", organizator: "wg strony organizatora", regulamin: "wg regulaminu", kalendarz: "wg kalendarza" };

export function generateStaticParams() { return allRaces.map((r) => ({ slug: r.id })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = raceById((await params).slug);
  if (!r) return {};
  return { title: `${r.eventName}, ${fmtDate(r.dateStart, r.dateEnd)}`, description: `${r.eventName} w ${r.city}${r.region ? ` (${r.region})` : ""}: dystanse ${r.distancesKm.map(fmtKm).join(", ") || "sprawdź regulamin"}. Dla początkujących: ${scoreLabel(r.beginnerScore)}.` };
}

function similar(id: string, region: string, kms: number[], date: string) {
  const t = new Date(date).getTime();
  return allRaces
    .filter((x) => x.id !== id && x.dateEnd >= today() && Math.abs(new Date(x.dateStart).getTime() - t) < 60 * 86400000)
    .map((x) => ({ x, s: (region && x.region === region ? 2 : 0) + (x.distancesKm.some((a) => kms.some((b) => Math.abs(a - b) <= Math.max(3, b * 0.2))) ? 1 : 0) }))
    .filter((y) => y.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((y) => y.x);
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
  const r = raceById((await params).slug);
  if (!r) notFound();
  const g = geoFor(r.city);
  const ld = { "@context": "https://schema.org", "@type": "SportsEvent", name: r.eventName, startDate: r.dateStart, endDate: r.dateEnd, location: { "@type": "Place", name: r.city, address: { "@type": "PostalAddress", addressLocality: r.city, addressCountry: "PL" }, ...(g ? { geo: { "@type": "GeoCoordinates", latitude: g.lat, longitude: g.lng } } : {}) }, url: r.url, sport: "Trail running" };
  const sim = similar(r.id, r.region, r.distancesKm, r.dateStart);
  const withGpx = r.elevations.filter((e) => e.gpx);
  const mapTrackEl = withGpx.length ? withGpx[withGpx.length - 1] : undefined; // najdłuższy ślad na mapie
  const mapTrack = mapTrackEl ? loadTrack(mapTrackEl.gpx!) : null;
  const profiles = withGpx.map((e) => ({ e, t: loadTrack(e.gpx!) })).filter((x) => x.t);
  const lvlDot: Record<string, string> = { good: "lvl-good", ok: "lvl-ok", bad: "lvl-bad" };
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/biegi" className="text-sm font-semibold text-[var(--moss)]">← kalendarz</Link>
      <header className="mt-3">
        <p className="text-sm font-semibold text-[var(--muted)]">{fmtDate(r.dateStart, r.dateEnd)}{r.region ? ` · ${r.region}` : ""}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{r.eventName}</h1>
        {r.name !== r.eventName && <p className="mt-1 text-[var(--muted)]">{r.name}</p>}
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
        {/* szeroka kolumna: czy jadę */}
        <div className="space-y-6 min-w-0">
          <section className="card">
            <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Dla początkujących</h2><Score s={r.beginnerScore} /></div>
            <p className="mt-2 text-sm">{r.beginnerWhy}</p>
          </section>

          <section>
            <h2 className="font-bold mb-2">Dystanse</h2>
            {r.elevations.length ? (
              <ul className="grid gap-2">{r.elevations.map((e) => {
                const l = distanceLevel(e);
                return (
                  <li key={e.km} className="card py-3 flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold whitespace-nowrap"><span className={`lvl ${lvlDot[l]} !px-1.5`} title={levelLabel[l]}><span className="dot" /></span>{fmtKm(e.km)}{isVertical(e) ? <span className="chip">vertical</span> : null}</span>
                    <span className="text-[var(--muted)] text-right text-sm">
                      {e.dplus ? `+${e.dplus} m` : "przewyższenie nieznane (organizator nie podał; sprawdź na stronie biegu lub w regulaminie)"}{e.limitH ? `, limit ${e.limitH} h` : ""}
                      {e.dplus && e.dplusSource && e.dplusSource !== "kalendarz" ? <span className="block text-xs">{e.dplusSourceUrl ? <a className="underline" href={e.dplusSourceUrl} target="_blank" rel="noopener">{srcLabel[e.dplusSource]}</a> : srcLabel[e.dplusSource]}{e.dplusCheckedAt ? `, spr. ${e.dplusCheckedAt.slice(8, 10)}.${e.dplusCheckedAt.slice(5, 7)}` : ""}{e.dplusStale ? ", uwaga: strona opisuje inną edycję" : ""}</span> : null}
                    </span>
                  </li>
                );
              })}</ul>
            ) : <p className="text-[var(--muted)]">Dystanse nieznane, sprawdź u organizatora.</p>}
            <p className="mt-2 text-xs text-[var(--muted)]">Kropka przy dystansie: zielona = dobry na start, żółta = ujdzie, czerwona = zły na start. Plakietka imprezy odpowiada najłatwiejszemu dystansowi.</p>
          </section>

          {profiles.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold">Profil trasy</h2>
              {profiles.map(({ e, t }) => <div key={e.km}><p className="text-xs text-[var(--muted)] mb-1">{fmtKm(e.km)}{e.dplusStale ? " (plik GPX z poprzedniej edycji)" : ""}</p><ElevationProfile profile={t!.profile} km={t!.km} dplus={t!.dplus} /></div>)}
            </section>
          )}

          <section className="card">
            <h2 className="font-bold">Zanim się zapiszesz</h2>
            <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
              <li>Sprawdź <strong>limit czasu</strong> (cutoff) na swoim dystansie i punkty kontrolne z limitami pośrednimi.</li>
              {r.gear ? (
                <li><strong>Sprzęt obowiązkowy wg regulaminu</strong> (wyciąg automatyczny z regulaminu, przed startem sprawdź oryginał): <ul className="mt-1 grid gap-0.5 sm:grid-cols-2 list-[square] pl-5">{r.gear.map((x) => <li key={x}>{x}</li>)}</ul></li>
              ) : (
                <li>Sprawdź <strong>sprzęt obowiązkowy</strong> w regulaminie: w górach zwykle kurtka z membraną, czołówka, folia NRC, telefon, zapas wody i jedzenia.</li>
              )}
              <li>Zobacz profil trasy: {r.elevations.some((e) => e.dplus) ? "przewyższenie przy dystansie mówi, ile będzie marszu." : "organizator nie podał przewyższenia, więc spójrz na mapę trasy."}</li>
            </ul>
          </section>

          {sim.length > 0 && (
            <section>
              <h2 className="font-bold mb-2">Podobne biegi w okolicy terminu</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sim.map((x) => <RaceCard key={x.id} race={x} />)}</div>
            </section>
          )}
        </div>

        {/* wąska kolumna: fakty i akcje */}
        <aside className="space-y-4 md:sticky md:top-20">
          {g || mapTrack ? <RaceMap lat={g?.lat ?? mapTrack!.coords[0][1]} lng={g?.lng ?? mapTrack!.coords[0][0]} label={`${r.eventName}, ${r.city}`} track={mapTrack?.coords} /> : <div className="card text-sm text-[var(--muted)]">Mapa: brak współrzędnych dla "{r.city}".</div>}
          {mapTrack && mapTrackEl && <p className="text-xs text-[var(--muted)]">Na mapie: ślad GPX dystansu {fmtKm(mapTrackEl.km)}{mapTrackEl.dplusStale ? " (plik z poprzedniej edycji)" : ""}.</p>}
          <div className="card text-sm">
            <p className="font-semibold">{r.city}{r.region ? `, ${r.region}` : ""}</p>
            {g && <a className="underline text-[var(--moss)]" href={`https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`} target="_blank" rel="noopener">Jak dojechać</a>}
          </div>
          <div className="grid gap-2">
            {r.url && <a className="btn justify-center" href={r.url} target="_blank" rel="noopener">Strona organizatora / zapisy</a>}
            {r.regulaminUrl && <a className="btn btn-ghost justify-center" href={r.regulaminUrl} target="_blank" rel="noopener">Regulamin{/\.pdf/i.test(r.regulaminUrl) ? " (PDF)" : ""}</a>}
            <a className="btn btn-ghost justify-center" href={`/ics/${r.id}`}>Dodaj do kalendarza</a>
            <ShareButton title={r.eventName} />
          </div>
          <div className="card text-sm space-y-1">
            <p><span className="chip">{surfaceLabel[r.surface]}</span> {r.vertical && <span className="chip">vertical</span>}</p>
            {r.category && <p>Liga Biegów Górskich: {r.category.split(" ")[0]}</p>}
            {r.signupOpen && <p className="font-semibold text-[#1f6b33]">Zapisy otwarte{r.participants ? `, ${r.participants} os. na liście` : ""}</p>}
            <p className="text-xs text-[var(--muted)] pt-1">Źródła: {r.sources.map((s) => <a key={s.name + s.url} className="underline mr-2" href={s.url} target="_blank" rel="noopener">{s.name}</a>)}</p>
            <p className="text-xs text-[var(--muted)]">Dane mogą się zmienić, wiążący jest regulamin organizatora.</p>
          </div>
        </aside>
      </div>
      <p className="mt-8 text-sm"><Link href="/slownik" className="underline">Słownik trailowy</Link>: D+, cutoff, sprzęt obowiązkowy i inne pojęcia.</p>
    </article>
  );
}
