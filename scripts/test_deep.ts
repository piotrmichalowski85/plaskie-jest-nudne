import { findRegulamin, extractLimits, extractGear } from "../lib/deep";
import { extractFromText } from "../lib/enrich";
(async () => {
  for (const u of process.argv.slice(2)) {
    const r = await findRegulamin(u);
    console.log("\n==", u, "->", r.regulaminUrl || "brak", "| org:", r.organizerUrl || "-", "| visited:", r.visited.length);
    if (r.regulaminText) {
      console.log("dist:", JSON.stringify(extractFromText(r.regulaminText)?.distances));
      console.log("limits:", JSON.stringify(extractLimits(r.regulaminText)));
      console.log("gear:", extractGear(r.regulaminText));
    }
  }
})();
