import { readFileSync, existsSync } from "node:fs";
import type { Track } from "./gpx";
export function loadTrack(id: string): (Track & { source: string; fetchedAt: string }) | null {
  const p = `data/gpx/${id}.json`;
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}
