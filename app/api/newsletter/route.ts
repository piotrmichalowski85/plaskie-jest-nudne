/**
 * Zapis na newsletter: e-mail trafia do Brevo jako prośba o potwierdzenie (double opt-in). Kontakt pojawia się na liście dopiero po kliknięciu w mailu.
 * Bez klucza (BREVO_API_KEY) albo bez identyfikatorów listy i szablonu (data/newsletter.json) zwracamy 503, a formularz pokazuje "zapis chwilowo niedostępny".
 */
import { NextResponse } from "next/server";
import { brevo, newsletterIds } from "@/lib/brevo";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
// prosty limit na adres IP w obrębie jednej instancji funkcji: 5 prób na 10 minut (boty i pomyłki; pełna ochrona to potwierdzenie mailem)
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) ?? []).filter((t) => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}
const res = (status: number, code: string) => NextResponse.json({ ok: status === 200, code }, { status, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  let body: { email?: unknown; website?: unknown; t?: unknown };
  try { body = await req.json(); } catch { return res(400, "bad_request"); }
  // pole-pułapka (ukryte dla ludzi) albo formularz wysłany szybciej niż w 1,5 s: odpowiadamy jak przy sukcesie, niczego nie zapisujemy
  if ((typeof body.website === "string" && body.website) || (typeof body.t === "number" && body.t < 1500)) return res(200, "ok");
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email)) return res(400, "bad_email");
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res(429, "too_many");
  const key = process.env.BREVO_API_KEY;
  const { listId, optinTemplateId } = newsletterIds();
  if (!key || !listId || !optinTemplateId) return res(503, "unavailable");
  try {
    const r = await brevo("/contacts/doubleOptinConfirmation", key, { body: { email, includeListIds: [listId], templateId: optinTemplateId, redirectionUrl: "https://plaskiejestnudne.pl/newsletter/potwierdzone" } });
    // adres już zapisany i potwierdzony: Brevo zwraca błąd, a my nie zdradzamy, czy ktoś jest na liście
    if (r.ok || r.status === 400 && /already|exist/i.test(String(r.json.message ?? ""))) return res(200, "ok");
    console.error("newsletter: Brevo", r.status, String(r.json.code ?? ""), String(r.json.message ?? "").slice(0, 200));
    return res(502, "upstream");
  } catch (e) {
    console.error("newsletter: wyjątek", (e as Error).message);
    return res(502, "upstream");
  }
}
