import { today } from "@/lib/data";
import { allHubs, hubByPath } from "@/lib/hubs";
import { calendar, feedRaces, icsHeaders } from "@/lib/ics";
import { allRaces } from "@/lib/data";
/** feed per hub; publiczny adres /biegi/<hub>.ics (rewrite w next.config.ts) */
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() { return allHubs().filter((h) => h.kind !== "temat" || h.path[0] !== "ten-weekend").map((h) => ({ hub: h.path })); }
export async function GET(_: Request, { params }: { params: Promise<{ hub: string[] }> }) {
  const h = hubByPath((await params).hub);
  if (!h) return new Response("not found", { status: 404 });
  return new Response(calendar(feedRaces(allRaces.filter(h.filter), today()), today(), `${h.h1} (Płaskie jest nudne)`), { headers: icsHeaders(`${h.path.join("-")}.ics`, true) });
}
