/** Nadchodzące biegi jako CSV (jeden wiersz na dystans), te same dane co /api/races.json. */
import { DATASET, openRaces } from "@/lib/open-data";
import { generatedAt } from "@/lib/data";

export const dynamic = "force-static";

const cell = (v: unknown) => { const s = v === undefined || v === null ? "" : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function GET() {
  const head = ["id", "nazwa", "data_start", "data_koniec", "miejscowosc", "region", "wojewodztwo", "dystans_km", "przewyzszenie_m", "limit_h", "ocena_dla_poczatkujacych", "zapisy", "zapisy_do", "cena_od_pln", "strona_biegu", "strona_organizatora"];
  const rows = openRaces().flatMap((r) => (r.distances.length ? r.distances : [{ km: undefined as number | undefined, elevationGainM: undefined, timeLimitH: undefined }]).map((d) =>
    [r.id, r.name, r.dateStart, r.dateEnd, r.city, r.region, r.voivodeship, d.km, d.elevationGainM, d.timeLimitH, r.beginnerRating, r.signup, r.signupUntil, r.priceFromPln, r.url, r.organizerUrl].map(cell).join(",")));
  const note = `# ${DATASET.name}. ${DATASET.attribution}, licencja ${DATASET.licenseName}. Stan danych: ${generatedAt.slice(0, 10)}`;
  return new Response([note, head.join(","), ...rows].join("\n") + "\n", { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="biegi-gorskie-plaskiejestnudne.csv"', "cache-control": "public, max-age=3600" } });
}
