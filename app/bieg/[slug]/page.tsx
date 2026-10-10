import type { Metadata } from "next";
import type { Race } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { allRaces, raceById, today } from "@/lib/data";
import { fmtDate, fmtKm, scoreLabel, surfaceLabel, level, levelLabel, outLink } from "@/lib/format";
import { isVertical, distanceLevel } from "@/lib/normalize";
import { geoFor } from "@/lib/geo";
import { Score, SignupChip } from "@/components/RaceCard";
import { RaceMap } from "@/components/RaceMap";
import { ShareButton } from "@/components/ShareButton";
import { ElevationProfile } from "@/components/ElevationProfile";
import { loadTrack } from "@/lib/gpxdata";
import { RegionArt } from "@/components/RegionArt";
import { IconExternal, IconDoc, IconCalendar, IconPin } from "@/components/Icons";
import { raceTitle, raceDescription, raceJsonLd, nextEditionOf, prevEditionOf, year } from "@/lib/seo";
import { hubsForRace, hubPath } from "@/lib/hubs";

const srcLabel: Record<string, string> = { gpx: "policzone z GPX", trasa: "wg podstrony \"Trasa\" organizatora", organizator: "wg strony organizatora", regulamin: "wg regulaminu", kalendarz: "wg kalendarza" };

