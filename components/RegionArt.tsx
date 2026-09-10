/** Własna ilustracja per pasmo (zero cudzych logotypów). Siedem stylów sylwetek, spójne z hero. */
export type ArtKind = "tatry" | "beskidy" | "sudety" | "bieszczady" | "jura" | "nizina" | "wyzyna";

export function artKind(region: string, surface?: string): ArtKind {
  const r = region.toLowerCase();
  if (/tatry|podhale|pieniny|gorce/.test(r)) return "tatry";
  if (/beskid|pogórze/.test(r)) return "beskidy";
  if (/karkonosze|izersk|stołowe|sowie|bystrzyck|orlick|bardzk|złote|opawsk|kaczawsk|rudawy|śnieżnik|wałbrzysk|kłodzk|sudety/.test(r)) return "sudety";
  if (/bieszczady/.test(r)) return "bieszczady";
  if (/jura/.test(r)) return "jura";
  if (/świętokrzysk|roztocze/.test(r)) return "wyzyna";
  if (/kaszuby|mazury|warmia|lasek/.test(r) || surface === "przelaj") return "nizina";
  return "beskidy";
}

const P: Record<ArtKind, { sky: [string, string]; far: string; mid: string; near: string; extra?: "snow" | "rock" | "lake" | "meadow" }> = {
  tatry: { sky: ["#e9eef5", "#c9d6e6"], far: "#9fb0c4", mid: "#5f7390", near: "#33455c", extra: "snow" },
  beskidy: { sky: ["#f7e9c4", "#f0d48c"], far: "#9fb8a5", mid: "#5f8a6b", near: "#2f5d3a" },
  sudety: { sky: ["#f2ecdf", "#e0cf9f"], far: "#a9b6a0", mid: "#6b7f5f", near: "#3d4d34", extra: "rock" },
  bieszczady: { sky: ["#fbeccc", "#f2c877"], far: "#c6b87a", mid: "#8d9a4f", near: "#4f6a2f", extra: "meadow" },
  jura: { sky: ["#f4f1ea", "#e3dccb"], far: "#c9c2ae", mid: "#8f9f78", near: "#4f6b46", extra: "rock" },
  nizina: { sky: ["#eaf2f6", "#cfe3ea"], far: "#b9cdb8", mid: "#7fa583", near: "#3f6f4a", extra: "lake" },
  wyzyna: { sky: ["#f3eee2", "#e6d6ab"], far: "#b8c4a2", mid: "#7c9468", near: "#44603c" },
};

const SHAPES: Record<ArtKind, { far: string; mid: string; near: string }> = {
  tatry: { far: "M0 70 L40 40 L70 55 L110 18 L140 45 L175 12 L205 40 L240 20 L275 48 L300 30 L300 100 L0 100Z", mid: "M0 80 L35 62 L65 72 L95 44 L125 66 L160 36 L190 62 L225 42 L260 68 L300 52 L300 100 L0 100Z", near: "M0 92 L40 80 L80 88 L120 72 L160 86 L200 74 L240 88 L280 78 L300 84 L300 100 L0 100Z" },
  beskidy: { far: "M0 66 Q60 40 120 58 T240 50 T300 60 L300 100 L0 100Z", mid: "M0 78 Q50 58 110 72 T220 64 T300 74 L300 100 L0 100Z", near: "M0 90 Q70 76 140 86 T300 84 L300 100 L0 100Z" },
  sudety: { far: "M0 66 L50 44 L90 44 L120 56 L160 34 L210 34 L240 50 L300 46 L300 100 L0 100Z", mid: "M0 78 L40 64 L100 66 L140 54 L200 56 L250 70 L300 66 L300 100 L0 100Z", near: "M0 90 Q60 80 120 88 L180 82 L240 90 L300 86 L300 100 L0 100Z" },
  bieszczady: { far: "M0 62 Q75 46 150 56 T300 52 L300 100 L0 100Z", mid: "M0 76 Q70 62 150 70 T300 66 L300 100 L0 100Z", near: "M0 92 Q100 80 200 88 T300 86 L300 100 L0 100Z" },
  jura: { far: "M0 72 L60 60 L80 50 L90 60 L150 56 L170 44 L180 58 L240 54 L300 62 L300 100 L0 100Z", mid: "M0 82 L50 74 L110 76 L130 66 L140 76 L220 72 L300 78 L300 100 L0 100Z", near: "M0 92 Q80 84 160 90 T300 88 L300 100 L0 100Z" },
  nizina: { far: "M0 70 Q80 62 160 68 T300 66 L300 100 L0 100Z", mid: "M0 80 Q90 74 180 78 T300 76 L300 100 L0 100Z", near: "M0 94 L300 90 L300 100 L0 100Z" },
  wyzyna: { far: "M0 68 Q60 50 120 62 T240 56 T300 62 L300 100 L0 100Z", mid: "M0 80 Q60 66 130 76 T260 70 T300 76 L300 100 L0 100Z", near: "M0 92 Q80 82 160 88 T300 86 L300 100 L0 100Z" },
};

export function RegionArt({ region, surface, className = "", label }: { region: string; surface?: string; className?: string; label?: string }) {
  const k = artKind(region, surface);
  const p = P[k], s = SHAPES[k];
  const id = `g-${k}`;
  return (
    <svg viewBox="0 0 300 100" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label ?? `Ilustracja: ${region || "góry"}`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sky[0]} /><stop offset="1" stopColor={p.sky[1]} /></linearGradient></defs>
      <rect width="300" height="100" fill={`url(#${id})`} />
      <circle cx="232" cy="30" r="14" fill="#fff3cf" opacity="0.95" />
      <path d={s.far} fill={p.far} />
      <path d={s.mid} fill={p.mid} />
      {p.extra === "snow" && <path d="M104 26 L110 18 L116 26 Z M169 20 L175 12 L181 20 Z M234 28 L240 20 L246 28 Z" fill="#fff" opacity="0.9" />}
      {p.extra === "meadow" && <path d="M0 76 Q70 62 150 70 T300 66 L300 72 Q230 68 150 76 Q70 68 0 82 Z" fill="#d9c56a" opacity="0.5" />}
      {p.extra === "lake" && <ellipse cx="150" cy="93" rx="70" ry="4" fill="#9fc4d6" opacity="0.9" />}
      {p.extra === "rock" && <path d="M78 52 L80 50 L84 54 Z M168 46 L170 44 L174 48 Z" fill="#e9e4d6" />}
      <path d={s.near} fill={p.near} />
    </svg>
  );
}
