import { fetchAny } from "../deep";
import type { Signup } from "../zapisy";

/** elektronicznezapisy.pl strona imprezy: "Zamknięcie rejestracji: 2026.09.27 23:59", "296/330 Zapisani zawodnicy", "ograniczona do 330". */
export async function ezStatus(eventUrl: string, today: string): Promise<Signup | null> {
  const p = await fetchAny(eventUrl);
  if (!p) return null;
  const t = p.text.replace(/\s+/g, " ");
  const close = t.match(/Zamknięcie rejestracji:?\s*(\d{4})\.(\d{2})\.(\d{2})/i);
  const until = close ? `${close[1]}-${close[2]}-${close[3]}` : undefined;
  const cnt = t.match(/(\d+)\s*\/\s*(\d+)\s*Zapisani/i);
  const lim = t.match(/ograniczona do\s*(\d+)/i);
  const registered = cnt ? Number(cnt[1]) : undefined;
  const limit = cnt ? Number(cnt[2]) : lim ? Number(lim[1]) : undefined;
  if (!until && registered === undefined && !limit) return null;
  let status: Signup["status"] = "unknown";
  if (until) status = until >= today ? "open" : "closed";
  if (limit && registered !== undefined && registered >= limit) status = "closed";
  if (status === "unknown" && registered !== undefined) status = "open";
  return { status, until, limit, registered, source: "zapisy", sourceUrl: eventUrl, checkedAt: today };
}
