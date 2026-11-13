/**
 * Newsletter "nowe biegi w tym tygodniu" (treść: lib/newsletter.ts).
 *   npx tsx scripts/newsletter.ts --dry [plik.html] [RRRR-MM-DD]   podgląd wydania do pliku, bez sieci
 *   npx tsx scripts/newsletter.ts setup                            zakłada w Brevo listę i szablon potwierdzenia zapisu, zapisuje ich numery w data/newsletter.json
 *   npx tsx scripts/newsletter.ts                                  tworzy w Brevo SZKIC kampanii z wydaniem tygodnia (bez wysyłki i bez harmonogramu)
 * Wysyłka zawsze ręcznie w Brevo: szkic czeka, aż ktoś go przeczyta i uzbroi. Klucz: zmienna BREVO_API_KEY (sekret GitHuba), nigdy w repo.
 * Brak klucza, brak nadawcy w Brevo albo tydzień bez zmian kończą skrypt kodem 0 z komunikatem, żeby nie psuć automatu.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { buildIssue, renderOptin } from "../lib/newsletter";
import { brevo, SENDER, LIST_NAME, OPTIN_TEMPLATE_NAME } from "../lib/brevo";

const IDS = "data/newsletter.json";
const args = process.argv.slice(2);
const today = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? new Date().toISOString().slice(0, 10);
const key = process.env.BREVO_API_KEY || "";
const ids = (): { listId?: number; optinTemplateId?: number } => (existsSync(IDS) ? JSON.parse(readFileSync(IDS, "utf8")) : {});
const fail = (what: string, r: { status: number; json: Record<string, unknown> }) => console.error(`x ${what}: Brevo ${r.status} ${String(r.json.code ?? "")} ${String(r.json.message ?? "").slice(0, 300)}`);

async function setup() {
  if (!key) return console.log("brak BREVO_API_KEY, pomijam setup");
  const cur = ids();
  // lista: szukamy po nazwie, zakładamy tylko gdy jej nie ma (w pierwszym folderze konta)
  if (!cur.listId) {
    const lists = await brevo("/contacts/lists?limit=50&offset=0", key);
    const found = ((lists.json.lists as { id: number; name: string }[] | undefined) ?? []).find((l) => l.name === LIST_NAME);
    if (found) cur.listId = found.id;
    else {
      const folders = await brevo("/contacts/folders?limit=10&offset=0", key);
      const folderId = ((folders.json.folders as { id: number }[] | undefined) ?? [])[0]?.id ?? 1;
      const made = await brevo("/contacts/lists", key, { body: { name: LIST_NAME, folderId } });
      if (!made.ok) return fail("lista", made);
      cur.listId = made.json.id as number;
    }
    console.log("lista:", cur.listId);
    writeFileSync(IDS, JSON.stringify(cur, null, 1) + "\n"); // zapis od razu: błąd w kolejnym kroku nie gubi numeru listy
  }
  // szablon potwierdzenia: tag "optin" i link {{ doubleoptin }} są wymagane przez Brevo dla zapisu z potwierdzeniem
  if (!cur.optinTemplateId) {
    // lista szablonów wraca z pełną treścią HTML, więc po 20 na stronę i z długim limitem czasu (13.11: 100 naraz kończyło się timeoutem)
    let found: { id: number; name: string } | undefined;
    for (let offset = 0; offset < 400 && !found; offset += 20) {
      const tpls = await brevo(`/smtp/templates?limit=20&offset=${offset}&sort=desc`, key, { timeoutMs: 60000 });
      if (!tpls.ok) { fail("lista szablonów", tpls); return; }
      const page = (tpls.json.templates as { id: number; name: string }[] | undefined) ?? [];
      found = page.find((t) => t.name === OPTIN_TEMPLATE_NAME);
      if (page.length < 20) break;
    }
    if (found) cur.optinTemplateId = found.id;
    else {
      const made = await brevo("/smtp/templates", key, { timeoutMs: 60000, body: { templateName: OPTIN_TEMPLATE_NAME, subject: "Potwierdź zapis na newsletter Płaskie jest nudne", sender: SENDER, htmlContent: renderOptin(), tag: "optin", isActive: true } });
      if (!made.ok) return fail("szablon potwierdzenia (czy nadawca kontakt@plaskiejestnudne.pl jest dodany i potwierdzony w Brevo?)", made);
      cur.optinTemplateId = made.json.id as number;
    }
    console.log("szablon potwierdzenia:", cur.optinTemplateId);
  }
  writeFileSync(IDS, JSON.stringify(cur, null, 1) + "\n");
  console.log("zapisane:", IDS, JSON.stringify(cur));
}

async function draft() {
  const issue = buildIssue(today);
  if (issue.empty) return console.log(`tydzień do ${today}: bez zmian w kalendarzu, wydania nie ma`);
  if (!key) return console.log("brak BREVO_API_KEY, szkic nie powstał (podgląd: --dry)");
  const { listId } = ids();
  if (!listId) return console.log("brak listy w data/newsletter.json, najpierw: npx tsx scripts/newsletter.ts setup");
  const name = `Plaskie newsletter ${today}`;
  // jeden szkic na wydanie: ponowne uruchomienie tego samego dnia niczego nie dubluje
  const existing = await brevo("/emailCampaigns?type=classic&limit=50&offset=0&sort=desc&excludeHtmlContent=true", key);
  if (((existing.json.campaigns as { name: string }[] | undefined) ?? []).some((c) => c.name === name)) return console.log("szkic już istnieje:", name);
  const made = await brevo("/emailCampaigns", key, { body: { name, subject: issue.subject, previewText: issue.preheader.slice(0, 140), sender: SENDER, replyTo: SENDER.email, htmlContent: issue.html, recipients: { listIds: [listId] }, inlineImageActivation: false } });
  // Brevo nie pozwala założyć kampanii na pustą listę: pierwszy szkic powstanie po pierwszym potwierdzonym zapisie
  if (!made.ok && /no contacts associated/i.test(String(made.json.message ?? ""))) return console.log("lista newslettera jest pusta (nikt jeszcze nie potwierdził zapisu), szkic nie powstał");
  if (!made.ok) return fail("szkic kampanii (czy nadawca i domena są potwierdzone w Brevo?)", made);
  console.log(`szkic kampanii ${made.json.id}: "${issue.subject}" (${issue.sections.map((s) => `${s.title}: ${s.races.length}`).join(", ")}). Czeka w Brevo na przeczytanie i wysyłkę.`);
}

(async () => {
  if (args[0] === "--dry") {
    const out = args.find((a) => a.endsWith(".html")) ?? "/tmp/plaskie_newsletter.html";
    const issue = buildIssue(today);
    writeFileSync(out, issue.html);
    console.log(`${issue.empty ? "PUSTE (wydania by nie było)" : "wydanie"} ${today}: "${issue.subject}" | ${issue.preheader}\n${issue.sections.map((s) => `  ${s.title}: ${s.races.length}`).join("\n")}\nplik: ${out}`);
  } else if (args[0] === "setup") await setup();
  else await draft();
})().catch((e) => { console.error("newsletter: błąd", (e as Error).message); process.exit(args[0] === "setup" ? 1 : 0); }); // setup ma być czerwony przy błędzie; szkic nie może psuć poniedziałkowego automatu
