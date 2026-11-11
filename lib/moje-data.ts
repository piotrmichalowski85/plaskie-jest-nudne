/** Dane dla /moje: karty wszystkich biegów (także minionych, bo zapisany bieg nie znika z listy po starcie) plus sprzęt i opłaty do porównywarki. Nazwa z hashem treści, nagłówek immutable. */
import { createHash } from "node:crypto";
import { allRaces, today } from "./data";
import { toCard, type CardRace } from "./card";
import { feeLines } from "./fees";

export type MojeRace = CardRace & {
  gear?: string[]; // sprzęt obowiązkowy z regulaminu
  fees?: [string, string][]; // opłata per dystans: [dystans albo "", opis progów]
  feesYear?: number; // opłaty z regulaminu innej edycji (rok), więc mogą się zmienić
};

let cache: { name: string; body: string } | null = null;
export function mojeLite() {
  if (cache) return cache;
  const t = today();
  const list: MojeRace[] = allRaces.map((r) => {
    const fees = r.info?.fees?.length ? feeLines(r, r.dateEnd < t, t) : undefined;
    return { ...toCard(r, t), ...(r.gear?.length ? { gear: r.gear } : {}), ...(fees ? { fees } : {}), ...(fees && r.info?.stale && r.info.year ? { feesYear: r.info.year } : {}) };
  });
  const body = JSON.stringify(list);
  return (cache = { name: `moje.${createHash("sha1").update(body).digest("hex").slice(0, 10)}.json`, body });
}
export const mojeDataUrl = () => `/data/${mojeLite().name}`;
