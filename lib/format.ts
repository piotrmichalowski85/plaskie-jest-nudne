const M = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
export function fmtDate(start: string, end?: string): string {
  const [y, m, d] = start.split("-").map(Number);
  if (end && end !== start) {
    const [, m2, d2] = end.split("-").map(Number);
    return m === m2 ? `${d}-${d2} ${M[m - 1]} ${y}` : `${d} ${M[m - 1]} - ${d2} ${M[m2 - 1]} ${y}`;
  }
  return `${d} ${M[m - 1]} ${y}`;
}
export const monthName = (m: number) => M[m - 1];
export function fmtKm(km: number) { return `${km % 1 === 0 ? km : km.toFixed(1).replace(".", ",")} km`; }
export type Level = "good" | "ok" | "bad";
export const level = (s: number): Level => (s >= 4 ? "good" : s === 3 ? "ok" : "bad");
export const levelLabel: Record<Level, string> = { good: "dobry na start", ok: "ujdzie na start", bad: "zły na start" };
export const scoreLabel = (s: number) => levelLabel[level(s)];
export const surfaceLabel: Record<string, string> = { gorski: "górski", trail: "trail", przelaj: "przełaj", miejski: "miejski" };

const MS = ["STY", "LUT", "MAR", "KWI", "MAJ", "CZE", "LIP", "SIE", "WRZ", "PAŹ", "LIS", "GRU"];
export const dayNum = (iso: string) => Number(iso.slice(8, 10));
export const monthShort = (iso: string) => MS[Number(iso.slice(5, 7)) - 1];
const DOW = ["nd", "pon", "wt", "śr", "czw", "pt", "sb"];
export const dow = (iso: string) => DOW[new Date(iso + "T12:00:00").getDay()];
export function daysUntil(iso: string, today: string): number { return Math.round((Date.parse(iso) - Date.parse(today)) / 86400000); }
export function untilLabel(start: string, end: string, today: string): string {
  const d = daysUntil(start, today);
  if (d < 0 && Date.parse(end) >= Date.parse(today)) return "trwa";
  if (d === 0) return "dziś"; if (d === 1) return "jutro"; if (d < 0) return "minął";
  if (d <= 60) return `za ${d} dni`;
  return "";
}
