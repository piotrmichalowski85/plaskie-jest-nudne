import type { Metadata } from "next";
import Link from "next/link";
import { computeStats, report } from "@/lib/raport-ceny";

export const metadata: Metadata = { title: "Raporty z danych o biegach górskich i trailowych", description: "Zestawienia liczone z regulaminów i kalendarza biegów górskich w Polsce. Każda liczba ma źródło, liczebność próby i plik do pobrania.", alternates: { canonical: "/raporty" } };

export default function Raporty() {
  const s = computeStats();
  return (
    <article>
      <header className="max-w-[46rem]">
        <h1 className="text-[3rem] sm:text-[3.6rem]">Raporty</h1>
        <p className="mt-2 text-[var(--muted)]">Zestawienia liczone z regulaminów i z naszego kalendarza. Przy każdej liczbie podajemy liczebność próby, a cały zbiór można pobrać i cytować z podaniem źródła.</p>
      </header>
      <div className="mt-6 max-w-[52rem]">
        <section className="entry">
          <p className="step">{report.generatedAt.split("-").reverse().join(".")} · edycje {report.season.join(" i ")}</p>
          <h2 className="text-[1.9rem] mt-1"><Link className="underline decoration-[var(--sun)] decoration-2 underline-offset-4" href="/raporty/ile-kosztuje-bieg-gorski">Ile kosztuje bieg górski i trailowy w Polsce</Link></h2>
          <p className="mt-2 leading-relaxed">Opłaty startowe z {s.regulaminy} regulaminów: {s.n} cenników w podziale na dystanse, cena za kilometr, różnica między pierwszym a ostatnim progiem i termin końca najtańszego progu.</p>
        </section>
      </div>
    </article>
  );
}
