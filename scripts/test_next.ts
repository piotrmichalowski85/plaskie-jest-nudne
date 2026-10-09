import { nextEditions } from "../lib/next_edition";
import type { Dataset } from "../lib/types";
import { readFileSync } from "node:fs";
const ds = JSON.parse(readFileSync("data/races.json", "utf8")) as Dataset;
nextEditions(ds.races as never, Number(process.argv[2] || 20)).then((r) => {
  console.log(`checked ${r.checked}, added ${r.added.length}`);
  for (const a of r.added) console.log(a.dateStart, a.dateEnd, "|", a.eventName, "|", a.city, "|", a.url);
});
