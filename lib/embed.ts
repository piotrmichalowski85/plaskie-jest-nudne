/** Widget do osadzenia (iframe) na stronach organizatorów i blogów: najbliższe biegi z huba, link do kalendarza. */
import type { Race } from "./types";
import { allHubs, hubPath, hubRaces, type Hub } from "./hubs";
import { upcomingRaces } from "./data";
import { SITE } from "./seo";
import { fmtKm, level, scoreLabel } from "./format";

/** hub z parametrów: ?pasmo=beskidy | ?woj=malopolskie | ?zestawienie=dla-poczatkujacych | ?miasto=krakowa */
export function embedHub(sp: URLSearchParams): Hub | undefined {
  const pick = (kind: Hub["kind"], slug: string | null) => (slug ? allHubs().find((h) => h.kind === kind && h.path[h.path.length - 1] === slug) : undefined);
  return pick("pasmo", sp.get("pasmo")) ?? pick("wojewodztwo", sp.get("woj")) ?? pick("blisko", sp.get("miasto")) ?? pick("temat", sp.get("zestawienie"));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const M = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const COL = { good: "#1f6b33", ok: "#b8860b", bad: "#a1291c" } as const;
const utm = (u: string, content: string) => `${u}?utm_source=widget&utm_medium=embed&utm_content=${encodeURIComponent(content)}`;

export function embedHtml(sp: URLSearchParams): string {
  const h = embedHub(sp);
  const limit = Math.min(10, Math.max(1, Number(sp.get("limit")) || 5));
  const list: Race[] = (h ? hubRaces(h).upcoming : upcomingRaces().sort((a, b) => a.dateStart.localeCompare(b.dateStart))).slice(0, limit);
  const title = h ? h.h1 : "Najbliższe biegi górskie i trailowe";
  const more = h ? `${SITE}${hubPath(h)}` : `${SITE}/biegi`;
  const src = h ? h.path.join("-") : "wszystkie";
  const items = list.map((r) => {
    const l = level(r.beginnerScore);
    const d = `${Number(r.dateStart.slice(8, 10))} ${M[Number(r.dateStart.slice(5, 7)) - 1]}`;
    const km = r.distancesKm.length > 3 ? `${fmtKm(r.minKm)} - ${fmtKm(r.maxKm)}` : r.distancesKm.map(fmtKm).join(" / ");
    return `<li><a href="${utm(`${SITE}/bieg/${r.id}`, src)}" target="_blank" rel="noopener"><span class="d">${d}</span><span class="n"><b>${esc(r.eventName)}</b><small>${esc(r.city)}${km ? ` · ${esc(km)}` : ""}</small></span><span class="s" style="color:${COL[l]}" title="${scoreLabel(r.beginnerScore)}">&#9679;</span></a></li>`;
  }).join("");
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | Płaskie jest nudne</title><style>
*{box-sizing:border-box}body{margin:0;font:14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#17201a;background:#fff}
.w{border:1px solid #dcd5c3;border-radius:12px;overflow:hidden;background:#fff}h1{margin:0;padding:10px 14px;font-size:15px;background:#f4efe4;border-bottom:1px solid #dcd5c3}
ul{list-style:none;margin:0;padding:0}li+li{border-top:1px solid #eee8db}a{color:inherit;text-decoration:none}
li a{display:flex;gap:12px;align-items:center;padding:9px 14px}li a:hover{background:#f7f5ef}
.d{width:46px;flex:none;font-weight:700;color:#c9632f;font-size:13px}.n{flex:1;min-width:0}.n b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.n small{display:block;color:#6b7267;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.s{flex:none;font-size:12px}
.f{display:flex;justify-content:space-between;gap:8px;padding:8px 14px;border-top:1px solid #dcd5c3;font-size:12px;color:#6b7267;background:#faf8f3}.f a{color:#2f5d3a;font-weight:700}
.e{padding:14px;color:#6b7267}
</style></head><body><div class="w"><h1>${esc(title)}</h1>${items ? `<ul>${items}</ul>` : `<p class="e">Brak nadchodzących biegów w tym zestawieniu.</p>`}<div class="f"><span>&#9679; zielony = dobry na start</span><a href="${utm(more, src)}" target="_blank" rel="noopener">Kalendarz: plaskiejestnudne.pl</a></div></div></body></html>`;
}
