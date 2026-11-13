import { ImageResponse } from "next/og";
import { computeStats, report, pct, zl } from "@/lib/raport-ceny";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ile kosztuje bieg górski i trailowy w Polsce: główna liczba raportu";
export default function OG() {
  const s = computeStats();
  const b = s.buckets;
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "linear-gradient(180deg,#f7e9c4 0%,#f6f7f4 55%)", fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, display: "flex" }}>
          <svg width="1200" height="150" viewBox="0 0 1200 150"><path d="M0 70 Q150 10 300 50 T600 35 T900 55 T1200 25 L1200 150 L0 150Z" fill="#5f8a6b" /><path d="M0 115 Q200 75 400 100 T800 90 T1200 108 L1200 150 L0 150Z" fill="#2f5d3a" /></svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "52px 72px" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#1f4128", display: "flex" }}><span>płaskie</span><span style={{ color: "#e8b84a" }}>jest</span><span>nudne</span><span style={{ marginLeft: 18, fontWeight: 400, color: "#5f665b" }}>{`raport z regulaminów, edycje ${report.season.join(" i ")}`}</span></div>
          <div style={{ marginTop: 26, fontSize: 46, fontWeight: 800, color: "#17201a", lineHeight: 1.05 }}>Ile kosztuje bieg górski i trailowy w Polsce</div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 18 }}>
            <div style={{ fontSize: 150, fontWeight: 800, color: "#1f4128", lineHeight: 1 }}>{`+${pct(s.rise.median)}`}</div>
            <div style={{ display: "flex", marginLeft: 28, marginBottom: 20, fontSize: 34, color: "#3d4d34", maxWidth: 560, lineHeight: 1.2 }}>o tyle drożej jest zapisać się w ostatnim progu niż w pierwszym</div>
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 28, color: "#3d4d34" }}>{`Mediana w pierwszym progu: ${b.map((x) => `${x.label} ${zl(x.first.median)}`).join(" · ")}`}</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 24, color: "#5f665b" }}>{`${s.n} cenników z ${s.regulaminy} regulaminów`}</div>
        </div>
      </div>
    ),
    size,
  );
}
