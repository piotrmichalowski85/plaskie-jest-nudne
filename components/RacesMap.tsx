"use client";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Race } from "@/lib/types";
import { fmtDate } from "@/lib/format";

export type RaceWithGeo = Race & { lat?: number; lng?: number };
const color: Record<number, string> = { 5: "#1f6b33", 4: "#1f6b33", 3: "#b8860b", 2: "#a1291c", 1: "#a1291c" };

export function RacesMap({ races, center }: { races: RaceWithGeo[]; center?: [number, number] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    (async () => {
      const ml = await import("maplibre-gl");
      ml.setWorkerUrl("/maplibre-gl-csp-worker.js");
      if (!ref.current) return;
      const m = new ml.Map({ container: ref.current, style: "https://tiles.openfreemap.org/styles/liberty", center: center ? [center[1], center[0]] : [19.4, 51.0], zoom: center ? 8 : 5.6, attributionControl: { compact: true } });
      map = m;
      m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      for (const r of races) {
        if (r.lat === undefined || r.lng === undefined) continue;
        const el = document.createElement("div");
        el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color[r.beginnerScore]};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);cursor:pointer`;
        const html = `<div style="font:13px system-ui"><b>${r.eventName}</b><br>${fmtDate(r.dateStart, r.dateEnd)}, ${r.city}<br>${r.distancesKm.map((k) => k + " km").join(" / ")}<br><a href="/bieg/${r.id}" style="color:#2f5d3a;font-weight:600">szczegóły →</a></div>`;
        new ml.Marker({ element: el }).setLngLat([r.lng, r.lat]).setPopup(new ml.Popup({ offset: 12, maxWidth: "260px" }).setHTML(html)).addTo(m);
      }
      if (center) { const el = document.createElement("div"); el.style.cssText = "width:12px;height:12px;border-radius:50%;background:#2563eb;border:2px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.25)"; new ml.Marker({ element: el }).setLngLat([center[1], center[0]]).addTo(m); }
    })();
    return () => { map?.remove(); };
  }, [races, center]);
  return <div ref={ref} className="w-full h-[70vh] min-h-[420px] rounded-xl overflow-hidden border border-[#e3e7e1]" aria-label="Mapa biegów" />;
}
