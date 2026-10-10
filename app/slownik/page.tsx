import type { Metadata } from "next";
import Link from "next/link";
import { TERMS } from "@/lib/slownik";
export const metadata: Metadata = { title: "Słownik trailowy dla początkujących", description: "D+, cutoff, ITRA, UTMB Index, Running Stones, vertical, sprzęt obowiązkowy: pojęcia z biegów górskich wyjaśnione prosto.", alternates: { canonical: "/slownik" } };

const entries = TERMS.map((t, i) => ({ k: t.term, v: t.short, id: t.slug, n: String(i + 1).padStart(2, "0"), more: t.body.length > 1 || t.tips.length > 0 }));

export default function Slownik() {
  return (
    <article>
      <header className="max-w-3xl">
        <h1 className="text-[3rem] sm:text-[3.6rem]">Słownik początkującego biegacza trailowego i górskiego</h1>
        <p className="text-[var(--muted)] mt-1">Pojęcia, które spotkasz w regulaminach i na forach, wyjaśnione prosto, jak na podbiegu.</p>
      </header>

      <nav aria-label="Hasła" className="noscroll mt-5 flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:hidden">
        {entries.map((e) => <a key={e.id} href={`#${e.id}`} className="qchip">{e.k}</a>)}
      </nav>

      <div className="mt-4 md:mt-8 md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10 items-start">
        <nav aria-label="Hasła" className="hidden md:block md:sticky md:top-24">
          <p className="step">Hasła</p>
          <ol className="mt-2 space-y-1">{entries.map((e) => <li key={e.id}><a href={`#${e.id}`} className="toc"><span className="display text-[var(--clay)] w-7 inline-block">{e.n}</span>{e.k}</a></li>)}</ol>
        </nav>

        <dl className="max-w-[46rem]">
          {entries.map((e) => (
            <div key={e.id} id={e.id} className="entry">
              <dt className="grid grid-cols-[3.6rem_1fr] items-start gap-3"><span className="display text-[2.8rem] leading-none text-[var(--clay)]">{e.n}</span><h2 className="text-[1.9rem] leading-none pt-1"><Link href={`/slownik/${e.id}`} className="hover:text-[var(--moss)]">{e.k}</Link></h2></dt>
              <dd className="mt-3 md:ml-[3.6rem] md:pl-3 leading-relaxed">{e.v} <Link href={`/slownik/${e.id}`} className="font-semibold text-[var(--moss)] whitespace-nowrap">Więcej →</Link></dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="mt-10 card p-5 flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-[1.8rem]">Słówka znasz. Teraz bieg.</h2><p className="text-sm text-[var(--muted)]">Pięć pytań i trzy biegi dopasowane do Twojego stażu, albo szacunek czasu na konkretnym dystansie.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/kreator" className="btn">Wybierz pierwszy bieg</Link><Link href="/czy-dam-rade" className="btn btn-ghost">Czy dam radę?</Link></div>
      </section>
    </article>
  );
}
