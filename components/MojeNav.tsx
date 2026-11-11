"use client";
import Link from "next/link";
import { useSaved } from "@/lib/moje-store";
import { IconHeart } from "./Icons";

/** link "Moje biegi" w nawigacji z licznikiem zapisanych biegów (licznik pojawia się po odczycie listy z przeglądarki) */
export function MojeNav() {
  const n = useSaved().length;
  return (
    <Link href="/moje" prefetch={false} className={`relative inline-flex items-center gap-1.5 whitespace-nowrap${n ? " mr-2 lg:mr-0" : ""}`} aria-label={n ? `Moje biegi, zapisane: ${n}` : "Moje biegi"}>
      <IconHeart filled={n > 0} />
      <span className="hidden lg:inline">Moje biegi</span>
      {n > 0 && <span className="navcount absolute -top-2.5 left-2.5 lg:static" aria-hidden="true">{n}</span>}
    </Link>
  );
}
