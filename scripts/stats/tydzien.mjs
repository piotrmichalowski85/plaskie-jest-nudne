/** Tygodniowe statystyki plaskiejestnudne.pl: Search Console + GA4 (service account, tylko odczyt), bez zależności npm.
 *  Użycie: node scripts/stats/tydzien.mjs [--out plik.md] [--days 7]
 *  Konfiguracja (zmienne środowiskowe albo plik ~/.config/plaskie-stats.env):
 *    GA_SERVICE_ACCOUNT_FILE=/sciezka/do/klucza.json   (konto z rolą Viewer w GA4 i "Pełny"/"Ograniczony" w Search Console)
 *    GA4_PROPERTY_ID=123456789                           (GA4 > Administracja > Ustawienia usługi)
 *    GSC_SITE=sc-domain:plaskiejestnudne.pl */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";

const envFile = `${homedir()}/.config/plaskie-stats.env`;
if (existsSync(envFile)) for (const l of readFileSync(envFile, "utf8").split("\n")) { const i = l.indexOf("="); if (i > 0 && !l.startsWith("#")) process.env[l.slice(0, i).trim()] ??= l.slice(i + 1).trim().replace(/^"|"$/g, ""); }
const args = process.argv.slice(2); const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const DAYS = Number(arg("--days", 7)); const OUT = arg("--out");
const SITE = process.env.GSC_SITE || "sc-domain:plaskiejestnudne.pl"; const PROP = process.env.GA4_PROPERTY_ID;
const sa = JSON.parse(readFileSync(process.env.GA_SERVICE_ACCOUNT_FILE, "utf8"));

