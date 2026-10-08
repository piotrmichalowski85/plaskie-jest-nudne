import type { Race } from "@/lib/types";
import { dayNum, monthShort, untilLabel } from "@/lib/format";
export function Ticker({ races, today }: { races: Race[]; today: string }) {
  const items = races.slice(0, 8).map((r) => {
    const u = untilLabel(r.dateStart, r.dateEnd, today);
    const extra = r.signup?.registered ? ` · ${r.signup.registered} zapisanych` : r.signup?.until && r.signup.status === "open" ? ` · zapisy do ${dayNum(r.signup.until)}.${r.signup.until.slice(5, 7)}` : "";
    return <span key={r.id}><b>{r.eventName}</b> {dayNum(r.dateStart)} {monthShort(r.dateStart)}{u ? ` · ${u}` : ""}{extra}</span>;
  });
  return <div className="ticker" aria-label="Najbliższe biegi"><div className="ticker-track"><span>NAJBLIŻEJ:</span>{items}<span>NAJBLIŻEJ:</span>{items.map((x, i) => <span key={"b" + i}>{x.props.children}</span>)}</div></div>;
}
