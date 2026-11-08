import { subscribeLinks } from "@/lib/ics";
import { IconCalendar } from "./Icons";

/** "Subskrybuj w kalendarzu": feed .ics aktualizuje się sam (nowe biegi, zmiany terminów, przypomnienia o zapisach) */
export function SubscribeIcs({ path, what }: { path: string; what: string }) {
  const l = subscribeLinks(path);
  return (
    <div className="card text-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <span className="flex items-center gap-2 font-semibold text-[var(--moss-dark)]"><IconCalendar />Subskrybuj w kalendarzu</span>
      <span className="text-[var(--muted)] sm:flex-1">{what} w Twoim kalendarzu w telefonie, z przypomnieniem o końcu zapisów i tydzień przed startem. Aktualizuje się sam.</span>
      <span className="flex flex-wrap gap-2">
        <a className="qchip" href={l.webcal}>Apple, Outlook</a>
        <a className="qchip" href={l.google} target="_blank" rel="noopener">Google</a>
        <a className="qchip" href={l.https} title="Adres feedu do wklejenia w dowolnym kalendarzu">plik .ics</a>
      </span>
    </div>
  );
}
