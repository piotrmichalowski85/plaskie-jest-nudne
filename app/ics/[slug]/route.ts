import { allRaces, raceById, today } from "@/lib/data";
import { calendar, icsHeaders } from "@/lib/ics";
export function generateStaticParams() { return allRaces.map((r) => ({ slug: r.id })); }
export const dynamic = "force-static";
export const dynamicParams = false;
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const r = raceById((await params).slug);
  if (!r) return new Response("not found", { status: 404 });
  return new Response(calendar([r], today()), { headers: icsHeaders(`${r.id}.ics`) });
}
