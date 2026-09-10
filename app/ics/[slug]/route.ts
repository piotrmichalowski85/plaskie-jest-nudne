import { allRaces, raceById } from "@/lib/data";
export function generateStaticParams() { return allRaces.map((r) => ({ slug: r.id })); }
export const dynamic = "force-static";
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const r = raceById((await params).slug);
  if (!r) return new Response("not found", { status: 404 });
  const d = (s: string) => s.replace(/-/g, "");
  const end = new Date(r.dateEnd); end.setDate(end.getDate() + 1);
  const esc = (s: string) => s.replace(/[\;,]/g, (c) => "\\" + c);
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//plaskiejestnudne.pl//PL", "BEGIN:VEVENT", `UID:${r.id}@plaskiejestnudne.pl`, `DTSTAMP:${d(new Date().toISOString().slice(0, 10))}T000000Z`, `DTSTART;VALUE=DATE:${d(r.dateStart)}`, `DTEND;VALUE=DATE:${d(end.toISOString().slice(0, 10))}`, `SUMMARY:${esc(r.eventName)}`, `LOCATION:${esc(r.city + (r.region ? ", " + r.region : ""))}`, `DESCRIPTION:${esc(`Dystanse: ${r.distancesKm.join(", ")} km. https://plaskiejestnudne.pl/bieg/${r.id}`)}`, `URL:https://plaskiejestnudne.pl/bieg/${r.id}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${r.id}.ics"` } });
}
