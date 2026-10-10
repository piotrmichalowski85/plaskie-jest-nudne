import type { Metadata } from "next";
import Link from "next/link";
import reports from "@/data/zmiany.json";
import type { Report } from "@/scripts/zmiany";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Co nowego w kalendarzu: nowe biegi, zmiany terminów i zapisów", description: "Dziennik odświeżeń kalendarza biegów górskich i trailowych: nowe biegi, zmienione terminy, otwarte i zamknięte zapisy, dodane regulaminy, przewyższenia i listy sprzętu.", alternates: { canonical: "/zmiany" } };

const status: Record<string, string> = { open: "otwarte", closed: "zamknięte", unknown: "nie wiemy" };
const d = (iso: string) => iso.split("-").reverse().join(".");

export default function Zmiany() {
  const list = (reports as Report[]).slice(0, 12);
  return (
    <article>
      <header className="max-w-[46rem]">
        <h1 className="text-[3rem] sm:text-[3.6rem]">Co nowego w kalendarzu</h1>
        <p className="mt-2 text-[var(--muted)]">Kalendarz odświeża się automatycznie w poniedziałki i czwartki rano (źródła: kalendarze, platformy zapisów, strony organizatorów), a we wtorki dochodzą listy sprzętu z nowych regulaminów. Tu jest dziennik tych zmian.</p>
      </header>
      {list.length === 0 && <p className="mt-6 card text-[var(--muted)]">Pierwszy raport pojawi się po najbliższym odświeżeniu.</p>}
      <div className="mt-6 space-y-6 max-w-[52rem]">
        {list.map((r) => {
          const n = r.added.length + r.removed.length + r.dateChanged.length + r.signupChanged.length + r.gearAdded.length + r.dplusAdded.length + r.regulaminAdded.length;
          const L = ({ it }: { it: { id: string; eventName: string; dateStart: string; city: string; provisional?: boolean } }) => <Link className="underline font-semibold text-[var(--moss)]" href={`/bieg/${it.id}`}>{it.eventName}</Link>;
          return (
            <section key={r.date + r.label} className="entry">
              <p className="step">{d(r.date)}{r.label ? ` · ${r.label}` : ""}</p>
              <h2 className="text-[1.8rem] mt-1">{n === 0 ? "Bez zmian" : `${n} ${n === 1 ? "zmiana" : n < 5 ? "zmiany" : "zmian"}`} <span className="text-[var(--muted)] text-[1.1rem]">· {r.upcoming} nadchodzących, {r.total} w bazie</span></h2>
              <div className="mt-3 space-y-3 text-sm">
                {r.added.length > 0 && <div><p className="font-semibold">Nowe biegi</p><ul className="list-disc pl-5">{r.added.map((it) => <li key={it.id}><L it={it} /> ({fmtDate(it.dateStart)}, {it.city}){it.provisional ? <span className="chip chip-sun ml-1">termin wstępny</span> : null}</li>)}</ul></div>}
                {r.dateChanged.length > 0 && <div><p className="font-semibold">Zmiana terminu</p><ul className="list-disc pl-5">{r.dateChanged.map((it) => <li key={it.id}><Link className="underline font-semibold text-[var(--moss)]" href={`/bieg/${it.id}`}>{it.eventName}</Link>: {d(it.from)} → {d(it.to)}</li>)}</ul></div>}
                {r.signupChanged.length > 0 && <div><p className="font-semibold">Zapisy</p><ul className="list-disc pl-5">{r.signupChanged.map((it) => <li key={it.id}><Link className="underline font-semibold text-[var(--moss)]" href={`/bieg/${it.id}`}>{it.eventName}</Link>: {status[it.from]} → {status[it.to]}</li>)}</ul></div>}
                {r.removed.length > 0 && <div><p className="font-semibold">Zniknęły ze źródeł</p><ul className="list-disc pl-5">{r.removed.map((it) => <li key={it.id}>{it.eventName} ({fmtDate(it.dateStart)}, {it.city})</li>)}</ul></div>}
                {(r.regulaminAdded.length > 0 || r.dplusAdded.length > 0 || r.gearAdded.length > 0) && <div><p className="font-semibold">Uzupełnione dane</p><ul className="list-disc pl-5">
                  {r.regulaminAdded.map((it) => <li key={"r" + it.id}><L it={it} />: regulamin</li>)}
                  {r.dplusAdded.map((it) => <li key={"d" + it.id}><L it={it} />: przewyższenie</li>)}
                  {r.gearAdded.map((it) => <li key={"g" + it.id}><L it={it} />: sprzęt obowiązkowy</li>)}
                </ul></div>}
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
