import { allRaces, today } from "@/lib/data";
import { calendar, feedRaces, icsHeaders } from "@/lib/ics";
export const dynamic = "force-static";
/** subskrypcyjny feed całego kalendarza (webcal://plaskiejestnudne.pl/kalendarz.ics) */
export function GET() {
  return new Response(calendar(feedRaces(allRaces, today()), today(), "Biegi górskie i trailowe (Płaskie jest nudne)"), { headers: icsHeaders("plaskiejestnudne.ics", true) });
}