export function generateStaticParams() { return allRaces.map((r) => ({ slug: r.id })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = raceById((await params).slug);
  if (!r) return {};
  return { title: raceTitle(r), description: raceDescription(r, today()), alternates: { canonical: `/bieg/${r.id}` }, openGraph: { type: "website", title: `${r.eventName} ${year(r)}`, description: raceDescription(r, today()) } };
}

/** podobne biegi: ten sam region (3 pkt), zbliżony termin do 45 dni (2), podobny dystans (1), ten sam teren (1), ta sama ocena dla początkujących (1); do 6 */
function similar(r: Race) {
  const t = new Date(r.dateStart).getTime();
  return allRaces
    .filter((x) => x.id !== r.id && x.dateEnd >= today())
    .map((x) => {
      const why: string[] = [];
      let s = 0;
      if (r.region && x.region === r.region) { s += 3; why.push(r.region); }
      const days = Math.abs(new Date(x.dateStart).getTime() - t) / 86400000;
      if (days <= 45) { s += 2; why.push("podobny termin"); }
      if (x.distancesKm.some((a) => r.distancesKm.some((b) => Math.abs(a - b) <= Math.max(3, b * 0.2)))) { s += 1; why.push("podobny dystans"); }
      if (x.surface === r.surface) { s += 1; }
      if (level(x.beginnerScore) === level(r.beginnerScore)) { s += 1; }
      return { x, s, why, days };
    })
    .filter((y) => y.s >= 3 && y.why.length).sort((a, b) => b.s - a.s || a.days - b.days).slice(0, 6);
}

/** FAQ generowane z danych biegu (tylko pytania, na które mamy odpowiedź) */
function raceFaq(r: Race, past: boolean): [string, string][] {
  const q: [string, string][] = [];
  const y = r.dateStart.slice(0, 4);
  q.push([`Kiedy ${past ? "odbył się" : "odbywa się"} ${r.eventName} ${y}?`, `${fmtDate(r.dateStart, r.dateEnd)}, ${r.city}${r.region ? `, ${r.region}` : ""}.${past ? " Ta edycja już się odbyła." : ""}`]);
  if (r.distancesKm.length) q.push([`Jakie dystanse ma ${r.eventName}?`, `${r.distancesKm.map(fmtKm).join(", ")}.${r.elevations.some((e) => e.dplus) ? ` Przewyższenie: ${r.elevations.filter((e) => e.dplus).map((e) => `${fmtKm(e.km)} +${e.dplus} m`).join(", ")}.` : ""}`]);
  const lim = r.elevations.filter((e) => e.limitH);
  if (lim.length) q.push([`Jaki jest limit czasu na ${r.eventName}?`, `${lim.map((e) => `${fmtKm(e.km)}: ${e.limitH} h`).join(", ")} (wg regulaminu; limity pośrednie na punktach mogą być ostrzejsze).`]);
  if (!past && r.signup && r.signup.status !== "unknown") q.push([`Czy zapisy na ${r.eventName} ${y} są otwarte?`, r.signup.status === "open" ? `Tak, zapisy są otwarte${r.signup.until ? ` do ${r.signup.until.split("-").reverse().join(".")}` : ""}${r.signup.limit ? `, limit ${r.signup.limit} miejsc` : ""}${r.signup.registered ? `, zapisanych ${r.signup.registered}` : ""}.` : "Nie, według naszych danych zapisy są zamknięte (termin minął albo limit wyczerpany)."]);
  q.push([`Czy ${r.eventName} nadaje się na pierwszy bieg górski?`, `${scoreLabel(r.beginnerScore).replace(/^./, (c) => c.toUpperCase())}. ${r.beginnerWhy}`]);
  if (r.gear?.length) q.push([`Jaki sprzęt obowiązkowy jest na ${r.eventName}?`, `Według regulaminu: ${r.gear.join(", ")}. Przed startem sprawdź aktualny regulamin.`]);
  return q;
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
  const r = raceById((await params).slug);
  if (!r) notFound();
  const g = geoFor(r.city);
  const ld = raceJsonLd(r, g ?? undefined, today());
  const past = r.dateEnd < today();
  const nextEd = past ? nextEditionOf(r, allRaces) : undefined;
  const prevEd = prevEditionOf(r, allRaces);
  const hubs = hubsForRace(r);
  const faq = raceFaq(r, past);
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  const sim = similar(r);
  const withGpx = r.elevations.filter((e) => e.gpx);
  const mapTrackEl = withGpx.length ? withGpx[withGpx.length - 1] : undefined; // najdłuższy ślad na mapie
  const mapTrack = mapTrackEl ? loadTrack(mapTrackEl.gpx!) : null;
  const profiles = withGpx.map((e) => ({ e, t: loadTrack(e.gpx!) })).filter((x) => x.t);
  const lvlDot: Record<string, string> = { good: "lvl-good", ok: "lvl-ok", bad: "lvl-bad" };
  return (
    <article>
      {[...ld, faqLd].map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
      <Link href="/biegi" className="text-sm font-semibold text-[var(--moss)]">← kalendarz</Link>
      <RegionArt region={r.region} surface={r.surface} className="mt-3 w-full h-28 sm:h-36 rounded-2xl border border-[#e3e7e1]" />
      <header className="mt-4">
        <p className="text-sm font-semibold text-[var(--muted)]">{fmtDate(r.dateStart, r.dateEnd)}{r.region ? ` · ${r.region}` : ""}</p>
        <h1 className="text-[3rem] sm:text-[4rem]">{r.eventName} <span className="text-[var(--muted)]">{year(r)}</span></h1>
        {r.name !== r.eventName && <p className="mt-1 text-[var(--muted)]">{r.name}</p>}
        <p className="mt-2 flex flex-wrap gap-1.5"><span className="chip">{surfaceLabel[r.surface]}</span>{r.vertical && <span className="chip">vertical</span>}{r.provisional ? <span className="chip" style={{ background: "var(--sun)", color: "#3b2a00" }}>termin wstępny</span> : <SignupChip race={r} long />}</p>
        {r.provisional && <p className="mt-2 text-sm text-[var(--muted)]">Termin odczytany ze strony organizatora, jeszcze niepotwierdzony w kalendarzach. Dystanse i przewyższenia pochodzą z poprzedniej edycji, a zapisów pewnie jeszcze nie ma. Sprawdź u organizatora.</p>}
      </header>
      {past && (
        <div className="mt-4 card border-[var(--sun)] bg-[#fff8e1] text-sm">
          <p><strong>Ta edycja już się odbyła</strong> ({fmtDate(r.dateStart, r.dateEnd)}).{" "}
          {nextEd ? <>Kolejna edycja: <Link className="underline font-semibold text-[var(--moss)]" href={`/bieg/${nextEd.id}`}>{nextEd.eventName} {year(nextEd)}, {fmtDate(nextEd.dateStart, nextEd.dateEnd)}</Link>.</> : <>Terminu kolejnej edycji jeszcze nie ma. Sprawdzamy stronę organizatora co dwa tygodnie i dopiszemy go tutaj; tymczasem zobacz <Link className="underline font-semibold text-[var(--moss)]" href="/biegi">nadchodzące biegi</Link>{r.region ? <> albo <Link className="underline font-semibold text-[var(--moss)]" href={`/biegi?pasmo=${encodeURIComponent(r.region)}`}>inne biegi: {r.region}</Link></> : null}.</>}</p>
        </div>
      )}
      {!past && prevEd && <p className="mt-3 text-sm text-[var(--muted)]">Poprzednia edycja: <Link className="underline" href={`/bieg/${prevEd.id}`}>{prevEd.eventName} {year(prevEd)}</Link>.</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
        {/* szeroka kolumna: czy jadę */}
        <div className="space-y-6 min-w-0">
          <section className="card">
            <div className="flex items-center justify-between gap-3"><h2 className="text-[1.6rem]">Dla początkujących</h2><Score s={r.beginnerScore} /></div>
            <p className="mt-2 text-sm">{r.beginnerWhy}</p>
          </section>

          <section>
            <h2 className="text-[1.8rem] mb-2">Dystanse</h2>
            {r.elevations.length ? (
              <ul className="grid gap-2">{r.elevations.map((e) => {
                const l = distanceLevel(e);
                return (
                  <li key={e.km} className="card py-3 flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold whitespace-nowrap"><span className={`lvl ${lvlDot[l]} !px-1.5`} title={levelLabel[l]}><span className="dot" /></span>{fmtKm(e.km)}{isVertical(e) ? <span className="chip">vertical</span> : null}</span>
                    <span className="text-[var(--muted)] text-right text-sm">
                      <span title={e.dplusSource ? srcLabel[e.dplusSource] + (e.dplusCheckedAt ? `, sprawdzono ${e.dplusCheckedAt}` : "") : undefined}>{e.dplus ? `+${e.dplus} m` : "przewyższenie nieznane"}</span>{e.limitH ? `, limit ${e.limitH} h` : ""}
                      {e.note ? <span className="block text-xs">{e.note}</span> : null}
                      {e.dplusStale ? <span className="block text-xs">dane z poprzedniej edycji</span> : null}
                    </span>
                  </li>
                );
              })}</ul>
            ) : <p className="text-[var(--muted)]">Dystanse nieznane, sprawdź u organizatora.</p>}
            <p className="mt-3"><Link href={`/czy-dam-rade?bieg=${r.id}`} className="btn btn-ghost">Czy dam radę na tym biegu? Policz swój czas</Link></p>
            <p className="mt-2 text-xs text-[var(--muted)]">Kropka przy dystansie: zielona = dobry na start, żółta = ujdzie na start, czerwona = zły na start. Plakietka imprezy odpowiada najłatwiejszemu dystansowi.</p>
          </section>

          {profiles.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[1.8rem]">Profil trasy</h2>
              {profiles.map(({ e, t }) => <div key={e.km}><p className="text-xs text-[var(--muted)] mb-1">{fmtKm(e.km)}{e.dplusStale ? " (plik GPX z poprzedniej edycji)" : ""}</p><ElevationProfile profile={t!.profile} km={t!.km} dplus={t!.dplus} /></div>)}
            </section>
          )}

          <section className="card">
            <h2 className="text-[1.6rem]">Zanim się zapiszesz</h2>
            <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
              <li>Sprawdź <strong>limit czasu</strong> (cutoff) na swoim dystansie i punkty kontrolne z limitami pośrednimi.</li>
              {r.gear ? (
                <li><strong>Sprzęt obowiązkowy według regulaminu</strong> (wyciąg automatyczny z regulaminu, przed startem sprawdź oryginał): <ul className="mt-1 grid gap-0.5 sm:grid-cols-2 list-[square] pl-5">{r.gear.map((x) => <li key={x}>{x}</li>)}</ul></li>
              ) : (
                <li>Sprawdź <strong>sprzęt obowiązkowy</strong> w regulaminie: w górach zwykle potrzebne są kurtka przeciwdeszczowa z kapturem, czołówka, folia NRC, telefon, zapas wody i jedzenia.</li>
              )}
              <li>Zobacz profil trasy: {r.elevations.some((e) => e.dplus) ? "przewyższenie przy dystansie podpowiada, ile może być marszu." : "organizator nie podał przewyższenia, więc spójrz na mapę trasy."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[1.8rem] mb-2">Najczęstsze pytania</h2>
            <dl className="card space-y-3 text-sm">{faq.map(([q, a]) => <div key={q}><dt className="font-semibold">{q}</dt><dd className="text-[var(--muted)] mt-0.5">{a}</dd></div>)}</dl>
          </section>

          {sim.length > 0 && (
            <section>
              <h2 className="text-[1.8rem] mb-2">Podobne biegi</h2>
              <ul className="card divide-y divide-[#e3e7e1] p-0">{sim.map(({ x, why }) => (
                <li key={x.id}><Link href={`/bieg/${x.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-[#f2f5f1]">
                  <span className="w-24 shrink-0 text-xs font-semibold text-[var(--muted)]">{fmtDate(x.dateStart, x.dateEnd)}</span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold truncate">{x.eventName}</span><span className="block text-xs text-[var(--muted)] truncate">{x.city} · {x.distancesKm.length > 3 ? `${fmtKm(x.minKm)} - ${fmtKm(x.maxKm)}` : x.distancesKm.map(fmtKm).join(" / ")} · {why.join(", ")}</span></span>
                  <span className="shrink-0"><Score s={x.beginnerScore} /></span>
                </Link></li>
              ))}</ul>
            </section>
          )}
        </div>

        {/* wąska kolumna: fakty i akcje */}
        <aside className="space-y-4 md:sticky md:top-20">
          <div className="card text-sm flex items-start gap-2">
            <span className="text-[var(--moss)] mt-0.5"><IconPin /></span>
            <span><span className="font-semibold">{r.city}{r.region ? `, ${r.region}` : ""}</span>{g && <><br /><a className="underline text-[var(--moss)]" href={`https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`} target="_blank" rel="noopener">Jak dojechać</a></>}</span>
          </div>
          {g || mapTrack ? <RaceMap lat={g?.lat ?? mapTrack!.coords[0][1]} lng={g?.lng ?? mapTrack!.coords[0][0]} label={`${r.eventName}, ${r.city}`} track={mapTrack?.coords} /> : <div className="card text-sm text-[var(--muted)]">Mapa: brak współrzędnych dla "{r.city}".</div>}
          {mapTrack && mapTrackEl && <p className="text-xs text-[var(--muted)]">Na mapie: ślad GPX dystansu {fmtKm(mapTrackEl.km)}{mapTrackEl.dplusStale ? " (plik z poprzedniej edycji)" : ""}.</p>}
          <div className="grid gap-2">
            {r.url && <a className="btn justify-center" href={outLink(r.url, "strona-biegu")} target="_blank" rel="noopener"><IconExternal />Strona organizatora i zapisy</a>}
            {r.regulaminUrl && <a className="btn btn-ghost justify-center" href={outLink(r.regulaminUrl, "regulamin")} target="_blank" rel="noopener"><IconDoc />Regulamin{/\.pdf/i.test(r.regulaminUrl) ? " (PDF)" : ""}</a>}
            <a className="btn btn-ghost justify-center" href={`/ics/${r.id}`}><IconCalendar />Dodaj do kalendarza</a>
            <ShareButton title={r.eventName} />
          </div>
        </aside>
      </div>
      {hubs.length > 0 && <p className="mt-8 flex flex-wrap items-center gap-1.5 text-sm"><span className="text-[var(--muted)] mr-1">Zobacz też:</span>{hubs.map((h) => <Link key={hubPath(h)} href={hubPath(h)} className="qchip">{h.label}</Link>)}</p>}
      <p className="mt-4 text-sm">Nie wiesz, co znaczy D+, cutoff albo sprzęt obowiązkowy? Zajrzyj do <Link href="/slownik" className="underline font-semibold text-[var(--moss)]">słownika trailowego</Link>.</p>
      <p className="mt-2 text-sm text-[var(--muted)]">Organizujesz ten bieg i widzisz braki albo błędy? Napisz na <a className="underline" href={`mailto:kontakt@plaskiejestnudne.pl?subject=${encodeURIComponent(`Poprawka: ${r.eventName} (${r.dateStart})`)}`}>kontakt@plaskiejestnudne.pl</a>, poprawimy przy najbliższym odświeżeniu.</p>
    </article>
  );
}
