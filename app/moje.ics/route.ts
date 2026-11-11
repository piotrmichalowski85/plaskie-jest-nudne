import type { NextRequest } from "next/server";
import { raceById, today } from "@/lib/data";
import { calendar, icsHeaders } from "@/lib/ics";
import { idsFromParam, SHARE_PARAM } from "@/lib/moje";
import type { Race } from "@/lib/types";
/** /moje.ics?b=<id>,<id>: zapisane biegi ("Moje biegi") jako jeden plik do kalendarza, na wspólnym generatorze iCal */
export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  const races = idsFromParam(req.nextUrl.searchParams.get(SHARE_PARAM)).map(raceById).filter((r): r is Race => !!r).sort((a, b) => a.dateStart.localeCompare(b.dateStart));
  if (!races.length) return new Response("Brak biegów do zapisania w kalendarzu.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex" } });
  return new Response(calendar(races, today()), { headers: { ...icsHeaders("moje-biegi.ics"), "x-robots-tag": "noindex" } });
}
