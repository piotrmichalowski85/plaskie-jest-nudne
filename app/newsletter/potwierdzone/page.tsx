import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Zapis potwierdzony", robots: { index: false, follow: true } };

export default function Potwierdzone() {
  return (
    <article className="max-w-[40rem]">
      <h1 className="text-[3rem] sm:text-[3.6rem]">Zapis potwierdzony</h1>
      <p className="mt-3 text-[1.1rem] leading-relaxed text-[#3d4d34]">Gotowe. Pierwsza lista nowych biegów przyjdzie w najbliższy poniedziałek rano, o ile w kalendarzu coś się zmieni.</p>
      <p className="mt-6 flex flex-wrap gap-3"><Link href="/biegi" className="btn">Przejdź do kalendarza</Link><Link href="/biegi/dla-poczatkujacych" className="btn btn-ghost">Biegi dobre na start</Link></p>
    </article>
  );
}
