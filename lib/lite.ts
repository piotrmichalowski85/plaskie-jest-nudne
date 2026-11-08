/** Lekki JSON z kartami minionych biegów (dla "pokaż też minione" na /biegi). Nazwa z hashem treści, więc może mieć nagłówek immutable. */
import { createHash } from "node:crypto";
import { allRaces, today } from "./data";
import { toCard } from "./card";

let cache: { name: string; body: string } | null = null;
export function pastLite() {
  if (cache) return cache;
  const t = today();
  const body = JSON.stringify(allRaces.filter((r) => r.dateEnd < t).map((r) => toCard(r, t)));
  return (cache = { name: `races-lite.${createHash("sha1").update(body).digest("hex").slice(0, 10)}.json`, body });
}
export const pastLiteUrl = () => `/data/${pastLite().name}`;
