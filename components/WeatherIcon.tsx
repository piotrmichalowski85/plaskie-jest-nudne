/** Ikona pogody z kodu WMO (Open-Meteo, weather_code). Inline SVG, bez zależności. Nieznany kod albo brak kodu: null (zostaje sama temperatura). */

export type WeatherKind = "slonce" | "male-chmury" | "chmury" | "mgla" | "mzawka" | "deszcz" | "snieg" | "burza";

export function weatherKind(c?: number): WeatherKind | undefined {
  if (c === undefined || c === null || !Number.isFinite(c)) return undefined;
  if (c === 0) return "slonce";
  if (c === 1 || c === 2) return "male-chmury";
  if (c === 3) return "chmury";
  if (c === 45 || c === 48) return "mgla";
  if (c >= 51 && c <= 57) return "mzawka";
  if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return "deszcz";
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "snieg";
  if (c >= 95 && c <= 99) return "burza";
  return undefined;
}

const SUN = "#e8b84a", SUN_EDGE = "#b98510", CLOUD = "#dfe5ea", CLOUD_EDGE = "#7b8792", RAIN = "#2f7fb8", SNOW = "#5a9bc4", BOLT = "#e0a11b";

const Sun = ({ cx = 32, cy = 32, r = 11 }: { cx?: number; cy?: number; r?: number }) => (
  <g stroke={SUN_EDGE} strokeWidth="2.5" strokeLinecap="round">
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const rad = (a * Math.PI) / 180, x = Math.cos(rad), y = Math.sin(rad);
      return <path key={a} d={`M${(cx + x * (r + 5)).toFixed(1)} ${(cy + y * (r + 5)).toFixed(1)}L${(cx + x * (r + 10)).toFixed(1)} ${(cy + y * (r + 10)).toFixed(1)}`} />;
    })}
    <circle cx={cx} cy={cy} r={r} fill={SUN} />
  </g>
);
/** chmura; dy przesuwa ją w pionie (wyżej, gdy pod spodem jest opad) */
const Cloud = ({ dy = 0 }: { dy?: number }) => (
  <path transform={`translate(0 ${dy})`} d="M19 46a10 10 0 0 1-1.2-19.9A14 14 0 0 1 44.6 23 11.5 11.5 0 0 1 46 46z" fill={CLOUD} stroke={CLOUD_EDGE} strokeWidth="2.5" strokeLinejoin="round" />
);
const Drops = ({ xs, long = false }: { xs: number[]; long?: boolean }) => (
  <g stroke={RAIN} strokeWidth="3" strokeLinecap="round">{xs.map((x) => <path key={x} d={`M${x} 46l${long ? -3 : -1.5} ${long ? 9 : 4.5}`} />)}</g>
);
const Flakes = ({ xs }: { xs: number[] }) => (
  <g stroke={SNOW} strokeWidth="2" strokeLinecap="round">{xs.map((x, i) => {
    const y = i % 2 ? 54 : 49;
    return <path key={x} d={`M${x - 3.5} ${y}h7M${x} ${y - 3.5}v7M${x - 2.5} ${y - 2.5}l5 5M${x + 2.5} ${y - 2.5}l-5 5`} />;
  })}</g>
);

export function WeatherIcon({ code, label, size = 56, className }: { code?: number; label?: string; size?: number; className?: string }) {
  const k = weatherKind(code);
  if (!k) return null;
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} {...a11y}>
      {label ? <title>{label}</title> : null}
      {k === "slonce" && <Sun />}
      {k === "male-chmury" && <><Sun cx={24} cy={22} r={9} /><path d="M25 50a8.5 8.5 0 0 1-1-16.9A12 12 0 0 1 46.8 30.6 9.8 9.8 0 0 1 48 50z" fill={CLOUD} stroke={CLOUD_EDGE} strokeWidth="2.5" strokeLinejoin="round" /></>}
      {k === "chmury" && <Cloud />}
      {k === "mgla" && <><Cloud dy={-8} /><g stroke={CLOUD_EDGE} strokeWidth="3" strokeLinecap="round"><path d="M12 46h40M18 54h28" /></g></>}
      {k === "mzawka" && <><Cloud dy={-8} /><Drops xs={[24, 33, 42]} /></>}
      {k === "deszcz" && <><Cloud dy={-8} /><Drops xs={[23, 31, 39, 47]} long /></>}
      {k === "snieg" && <><Cloud dy={-8} /><Flakes xs={[22, 32, 42]} /></>}
      {k === "burza" && <><Cloud dy={-8} /><path d="M34 40l-8 11h6l-3 9 10-13h-6l3-7z" fill={BOLT} stroke={SUN_EDGE} strokeWidth="1.5" strokeLinejoin="round" /><Drops xs={[20, 46]} /></>}
    </svg>
  );
}
