import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TERMS, termBySlug } from "@/lib/slownik";
import { allRaces, today } from "@/lib/data";
import { PosterCard } from "@/components/PosterCard";
import { SITE } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() { return TERMS.map((t) => ({ slug: t.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = termBySlug((await params).slug);
  if (!t) return {};
  return { title: t.title, description: t.short, alternates: { canonical: `/slownik/${t.slug}` } };
}

export default async function TermPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = termBySlug((await params).slug);
  if (!t) notFound();
  const d = today();
  const racesBlock = t.races?.(allRaces, d);
  const idx = TERMS.indexOf(t);
  const prev = TERMS[(idx + TERMS.length - 1) % TERMS.length], next = TERMS[(idx + 1) % TERMS.length];
  const ld: unknown[] = [
    { "@context": "https://schema.org", "@type": "DefinedTerm", name: t.term, description: t.short, url: `${SITE}/slownik/${t.slug}`, inDefinedTermSet: { "@type": "DefinedTermSet", name: "Słownik początkującego biegacza trailowego i górskiego", url: `${SITE}/slownik` } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Płaskie jest nudne", item: SITE }, { "@type": "ListItem", position: 2, name: "Słownik trailowy", item: `${SITE}/slownik` }, { "@type": "ListItem", position: 3, name: t.term, item: `${SITE}/slownik/${t.slug}` }] },
  ];
  if (t.faq?.length) ld.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: t.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  return (
    <article>
      {ld.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
      <nav className="text-sm font-semibold text-[var(--moss)]"><Link href="/slownik">← słownik</Link></nav>
      <header className="mt-2 max-w-[46rem]">
        <p className="step">Słownik trailowy</p>
        <h1 className="text-[2.6rem] sm:text-[3.4rem] leading-none mt-1">{t.term}</h1>
        <p className="mt-3 text-[1.05rem] leading-relaxed text-[#3d4d34]">{t.short}</p>
      </header>
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] items-start max-w-[64rem]">
        <div className="space-y-4 leading-relaxed">
          {t.body.map((p, i) => <p key={i}>{p}</p>)}
          <h2 className="text-[1.7rem] pt-2">Na pierwszym starcie</h2>
          <ul className="list-disc pl-5 space-y-1">{t.tips.map((x) => <li key={x}>{x}</li>)}</ul>
          {t.faq && t.faq.length > 0 && (
            <>
              <h2 className="text-[1.7rem] pt-2">Najczęstsze pytania</h2>
              <dl className="space-y-3">{t.faq.map(([q, a]) => <div key={q}><dt className="font-semibold">{q}</dt><dd className="text-[var(--muted)]">{a}</dd></div>)}</dl>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{racesBlock.list.map((r) => <PosterCard key={r.id} race={r} today={d} />)}</div>
        </section>
      )}
      <p className="mt-10 flex justify-between text-sm font-semibold text-[var(--moss)]"><Link href={`/slownik/${prev.slug}`}>← {prev.term}</Link><Link href={`/slownik/${next.slug}`}>{next.term} →</Link></p>
    </article>
  );
}
