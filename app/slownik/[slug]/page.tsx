import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TERMS, termBySlug, type Block } from "@/lib/slownik";
import { allRaces, today } from "@/lib/data";
import { CardGrid } from "@/components/CardGrid";
import { toCard } from "@/lib/card";
import { SITE } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() { return TERMS.map((t) => ({ slug: t.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = termBySlug((await params).slug);
  if (!t) return {};
  return { title: t.title, description: t.description ?? t.short, alternates: { canonical: `/slownik/${t.slug}` } };
}

/** tekst z linkami zapisanymi jako [etykieta](/adres) albo [etykieta](https://...) */
function rich(text: string) {
  return text.split(/(\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (!m) return part;
    return m[2].startsWith("/") ? <Link key={i} href={m[2]} className="underline text-[var(--moss)] font-semibold">{m[1]}</Link> : <a key={i} href={m[2]} rel="noopener" className="underline text-[var(--moss)] font-semibold">{m[1]}</a>;
  });
}
function BlockView({ b }: { b: Block }) {
  if ("h" in b) return <h2 className="text-[1.7rem] pt-2">{b.h}</h2>;
  if ("p" in b) return <p>{rich(b.p)}</p>;
  if ("ul" in b) return <ul className="list-disc pl-5 space-y-1.5">{b.ul.map((x) => <li key={x}>{rich(x)}</li>)}</ul>;
  if ("ol" in b) return <ol className="list-decimal pl-5 space-y-1.5">{b.ol.map((x) => <li key={x}>{rich(x)}</li>)}</ol>;
  return (
    <figure>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white">
        <table className="w-full text-sm">
          <thead><tr>{b.table.head.map((h) => <th key={h} scope="col" className="px-3 py-2 text-left align-bottom font-semibold text-[var(--moss-dark)] border-b border-[var(--line)]">{h}</th>)}</tr></thead>
          <tbody>{b.table.rows.map((row) => <tr key={row[0]} className="border-b border-[var(--line)] last:border-0">{row.map((c, i) => i === 0 ? <th key={i} scope="row" className="px-3 py-2 text-left font-semibold whitespace-nowrap">{c}</th> : <td key={i} className="px-3 py-2">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {b.table.note && <figcaption className="mt-2 text-sm text-[var(--muted)]">{b.table.note}</figcaption>}
    </figure>
  );
}

export default async function TermPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = termBySlug((await params).slug);
  if (!t) notFound();
  const d = today();
  const racesBlock = t.races?.(allRaces, d);
  const full = t.full?.(allRaces, d);
  const faq = full?.faq ?? t.faq;
  const lead = full ? t.body[0] : t.short; // pełne hasło: odpowiedź w 2-3 zdaniach od razu pod nagłówkiem
  const body = full ? t.body.slice(1) : t.body;
  const idx = TERMS.indexOf(t);
  const prev = TERMS[(idx + TERMS.length - 1) % TERMS.length], next = TERMS[(idx + 1) % TERMS.length];
  const ld: unknown[] = [
    { "@context": "https://schema.org", "@type": "DefinedTerm", name: t.term, description: t.short, url: `${SITE}/slownik/${t.slug}`, inDefinedTermSet: { "@type": "DefinedTermSet", name: "Słownik początkującego biegacza trailowego i górskiego", url: `${SITE}/slownik` } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Płaskie jest nudne", item: SITE }, { "@type": "ListItem", position: 2, name: "Słownik trailowy", item: `${SITE}/slownik` }, { "@type": "ListItem", position: 3, name: t.term, item: `${SITE}/slownik/${t.slug}` }] },
  ];
  if (faq?.length) ld.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  return (
    <article>
      {ld.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
      <nav className="text-sm font-semibold text-[var(--moss)]"><Link href="/slownik">← słownik</Link></nav>
      <header className="mt-2 max-w-[46rem]">
        <p className="step">Słownik trailowy</p>
        <h1 className="text-[2.6rem] sm:text-[3.4rem] leading-none mt-1">{t.h1 ?? t.term}</h1>
        <p className="mt-3 text-[1.05rem] leading-relaxed text-[#3d4d34]">{lead}</p>
      </header>
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] items-start max-w-[64rem]">
        <div className="space-y-4 leading-relaxed">
          {body.map((p, i) => <p key={i}>{p}</p>)}
          {full?.blocks.map((b, i) => <BlockView key={i} b={b} />)}
          {t.tips.length > 0 && (
            <>
              <h2 className="text-[1.7rem] pt-2">Na pierwszym starcie</h2>
              <ul className="list-disc pl-5 space-y-1">{t.tips.map((x) => <li key={x}>{x}</li>)}</ul>
            </>
          )}
          {faq && faq.length > 0 && (
            <>
              <h2 className="text-[1.7rem] pt-2">Najczęstsze pytania</h2>
              <dl className="space-y-3">{faq.map(([q, a]) => <div key={q}><dt className="font-semibold">{q}</dt><dd className="text-[var(--muted)]">{a}</dd></div>)}</dl>
            </>
          )}
        </div>
        <aside className="space-y-4 md:sticky md:top-20">
          {t.related && t.related.length > 0 && <div className="card text-sm"><p className="step mb-2">Zobacz też</p><ul className="space-y-1.5">{t.related.map((r) => <li key={r.href}><Link className="underline text-[var(--moss)] font-semibold" href={r.href}>{r.label}</Link></li>)}</ul></div>}
          <div className="card text-sm"><p className="step mb-2">Inne hasła</p><ul className="space-y-1.5">{TERMS.filter((x) => x !== t).map((x) => <li key={x.slug}><Link className="hover:text-[var(--moss)]" href={`/slownik/${x.slug}`}>{x.term}</Link></li>)}</ul></div>
        </aside>
      </div>
      {racesBlock && racesBlock.list.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[1.9rem] mb-3">{racesBlock.heading}</h2>
          {racesBlock.note && <p className="-mt-1 mb-4 max-w-[46rem] text-sm text-[var(--muted)]">{racesBlock.note}</p>}
          <CardGrid races={racesBlock.list.map((r) => toCard(r, d))} today={d} cols="lg:grid-cols-4" />
        </section>
      )}
      <p className="mt-10 flex justify-between text-sm font-semibold text-[var(--moss)]"><Link href={`/slownik/${prev.slug}`}>← {prev.term}</Link><Link href={`/slownik/${next.slug}`}>{next.term} →</Link></p>
    </article>
  );
}
