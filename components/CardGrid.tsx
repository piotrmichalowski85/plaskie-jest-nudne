"use client";
import type { CardRace } from "@/lib/card";
import { PosterCard } from "./PosterCard";

/** Siatka kart jako komponent kliencki: w payloadzie RSC lecą krótkie dane kart (DTO), a nie całe drzewo znaczników każdej karty. */
export function CardGrid({ races, today, cols = "lg:grid-cols-3" }: { races: CardRace[]; today: string; cols?: string }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${cols}`}>{races.map((r) => <PosterCard key={r.id} race={r} today={today} />)}</div>;
}
