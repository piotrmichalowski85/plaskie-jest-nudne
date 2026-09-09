import type { Metadata } from "next";
import { allRaces, today } from "@/lib/data";
import { Kreator } from "@/components/Kreator";
export const metadata: Metadata = { title: "Wybierz swój pierwszy niepłaski bieg", description: "Pięć pytań i lista biegów górskich lub trailowych w Polsce dopasowanych do Twojego stażu, regionu i terminu." };
export default function KreatorPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-1">Wybierz swój pierwszy niepłaski bieg</h1>
      <p className="text-[var(--muted)] mb-6">Pięć pytań, zero rejestracji. Dostaniesz 3-5 biegów, które da się ukończyć z Twoim stażem.</p>
      <Kreator races={allRaces} today={today()} />
    </div>
  );
}
