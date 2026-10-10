"use client";
import { useEffect, useMemo, useState } from "react";
import type { Race } from "@/lib/types";
import { PosterCard } from "./PosterCard";
import { RacesMap, type RaceWithGeo } from "./RacesMap";

const distKm = (a: [number, number], b: [number, number]) => { const R = 6371, r = (d: number) => (d * Math.PI) / 180; const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

const DIST = [
  { id: "all", label: "każdy dystans", test: () => true },
  { id: "s", label: "do 15 km", test: (r: Race) => r.minKm > 0 && r.minKm <= 15 },
  { id: "m", label: "15-30 km", test: (r: Race) => r.distancesKm.some((k) => k > 15 && k <= 30) },
  { id: "l", label: "30-45 km", test: (r: Race) => r.distancesKm.some((k) => k > 30 && k <= 45) },
  { id: "u", label: "ultra (ponad 45 km)", test: (r: Race) => r.maxKm > 45 },
];

export function RaceList({ races, regions, today }: { races: RaceWithGeo[]; regions: string[]; today: string }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dist, setDist] = useState("all");
  const [surface, setSurface] = useState("");
  const [start, setStart] = useState(false);
  const [past, setPast] = useState(false);
  const [hideClosed, setHideClosed] = useState(false);
  const [view, setView] = useState<"lista" | "mapa">("lista");
  // filtry z adresu (?start=1&dist=s&open=1&view=mapa&pasmo=...) dopiero po zamontowaniu: serwer renderuje pełną listę z linkami (SEO), przeglądarka zawęża
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const d = sp.get("dist"); if (d && DIST.some((x) => x.id === d)) setDist(d);
    if (sp.get("start") === "1") setStart(true);
    if (sp.get("open") === "1") setHideClosed(true);
    if (sp.get("view") === "mapa") setView("mapa");
    const p = sp.get("pasmo"); if (p && regions.includes(p)) setRegion(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const weekend = (() => { const d = new Date(today + "T12:00:00"); const dow = d.getDay(); const sat = new Date(d); sat.setDate(d.getDate() + ((6 - dow + 7) % 7)); const sun = new Date(sat); sun.setDate(sat.getDate() + 1); return [sat.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)]; })();
  const monthEnd = (() => { const d = new Date(today + "T12:00:00"); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10); })();
  const [me, setMe] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(120);
  const [geoErr, setGeoErr] = useState("");
  const locate = () => {
    if (!navigator.geolocation) { setGeoErr("Przeglądarka nie obsługuje lokalizacji."); return; }
    navigator.geolocation.getCurrentPosition((p) => { setMe([p.coords.latitude, p.coords.longitude]); setGeoErr(""); }, () => setGeoErr("Brak zgody na udostępnienie lokalizacji."), { timeout: 8000 });
  };

  const list = useMemo(() => races.filter((r) =>
    (past || r.dateEnd >= today) &&
    (!q || (r.name + " " + r.city + " " + r.region).toLowerCase().includes(q.toLowerCase())) &&
    (!region || r.region === region) &&
    (!from || r.dateEnd >= from) &&
    (!to || r.dateStart <= to) &&
    DIST.find((d) => d.id === dist)!.test(r) &&
    (!surface || r.surface === surface) &&
    (!start || r.beginnerScore >= 4) &&
    (!hideClosed || r.signup?.status !== "closed") &&
    (!me || (r.lat !== undefined && r.lng !== undefined && distKm(me, [r.lat, r.lng]) <= radius))
  ).sort((a, b) => me && a.lat !== undefined && b.lat !== undefined ? distKm(me, [a.lat, a.lng!]) - distKm(me, [b.lat, b.lng!]) : 0), [races, q, region, from, to, dist, surface, start, past, today, me, radius, hideClosed]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button className={`qchip${from === weekend[0] && to === weekend[1] ? " on" : ""}`} onClick={() => { if (from === weekend[0] && to === weekend[1]) { setFrom(""); setTo(""); } else { setFrom(weekend[0]); setTo(weekend[1]); } }}>Ten weekend</button>
        <button className={`qchip${from === today && to === monthEnd ? " on" : ""}`} onClick={() => { if (from === today && to === monthEnd) { setFrom(""); setTo(""); } else { setFrom(today); setTo(monthEnd); } }}>Ten miesiąc</button>
        <button className={`qchip${start ? " on" : ""}`} onClick={() => setStart(!start)}>Dobry na start</button>
        <button className={`qchip${dist === "s" ? " on" : ""}`} onClick={() => setDist(dist === "s" ? "all" : "s")}>Do 15 km</button>
        <button className={`qchip${dist === "u" ? " on" : ""}`} onClick={() => setDist(dist === "u" ? "all" : "u")}>Ultra</button>
        <button className={`qchip${hideClosed ? " on" : ""}`} onClick={() => setHideClosed(!hideClosed)} title="Ukrywa tylko biegi, o których wiemy, że zapisy są zamknięte. Biegi bez informacji zostają.">Ukryj zamknięte zapisy</button>
        {me ? <button className="qchip on" onClick={() => setMe(null)}>Blisko mnie: do {radius} km ✕</button> : <button className="qchip" onClick={locate}>Blisko mnie</button>}
        <span className="ml-auto inline-flex rounded-full border border-[var(--moss)] overflow-hidden text-xs font-semibold">{(["lista", "mapa"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 ${view === v ? "bg-[var(--moss)] text-white" : "text-[var(--moss)]"}`}>{v}</button>)}</span>
      </div>
      <div className="card grid gap-3 sm:grid-cols-3 lg:grid-cols-7 mb-6">
        <div className="sm:col-span-3 lg:col-span-2 flex flex-col gap-1"><label>Szukaj</label><input type="text" placeholder="nazwa, miasto, pasmo" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex flex-col gap-1"><label>Pasmo</label><select value={region} onChange={(e) => setRegion(e.target.value)}><option value="">wszystkie</option>{regions.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label htmlFor="f-od">Od</label><input id="f-od" type="date" value={from} min={past ? undefined : today} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="flex flex-col gap-1"><label htmlFor="f-do">Do</label><input id="f-do" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="flex flex-col gap-1"><label>Dystans</label><select value={dist} onChange={(e) => setDist(e.target.value)}>{DIST.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label>Teren</label><select value={surface} onChange={(e) => setSurface(e.target.value)}><option value="">każdy</option><option value="gorski">górski</option><option value="trail">trail</option><option value="przelaj">przełaj</option></select></div>
        <div className="sm:col-span-3 lg:col-span-7 flex flex-wrap gap-4 text-sm items-center">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={past} onChange={(e) => setPast(e.target.checked)} /> pokaż też minione</label>
          {me && <span className="flex items-center gap-2">promień: <select value={radius} onChange={(e) => setRadius(+e.target.value)} className="!py-1">{[50, 120, 200, 400].map((k) => <option key={k} value={k}>do {k} km</option>)}</select></span>}
          {geoErr && <span className="text-[#a1291c]">{geoErr}</span>}
          <span className="ml-auto text-[var(--muted)]">{list.length} biegów</span>
        </div>
      </div>
      <div className="min-h-[60vh]">{view === "mapa" ? <RacesMap races={list} center={me ?? undefined} /> : list.length === 0 ? <p className="text-[var(--muted)]">Nic nie pasuje. Poluzuj filtry albo zajrzyj do kreatora.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((r) => <PosterCard key={r.id} race={r} today={today} />)}</div>
      )}</div>
    </div>
  );
}
