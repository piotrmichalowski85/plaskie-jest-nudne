export function ElevationProfile({ profile, km, dplus }: { profile: { d: number; ele: number }[]; km: number; dplus: number }) {
  if (profile.length < 5) return null;
  const W = 640, H = 160, pad = 28;
  const eles = profile.map((p) => p.ele), minE = Math.min(...eles), maxE = Math.max(...eles), maxD = profile[profile.length - 1].d || km;
  const x = (d: number) => pad + (d / maxD) * (W - pad - 8), y = (e: number) => H - pad + 6 - ((e - minE) / Math.max(1, maxE - minE)) * (H - pad - 12);
  const pts = profile.map((p) => `${x(p.d).toFixed(1)},${y(p.ele).toFixed(1)}`).join(" ");
  const area = `${x(0)},${H - pad + 6} ${pts} ${x(maxD)},${H - pad + 6}`;
  return (
    <figure className="card">
      <figcaption className="text-sm font-semibold mb-1">Profil trasy z GPX: {km} km, +{dplus} m, {minE} do {maxE} m n.p.m.</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Profil wysokości trasy">
        <polygon points={area} fill="#e3f1e5" />
        <polyline points={pts} fill="none" stroke="#2f5d3a" strokeWidth="2" />
        <text x={pad} y={H - 6} fontSize="11" fill="#5d6b62">0 km</text>
        <text x={W - 8} y={H - 6} fontSize="11" fill="#5d6b62" textAnchor="end">{maxD} km</text>
        <text x={4} y={y(maxE) + 4} fontSize="11" fill="#5d6b62">{maxE}</text>
        <text x={4} y={y(minE) + 4} fontSize="11" fill="#5d6b62">{minE}</text>
      </svg>
    </figure>
  );
}
