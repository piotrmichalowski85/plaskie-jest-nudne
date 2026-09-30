import { ImageResponse } from "next/og";
import { allRaces, raceById } from "@/lib/data";
import { fmtDate, fmtKm, scoreLabel, level } from "@/lib/format";
import { artKind } from "@/components/RegionArt";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export function generateStaticParams() { return allRaces.map((r) => ({ slug: r.id })); }

const PAL: Record<string, [string, string, string]> = {
  tatry: ["#c9d6e6", "#5f7390", "#33455c"], beskidy: ["#f0d48c", "#5f8a6b", "#2f5d3a"], sudety: ["#e0cf9f", "#6b7f5f", "#3d4d34"],
  bieszczady: ["#f2c877", "#8d9a4f", "#4f6a2f"], jura: ["#e3dccb", "#8f9f78", "#4f6b46"], nizina: ["#cfe3ea", "#7fa583", "#3f6f4a"], wyzyna: ["#e6d6ab", "#7c9468", "#44603c"],
};

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const r = raceById((await params).slug);
  if (!r) return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", background: "#f6f7f4" }} />, size);
  const [sky, mid, near] = PAL[artKind(r.region, r.surface)];
  const lvl = level(r.beginnerScore);
  const lvlColor = lvl === "good" ? "#1f6b33" : lvl === "ok" ? "#8a6300" : "#a1291c";
  const lvlBg = lvl === "good" ? "#e3f1e5" : lvl === "ok" ? "#fff3cf" : "#fde4e1";
  const dist = r.distancesKm.length > 4 ? `${fmtKm(r.minKm)} - ${fmtKm(r.maxKm)}` : r.distancesKm.map(fmtKm).join(" / ");
  const dplus = r.elevations.find((e) => e.dplus)?.dplus;
  const dateLine = `${fmtDate(r.dateStart, r.dateEnd)}${r.region ? ` · ${r.region}` : ""}`;
  const dplusLine = dplus ? `+${dplus} m na najkrótszym` : "";
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: `linear-gradient(180deg, ${sky} 0%, #f6f7f4 55%)`, fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 210, display: "flex" }}>
          <svg width="1200" height="210" viewBox="0 0 1200 210"><path d="M0 120 Q150 40 300 90 T600 70 T900 95 T1200 60 L1200 210 L0 210Z" fill={mid} /><path d="M0 170 Q200 120 400 150 T800 140 T1200 160 L1200 210 L0 210Z" fill={near} /></svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "56px 64px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 800, color: "#1f4128" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#1f4128", display: "flex" }} />
            <div style={{ display: "flex" }}><span>płaskie</span><span style={{ color: "#e8b84a" }}>jest</span><span>nudne</span></div>
          </div>
          <div style={{ marginTop: 40, fontSize: 30, color: "#5d6b62", fontWeight: 600 }}>{dateLine}</div>
          <div style={{ marginTop: 8, fontSize: r.eventName.length > 34 ? 56 : 68, fontWeight: 800, color: "#17201a", lineHeight: 1.05, maxWidth: 1000 }}>{r.eventName}</div>
          <div style={{ marginTop: 14, fontSize: 32, color: "#3d4d34" }}>{r.city}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 28, fontSize: 26, fontWeight: 700 }}>
            {dist && <div style={{ background: "#ffffffcc", color: "#1f4128", padding: "8px 18px", borderRadius: 999 }}>{dist}</div>}
            {dplusLine && <div style={{ background: "#ffffffcc", color: "#1f4128", padding: "8px 18px", borderRadius: 999 }}>{dplusLine}</div>}
            <div style={{ background: lvlBg, color: lvlColor, padding: "8px 18px", borderRadius: 999 }}>{scoreLabel(r.beginnerScore)}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
