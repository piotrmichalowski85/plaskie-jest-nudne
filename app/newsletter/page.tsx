import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";
import { newsletterLive } from "@/components/NewsletterSignup";
import { buildIssue } from "@/lib/newsletter";
import { today } from "@/lib/data";

export const metadata: Metadata = {
  title: "Newsletter: nowe biegi górskie i trailowe co poniedziałek",
  description: "Raz w tygodniu krótka lista z kalendarza biegów górskich: nowe biegi, ruszające zapisy i terminy, które zaraz mijają. Bez reklam, wypis jednym kliknięciem.",
  alternates: { canonical: "/newsletter" },
};

export default function Newsletter() {
  const issue = buildIssue(today());
  const n = issue.sections.reduce((a, s) => a + s.races.length, 0);
  return (
    <article>
      <header className="max-w-[46rem]">
        <h1 className="text-[3rem] sm:text-[3.6rem]">Newsletter</h1>
        <p className="mt-3 text-[1.1rem] leading-relaxed text-[#3d4d34]">Kalendarz odświeża się sam dwa razy w tygodniu. Żeby nie trzeba było tu zaglądać i zgadywać, co doszło, w poniedziałek rano wysyłamy krótką listę zmian z ostatnich siedmiu dni.</p>
      </header>

      <div className="mt-6 max-w-[46rem]">{newsletterLive() ? <NewsletterForm where="newsletter" /> : <p className="card text-sm">Zapis ruszy w najbliższych dniach. Do tego czasu te same zmiany są na stronie <Link href="/zmiany" className="underline font-semibold text-[var(--moss)]">Co nowego</Link>.</p>}</div>

      <div className="mt-8 grid gap-x-10 md:grid-cols-2 max-w-[62rem]">
        <section className="entry">
          <p className="step">01 · Co przychodzi</p>
          <h2 className="text-[1.9rem] mt-1">Tylko to, co się zmieniło</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li><strong>Nowe w kalendarzu:</strong> biegi, które doszły w ostatnim tygodniu, z terminem, miejscem i dystansami.</li>
            <li><strong>Ruszyły zapisy:</strong> biegi, na które od niedawna można się zapisać.</li>
            <li><strong>Zapisy kończą się w ciągu dwóch tygodni:</strong> terminy, które łatwo przegapić.</li>
            <li><strong>Zmiany terminów</strong> oraz kilka biegów łagodnych dla debiutanta, na które jest jeszcze czas się przygotować.</li>
          </ul>
        </section>
        <section className="entry">
          <p className="step">02 · Jak często</p>
          <h2 className="text-[1.9rem] mt-1">W poniedziałek albo wcale</h2>
          <p className="mt-2 text-sm leading-relaxed">Jeden mail tygodniowo, w poniedziałek rano. Gdy w kalendarzu nic się nie zmieniło, nie wysyłamy niczego. Bez reklam i bez ofert: w mailu są wyłącznie biegi i linki do ich stron w serwisie.</p>
        </section>
        <section className="entry">
          <p className="step">03 · Jak to wygląda</p>
          <h2 className="text-[1.9rem] mt-1">Wydanie z dzisiejszych danych</h2>
          <p className="mt-2 text-sm leading-relaxed">{issue.empty ? "W ostatnim tygodniu w kalendarzu nic się nie zmieniło, więc dziś wydania by nie było." : `Gdyby wydanie wychodziło dziś, miałoby temat "${issue.subject}" i ${n} ${n === 1 ? "bieg" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "biegi" : "biegów"}.`} <Link href="/newsletter/przyklad" className="underline font-semibold text-[var(--moss)]">Zobacz przykładowe wydanie</Link>.</p>
        </section>
        <section className="entry">
          <p className="step">04 · Twój adres</p>
          <h2 className="text-[1.9rem] mt-1">Zapis z potwierdzeniem, wypis jednym kliknięciem</h2>
          <p className="mt-2 text-sm leading-relaxed">Po zapisie przychodzi mail z prośbą o potwierdzenie; bez kliknięcia adres nie trafia na listę. Adresu używamy tylko do tego newslettera i nikomu go nie przekazujemy. Szczegóły w <Link href="/prywatnosc#newsletter" className="underline">polityce prywatności</Link>.</p>
        </section>
      </div>
      <p className="mt-8 text-sm text-[var(--muted)]">Wolisz bez maila? Te same zmiany są na stronie <Link href="/zmiany" className="underline">Co nowego</Link>, a cały kalendarz da się zasubskrybować w aplikacji kalendarza na stronie <Link href="/biegi" className="underline">Biegi</Link>.</p>
    </article>
  );
}
