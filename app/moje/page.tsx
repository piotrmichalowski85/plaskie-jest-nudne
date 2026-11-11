import type { Metadata } from "next";
import { today } from "@/lib/data";
import { mojeDataUrl } from "@/lib/moje-data";
import { MojeBiegi } from "@/components/MojeBiegi";

// lista jest prywatna i siedzi w przeglądarce, więc strona nie trafia do wyszukiwarek ani do sitemapy
export const metadata: Metadata = { title: "Moje biegi", description: "Twoja lista zapisanych biegów górskich: porównanie w tabeli, eksport do kalendarza i link do udostępnienia. Bez konta.", alternates: { canonical: "/moje" }, robots: { index: false, follow: true } };

export default function Moje() {
  return <MojeBiegi dataUrl={mojeDataUrl()} today={today()} />;
}
