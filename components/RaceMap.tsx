"use client";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export function RaceMap({ lat, lng, label, track }: { lat: number; lng: number; label: string; track?: [number, number][] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (!ref.current) return;
      const m = new maplibregl.Map({ container: ref.current, style: "https://tiles.openfreemap.org/styles/liberty", center: [lng, lat], zoom: track ? 10 : 9.5, attributionControl: { compact: true } });
      map = m;
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      m.scrollZoom.disable();
      new maplibregl.Marker({ color: "#2f5d3a" }).setLngLat([lng, lat]).setPopup(new maplibregl.Popup({ offset: 24 }).setText(label)).addTo(m);
      if (track && track.length > 1) {
        m.on("load", () => {
          m.addSource("track", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: track } } });
          m.addLayer({ id: "track", type: "line", source: "track", paint: { "line-color": "#e8b84a", "line-width": 4 } });
          const b = track.reduce((bb, c) => bb.extend(c as [number, number]), new maplibregl.LngLatBounds(track[0], track[0]));
          m.fitBounds(b, { padding: 30 });
        });
      }
    })();
    return () => { map?.remove(); };
  }, [lat, lng, label, track]);
  return <div ref={ref} className="w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-[#e3e7e1]" aria-label={`Mapa: ${label}`} />;
}
