/** Nadchodzące biegi jako JSON do pobrania i cytowania (licencja i data stanu danych w nagłówku pliku). Statyczne, odświeżane przy każdym wdrożeniu danych. */
import { openMeta, openRaces } from "@/lib/open-data";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify({ ...openMeta(), races: openRaces() }, null, 1), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" } });
}
