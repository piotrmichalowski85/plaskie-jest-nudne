import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "linear-gradient(180deg,#f7e9c4 0%,#f6f7f4 55%)", fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 230, display: "flex" }}>
          <svg width="1200" height="230" viewBox="0 0 1200 230"><path d="M0 130 Q150 50 300 100 T600 80 T900 105 T1200 70 L1200 230 L0 230Z" fill="#5f8a6b" /><path d="M0 185 Q200 135 400 165 T800 155 T1200 175 L1200 230 L0 230Z" fill="#2f5d3a" /></svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "64px 72px" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#1f4128", display: "flex" }}><span>płaskie</span><span style={{ color: "#e8b84a" }}>jest</span><span>nudne</span></div>
          <div style={{ marginTop: 48, fontSize: 84, fontWeight: 800, color: "#17201a", lineHeight: 1 }}>Płaskie jest nudne ;)</div>
          <div style={{ marginTop: 22, fontSize: 34, color: "#3d4d34", maxWidth: 900 }}>Kalendarz biegów górskich i trailowych w Polsce. Wejdź w trail, zacznij od podbiegu.</div>
        </div>
      </div>
    ),
    size,
  );
}
