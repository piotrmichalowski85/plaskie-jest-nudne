/** Brevo dla newslettera plaskie: jedno miejsce z adresem API, nadawcą i identyfikatorami listy oraz szablonu potwierdzenia. */
import ids from "@/data/newsletter.json";

export const BREVO_API = "https://api.brevo.com/v3";
export const SENDER = { name: "Płaskie jest nudne", email: "kontakt@plaskiejestnudne.pl" };
export const LIST_NAME = "Płaskie jest nudne: nowe biegi";
export const OPTIN_TEMPLATE_NAME = "Plaskie: potwierdzenie zapisu na newsletter";

/** identyfikatory zakłada `npx tsx scripts/newsletter.ts setup` (workflow newsletter.yml, tryb setup) i zapisuje w data/newsletter.json */
export const newsletterIds = (): { listId?: number; optinTemplateId?: number } => ids as { listId?: number; optinTemplateId?: number };

export async function brevo(path: string, key: string, init: { method?: string; body?: unknown } = {}): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const r = await fetch(`${BREVO_API}${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { "api-key": key, accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await r.text();
  let json: Record<string, unknown> = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { message: text.slice(0, 200) }; }
  return { ok: r.ok, status: r.status, json };
}
