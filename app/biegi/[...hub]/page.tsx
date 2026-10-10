import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allHubs, hubByPath, hubPath, hubRaces, type Hub } from "@/lib/hubs";
import { PosterCard } from "@/components/PosterCard";
import { today } from "@/lib/data";
import { fmtDate, fmtKm } from "@/lib/format";
import { SITE, year } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() { return allHubs().map((h) => ({ hub: h.path })); }
export async function generateMetadata({ params }: { params: Promise<{ hub: string[] }> }): Promise<Metadata> {
  const h = hubByPath((await params).hub);
  if (!h) return {};
  return { title: h.title, description: h.description, alternates: { canonical: hubPath(h) } };
}

function HubNav({ current, kind, heading }: { current: Hub; kind: Hub["kind"]; heading: string }) {
  const list = allHubs().filter((h) => h.kind === kind);
  if (!list.length) return null;
  return (
    <div>
      <p className="step mb-1.5">{heading}</p>
      <div className="flex flex-wrap gap-1.5">{list.map((h) => <Link key={hubPath(h)} href={hubPath(h)} className={`qchip ${h === current ? "on" : ""}`}>{h.label}</Link>)}</div>
    </div>
  );
}

export default async function HubPage({ params }: { params: Promise<{ hub: string[] }> }) {
  const h = hubByPath((await params).hub);
  if (!h) notFound();
  const { upcoming, past } = hubRaces(h);
  const t = today();
  const ld = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Płaskie jest nudne", item: SITE }, { "@type": "ListItem", position: 2, name: "Kalendarz biegów", item: `${SITE}/biegi` }, { "@type": "ListItem", position: 3, name: h.h1, item: `${SITE}${hubPath(h)}` }] },
    { "@context": "https://schema.org", "@type": "ItemList", name: h.h1, numberOfItems: upcoming.length, itemListElement: upcoming.slice(0, 50).map((r, i) => ({ "@type": "ListItem", position: i + 1, name: `${r.eventName} ${year(r)}`, url: `${SITE}/bieg/${r.id}` })) },
  ];
  return (
    <article>
      {ld.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
      <nav className="text-sm font-semibold text-[var(--moss)]"><Link href="/biegi">← kalendarz</Link></nav>
      <header className="mt-2 max-w-[48rem]">
        <h1 className="text-[2.6rem] sm:text-[3.4rem] leading-none">{h.h1}</h1>
        <p className="mt-3 leading-relaxed text-[#3d4d34]">{h.lead}</p>
      </header>

      <section className="mt-6">
        {upcoming.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((r) => <PosterCard key={r.id} race={r} today={t} />)}</div>
          : <p className="card text-[var(--muted)]">Brak nadchodzących biegów w tym zestawieniu. Zajrzyj do <Link className="underline" href="/biegi">pełnego kalendarza</Link> albo <Link className="underline" href="/kreator">kreatora pierwszego biegu</Link>.</p>}
        <p className="mt-4 text-sm"><Link href={h.kind === "pasmo" && !h.label.includes(" i ") && !/^(Beskidy|Sudety)$/.test(h.label) ? `/biegi?pasmo=${encodeURIComponent(h.label)}` : "/biegi"} className="underline font-semibold text-[var(--moss)]">Pełny kalendarz z filtrami</Link>{h.kind === "temat" && h.path[0] === "dla-poczatkujacych" ? <> albo <Link href="/kreator" className="underline font-semibold text-[var(--moss)]">kreator: pięć pytań i trzy biegi na Twój staż</Link></> : null}.</p>
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[1.9rem]">Odbyte edycje</h2>
          <p className="text-sm text-[var(--muted)] mb-3">Biegi z tego zestawienia, które już się odbyły. Przy większości organizator ogłasza kolejną edycję kilka miesięcy przed startem; sprawdzamy to co dwa tygodnie.</p>
          <ul className="card divide-y divide-[#e3e7e1] p-0">{past.slice(0, 40).map((x) => (
            <li key={x.id}><Link href={`/bieg/${x.id}`} className="flex items-center gap-4 px-4 py-2.5 hover:bg-[#f2f5f1] text-sm">
              <span className="w-28 shrink-0 text-xs font-semibold text-[var(--muted)]">{fmtDate(x.dateStart, x.dateEnd)}</span>
              <span className="min-w-0 flex-1 truncate"><span className="font-semibold">{x.eventName}</span> <span className="text-[var(--muted)]">{x.city}{x.distancesKm.length ? ` · ${x.distancesKm.length > 3 ? `${fmtKm(x.minKm)} - ${fmtKm(x.maxKm)}` : x.distancesKm.map(fmtKm).join(" / ")}` : ""}</span></span>
            </Link></li>
          ))}</ul>
        </section>
      )}

      <section className="mt-10 space-y-5">
        <HubNav current={h} kind="pasmo" heading="Pasma i regiony" />
        <HubNav current={h} kind="miesiac" heading="Miesiące" />
        <HubNav current={h} kind="temat" heading="Zestawienia" />
      </section>
    </article>
  );
}
