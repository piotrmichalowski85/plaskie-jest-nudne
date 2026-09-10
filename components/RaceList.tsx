"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Race } from "@/lib/types";
import { RaceCard } from "./RaceCard";
import { RacesMap, type RaceWithGeo } from "./RacesMap";
import { monthName } from "@/lib/format";

const distKm = (a: [number, number], b: [number, number]) => { const R = 6371, r = (d: number) => (d * Math.PI) / 180; const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

const DIST = [
  { id: "all", label: "każdy dystans", test: () => true },
  { id: "s", label: "do 15 km", test: (r: Race) => r.minKm > 0 && r.minKm <= 15 },
  { id: "m", label: "15-30 km", test: (r: Race) => r.distancesKm.some((k) => k > 15 && k <= 30) },
  { id: "l", label: "30-45 km", test: (r: Race) => r.distancesKm.some((k) => k > 30 && k <= 45) },
  { id: "u", label: "ultra (45+ km)", test: (r: Race) => r.maxKm > 45 },
];

export function RaceList({ races, regions, today }: { races: RaceWithGeo[]; regions: string[]; today: string }) {
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [month, setMonth] = useState("");
  const [dist, setDist] = useState("all");
  const [surface, setSurface] = useState("");
  const [start, setStart] = useState(sp.get("start") === "1");
  const [past, setPast] = useState(false);
  const [view, setView] = useState<"lista" | "mapa">("lista");
  const [me, setMe] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(120);
  const [geoErr, setGeoErr] = useState("");
  const locate = () => {
    if (!navigator.geolocation) { setGeoErr("Przeglądarka nie udostępnia lokalizacji."); return; }
    navigator.geolocation.getCurrentPosition((p) => { setMe([p.coords.latitude, p.coords.longitude]); setGeoErr(""); }, () => setGeoErr("Brak zgody na lokalizację."), { timeout: 8000 });
  };

  const months = useMemo(() => [...new Set(races.filter((r) => r.dateEnd >= today).map((r) => r.dateStart.slice(0, 7)))].sort(), [races, today]);
  const list = useMemo(() => races.filter((r) =>
    (past || r.dateEnd >= today) &&
    (!q || (r.name + " " + r.city + " " + r.region).toLowerCase().includes(q.toLowerCase())) &&
    (!region || r.region === region) &&
    (!month || r.dateStart.startsWith(month)) &&
    DIST.find((d) => d.id === dist)!.test(r) &&
    (!surface || r.surface === surface) &&
    (!start || r.beginnerScore >= 4) &&
    (!me || (r.lat !== undefined && r.lng !== undefined && distKm(me, [r.lat, r.lng]) <= radius))
  ).sort((a, b) => me && a.lat !== undefined && b.lat !== undefined ? distKm(me, [a.lat, a.lng!]) - distKm(me, [b.lat, b.lng!]) : 0), [races, q, region, month, dist, surface, start, past, today, me, radius]);

  return (
    <div>
      <div className="card grid gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        <div className="sm:col-span-3 lg:col-span-2 flex flex-col gap-1"><label>Szukaj</label><input type="text" placeholder="nazwa, miasto, pasmo" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex flex-col gap-1"><label>Pasmo</label><select value={region} onChange={(e) => setRegion(e.target.value)}><option value="">wszystkie</option>{regions.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label>Miesiąc</label><select value={month} onChange={(e) => setMonth(e.target.value)}><option value="">wszystkie</option>{months.map((m) => <option key={m} value={m}>{monthName(+m.slice(5))} {m.slice(0, 4)}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label>Dystans</label><select value={dist} onChange={(e) => setDist(e.target.value)}>{DIST.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label>Teren</label><select value={surface} onChange={(e) => setSurface(e.target.value)}><option value="">każdy</option><option value="gorski">górski</option><option value="trail">trail</option><option value="przelaj">przełaj</option></select></div>
        <div className="sm:col-span-3 lg:col-span-6 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={start} onChange={(e) => setStart(e.target.checked)} /> tylko dobre na start</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={past} onChange={(e) => setPast(e.target.checked)} /> pokaż też minione</label>
          {me ? (
            <span className="flex items-center gap-2">blisko mnie: <select value={radius} onChange={(e) => setRadius(+e.target.value)} className="!py-1">{[50, 120, 200, 400].map((k) => <option key={k} value={k}>do {k} km</option>)}</select> <button className="underline text-[var(--muted)]" onClick={() => setMe(null)}>wyłącz</button></span>
          ) : <button className="underline" onClick={locate}>blisko mnie</button>}
          {geoErr && <span className="text-[#a1291c]">{geoErr}</span>}
          <span className="ml-auto flex items-center gap-3"><span className="text-[var(--muted)]">{list.length} biegów</span>
            <span className="inline-flex rounded-full border border-[var(--moss)] overflow-hidden text-xs font-semibold">{(["lista", "mapa"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`px-3 py-1 ${view === v ? "bg-[var(--moss)] text-white" : "text-[var(--moss)]"}`}>{v}</button>)}</span>
          </span>
        </div>
      </div>
      {view === "mapa" ? <RacesMap races={list} center={me ?? undefined} /> : list.length === 0 ? <p className="text-[var(--muted)]">Nic nie pasuje. Poluzuj filtry albo zajrzyj do kreatora.</p> : (
        <div className="grid gap-3 sm:grid-cols-2">{list.map((r) => <RaceCard key={r.id} race={r} />)}</div>
      )}
    </div>
  );
}
