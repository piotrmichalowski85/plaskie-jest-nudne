import { fetchAny } from "../lib/deep";
import { trasaLinks } from "../lib/trasa";
(async () => {
  for (const u of process.argv.slice(2)) {
    const p = await fetchAny(u);
    if (!p?.$) { console.log("==", u, "brak html"); continue; }
    const links = trasaLinks(u, p.$);
    const menu = p.$("a[href]").toArray().map((a) => p.$!(a).text().trim()).filter((t) => t && t.length < 25);
    console.log("==", u, "\n  trasa links:", links, "\n  menu:", [...new Set(menu)].slice(0, 25).join(" | "));
    for (const l of links.slice(0, 2)) {
      const s = await fetchAny(l); if (!s) continue;
      const hits = [...s.text.matchAll(/.{0,60}(przewyższ|D\+|\+\s?\d{3,4}\s?m).{0,60}/gi)].slice(0, 4).map((m) => m[0]);
      console.log("  sub:", l, "\n   ", hits.join("\n    "));
    }
    const hitsHome = [...p.text.matchAll(/.{0,60}(przewyższ|D\+|\+\s?\d{3,4}\s?m).{0,60}/gi)].slice(0, 3).map((m) => m[0]);
    console.log("  home hits:", hitsHome.join(" || "));
  }
})();
