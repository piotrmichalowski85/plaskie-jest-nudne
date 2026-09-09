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
export const scoreLabel: Record<number, string> = { 5: "idealny na start", 4: "dobry na start", 3: "dla biegających", 2: "wymagający", 1: "dla zaawansowanych" };
export const surfaceLabel: Record<string, string> = { gorski: "górski", trail: "trail", przelaj: "przełaj", miejski: "miejski" };