const b64 = (s) => Buffer.from(s).toString("base64url");
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: "RS256", typ: "JWT" })), c = b64(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = createSign("RSA-SHA256").update(`${h}.${c}`).sign(sa.private_key, "base64url");
  const r = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${h}.${c}.${sig}` }) })).json();
  if (!r.access_token) throw new Error("token: " + JSON.stringify(r)); return r.access_token;
}
const iso = (d) => d.toISOString().slice(0, 10); const dd = (s) => s.split("-").reverse().join(".");
const today = new Date(); const end = new Date(today); end.setDate(end.getDate() - 2); // GSC ma 2 dni opóźnienia
const start = new Date(end); start.setDate(start.getDate() - DAYS + 1); const pEnd = new Date(start); pEnd.setDate(pEnd.getDate() - 1); const pStart = new Date(pEnd); pStart.setDate(pStart.getDate() - DAYS + 1);
const pct = (a, b) => b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}%` : "";
const n = (x) => Number(x || 0);

async function gsc(tok, s, e, dims = [], limit = 25) {
  const r = await (await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, { method: "POST", headers: { authorization: `Bearer ${tok}`, "content-type": "application/json" }, body: JSON.stringify({ startDate: iso(s), endDate: iso(e), dimensions: dims, rowLimit: limit }) })).json();
  if (r.error) throw new Error("GSC: " + JSON.stringify(r.error).slice(0, 200)); return r.rows || [];
}
async function ga4(tok, body) {
  const r = await (await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROP}:runReport`, { method: "POST", headers: { authorization: `Bearer ${tok}`, "content-type": "application/json" }, body: JSON.stringify(body) })).json();
  if (r.error) throw new Error("GA4: " + JSON.stringify(r.error).slice(0, 200)); return r.rows || [];
}

const tok = await token();
const out = [];
out.push(`# Statystyki plaskiejestnudne.pl: ${dd(iso(start))} - ${dd(iso(end))} (${DAYS} dni, wobec ${dd(iso(pStart))} - ${dd(iso(pEnd))})`, "");
// Search Console
try {
  const [cur] = await gsc(tok, start, end); const [prev] = await gsc(tok, pStart, pEnd);
  out.push("## Google: wyszukiwarka (Search Console)", "", "| Metryka | Ten tydzień | Poprzedni | Zmiana |", "|---|---|---|---|",
    `| Kliknięcia | ${n(cur?.clicks)} | ${n(prev?.clicks)} | ${pct(n(cur?.clicks), n(prev?.clicks))} |`,
    `| Wyświetlenia | ${n(cur?.impressions)} | ${n(prev?.impressions)} | ${pct(n(cur?.impressions), n(prev?.impressions))} |`,
    `| CTR | ${(n(cur?.ctr) * 100).toFixed(1)}% | ${(n(prev?.ctr) * 100).toFixed(1)}% | |`,
    `| Średnia pozycja | ${n(cur?.position).toFixed(1)} | ${n(prev?.position).toFixed(1)} | |`, "");
  const q = await gsc(tok, start, end, ["query"], 15); const pq = new Set((await gsc(tok, pStart, pEnd, ["query"], 500)).map((r) => r.keys[0]));
  out.push("### Zapytania (top 15)", "", "| Zapytanie | Klik. | Wyśw. | Poz. | |", "|---|---|---|---|---|", ...q.map((r) => `| ${r.keys[0]} | ${r.clicks} | ${r.impressions} | ${r.position.toFixed(1)} | ${pq.has(r.keys[0]) ? "" : "nowe"} |`), "");
  const p = await gsc(tok, start, end, ["page"], 15);
  out.push("### Strony (top 15)", "", "| Strona | Klik. | Wyśw. | Poz. |", "|---|---|---|---|", ...p.map((r) => `| ${r.keys[0].replace("https://plaskiejestnudne.pl", "") || "/"} | ${r.clicks} | ${r.impressions} | ${r.position.toFixed(1)} |`), "");
  const ogolne = q.filter((r) => /kalendarz|biegi (górskie|trailowe|przełajowe|ultra)|dla początkujących|w (beskidach|sudetach|bieszczadach|tatrach)/i.test(r.keys[0]));
  out.push(`Frazy ogólne (nie nazwy biegów) w top 15: ${ogolne.length} (${ogolne.map((r) => `"${r.keys[0]}"`).join(", ") || "brak"}).`, "");
} catch (e) { out.push("## Google: wyszukiwarka", "", `Brak danych: ${e.message}`, ""); }
// GA4
if (PROP) try {
  const dr = (s, e) => [{ startDate: iso(s), endDate: iso(e) }];
  const [tot] = await ga4(tok, { dateRanges: dr(start, end), metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "engagementRate" }, { name: "averageSessionDuration" }] });
  const [ptot] = await ga4(tok, { dateRanges: dr(pStart, pEnd), metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }] });
  const m = (r, i) => n(r?.metricValues?.[i]?.value);
  out.push("## Ruch na stronie (Google Analytics, tylko osoby, które zgodziły się na statystyki)", "", "| Metryka | Ten tydzień | Poprzedni | Zmiana |", "|---|---|---|---|",
    `| Użytkownicy | ${m(tot, 0)} | ${m(ptot, 0)} | ${pct(m(tot, 0), m(ptot, 0))} |`, `| Sesje | ${m(tot, 1)} | ${m(ptot, 1)} | ${pct(m(tot, 1), m(ptot, 1))} |`, `| Odsłony | ${m(tot, 2)} | ${m(ptot, 2)} | ${pct(m(tot, 2), m(ptot, 2))} |`,
    `| Zaangażowanie | ${(m(tot, 3) * 100).toFixed(0)}% | | |`, `| Średni czas sesji | ${Math.round(m(tot, 4))} s | | |`, "");
  const src = await ga4(tok, { dateRanges: dr(start, end), dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 8 });
  out.push("### Źródła sesji", "", "| Kanał | Sesje |", "|---|---|", ...src.map((r) => `| ${r.dimensionValues[0].value} | ${r.metricValues[0].value} |`), "");
  const pages = await ga4(tok, { dateRanges: dr(start, end), dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 12 });
  out.push("### Najczęściej oglądane", "", "| Strona | Odsłony |", "|---|---|", ...pages.map((r) => `| ${r.dimensionValues[0].value} | ${r.metricValues[0].value} |`), "");
  const ev = await ga4(tok, { dateRanges: dr(start, end), dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["click", "file_download", "share"] } } } });
  if (ev.length) out.push("### Zdarzenia", "", ...ev.map((r) => `- ${r.dimensionValues[0].value}: ${r.metricValues[0].value}`), "");
} catch (e) { out.push("## Ruch na stronie", "", `Brak danych GA4: ${e.message}`, ""); }
else out.push("## Ruch na stronie", "", "Brak GA4_PROPERTY_ID w konfiguracji.", "");
// baza
try { const j = JSON.parse(readFileSync("data/races.json", "utf8")); const t = iso(today); const up = j.races.filter((r) => r.dateEnd >= t);
  out.push("## Baza", "", `${j.races.length} biegów, ${up.length} nadchodzących, zapisy otwarte ${up.filter((r) => r.signup?.status === "open").length}, z regulaminem ${up.filter((r) => r.regulaminUrl).length}, ze sprzętem ${up.filter((r) => r.gear?.length).length}, z D+ ${up.filter((r) => r.elevations.some((e) => e.dplus)).length}. Dziennik zmian: https://plaskiejestnudne.pl/zmiany`, ""); } catch {}
const md = out.join("\n");
if (OUT) writeFileSync(OUT, md); console.log(md);
