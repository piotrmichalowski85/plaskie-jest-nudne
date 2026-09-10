import { findTrasa } from "../lib/trasa";
import { parseGpx } from "../lib/gpx";
(async () => {
  for (const u of process.argv.slice(2)) {
    const t = await findTrasa(u);
    console.log("==", u, "gpx:", t.gpx);
    for (const g of (t.gpx || []).slice(0, 3)) {
      try { const r = await fetch(g, { headers: { "user-agent": "plaskiejestnudne-bot/0.1" }, signal: AbortSignal.timeout(20000) }); const x = await r.text(); const tr = parseGpx(x); console.log("  ", g.slice(-50), r.status, tr ? `${tr.km} km, +${tr.dplus} m, pkt ${tr.coords.length}, profil ${tr.profile.length}` : "nie sparsowano"); } catch (e) { console.log("  ", g, "błąd", (e as Error).message); }
    }
  }
})();
