import Link from "next/link";
import { RegionArt } from "@/components/RegionArt";
export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto text-center py-8">
      <RegionArt region="Tatry" className="w-full h-36 rounded-2xl border border-[#e3e7e1]" label="Góry" />
      <h1 className="mt-6 text-[3rem]">Zgubiona ścieżka</h1>
      <p className="mt-2 text-[var(--muted)]">Tej strony nie ma. Bieg mógł zmienić nazwę albo termin, a wtedy dostaje nowy adres.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/biegi" className="btn">Kalendarz biegów</Link>
        <Link href="/kreator" className="btn btn-ghost">Wybierz swój pierwszy bieg</Link>
      </div>
    </div>
  );
}
