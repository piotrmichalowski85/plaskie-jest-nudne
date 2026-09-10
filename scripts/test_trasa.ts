import { findTrasa } from "../lib/trasa";
(async () => { for (const u of process.argv.slice(2)) { const r = await findTrasa(u, [10, 25, 50, 100]); console.log("==", u, "->", r.url || "brak", JSON.stringify(r.found), "lata:", r.years.join(",")); } })();
