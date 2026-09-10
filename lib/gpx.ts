import { XMLParser } from "fast-xml-parser";

export type Track = { coords: [number, number][]; profile: { d: number; ele: number }[]; km: number; dplus: number; dminus: number };

/** Parsuje GPX (trk/rte), liczy dystans i D+ z wygładzaniem progowym (10 m), zwraca uproszczony ślad. */
export function parseGpx(xml: string, maxPoints = 400): Track | null {
  const p = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  let j: unknown;
  try { j = p.parse(xml); } catch { return null; }
  const g = (j as { gpx?: Record<string, unknown> }).gpx;
  if (!g) return null;
  const arr = <T,>(x: T | T[] | undefined): T[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
  type Pt = { lat: string; lon: string; ele?: string | number };
  let pts: Pt[] = [];
  for (const trk of arr(g.trk as { trkseg?: unknown }[] | undefined)) for (const seg of arr(trk.trkseg as { trkpt?: Pt[] }[] | undefined)) pts.push(...arr(seg.trkpt));
  if (!pts.length) for (const rte of arr(g.rte as { rtept?: Pt[] }[] | undefined)) pts.push(...arr(rte.rtept));
  pts = pts.filter((x) => x && x.lat && x.lon);
  if (pts.length < 10) return null;
  const R = 6371000, rad = (d: number) => (d * Math.PI) / 180;
  const dist = (a: Pt, b: Pt) => { const dLat = rad(+b.lat - +a.lat), dLon = rad(+b.lon - +a.lon); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(+a.lat)) * Math.cos(rad(+b.lat)) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  let total = 0, dplus = 0, dminus = 0;
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) { total += dist(pts[i - 1], pts[i]); cum.push(total); }
  const eles = pts.map((x) => (x.ele !== undefined ? +x.ele : NaN));
  const hasEle = eles.filter((e) => !isNaN(e)).length > pts.length * 0.8;
  if (hasEle) {
    // wygładzanie progowe: liczymy zmianę dopiero, gdy skumulowana różnica przekroczy 10 m (standard w narzędziach trailowych)
    let ref = eles[0];
    for (let i = 1; i < eles.length; i++) {
      const e = eles[i]; if (isNaN(e)) continue;
      const diff = e - ref;
      if (diff >= 10) { dplus += diff; ref = e; } else if (diff <= -10) { dminus += -diff; ref = e; }
    }
  }
  const step = Math.max(1, Math.floor(pts.length / maxPoints));
  const coords: [number, number][] = [], profile: { d: number; ele: number }[] = [];
  for (let i = 0; i < pts.length; i += step) { coords.push([+(+pts[i].lon).toFixed(5), +(+pts[i].lat).toFixed(5)]); if (hasEle && !isNaN(eles[i])) profile.push({ d: +(cum[i] / 1000).toFixed(2), ele: Math.round(eles[i]) }); }
  const last = pts.length - 1; coords.push([+(+pts[last].lon).toFixed(5), +(+pts[last].lat).toFixed(5)]);
  return { coords, profile, km: +(total / 1000).toFixed(1), dplus: Math.round(dplus), dminus: Math.round(dminus) };
}
