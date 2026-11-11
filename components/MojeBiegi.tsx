"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { MojeRace } from "@/lib/moje-data";
import { addSaved, removeSaved, useInBrowser, useSaved } from "@/lib/moje-store";
import { icsPath, idsFromParam, MAX_SAVED, SHARE_PARAM, sharePath } from "@/lib/moje";
import { fmtDate, fmtKm, untilLabel } from "@/lib/format";
import { Score, SignupChip } from "./RaceCard";
import { SaveHeart } from "./SaveHeart";
import { IconCalendar, IconShare } from "./Icons";

const MAX_CMP = 3;
const URL_EVT = "pjn-moje-url";

// parametr ?b=... czytamy z adresu dopiero w przeglądarce (strona jest statyczna); serwer i hydratacja widzą pusty
const subscribeUrl = (cb: () => void) => { window.addEventListener("popstate", cb); window.addEventListener(URL_EVT, cb); return () => { window.removeEventListener("popstate", cb); window.removeEventListener(URL_EVT, cb); }; };
const readUrl = () => new URLSearchParams(window.location.search).get(SHARE_PARAM) ?? "";

const pl = (n: number) => (n === 1 ? "bieg" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "biegi" : "biegów");
const dist = (r: MojeRace) => (r.distancesKm.length ? r.distancesKm.map(fmtKm).join(" / ") : "");
const none = <span className="text-[var(--muted)]">brak danych</span>;

function Compare({ races, today }: { races: MojeRace[]; today: string }) {
  const rows: [string, (r: MojeRace) => React.ReactNode][] = [
    ["Termin", (r) => { const u = r.dateEnd < today ? "już się odbył" : untilLabel(r.dateStart, r.dateEnd, today); return <>{fmtDate(r.dateStart, r.dateEnd)}{u ? <span className="block text-xs text-[var(--muted)]">{u}</span> : null}{r.provisional ? <span className="block text-xs text-[var(--muted)]">termin wstępny</span> : null}</>; }],
    ["Miejsce", (r) => <>{r.city}{r.region ? <span className="block text-xs text-[var(--muted)]">{r.region}</span> : null}</>],
    ["Dystans", (r) => dist(r) || none],
    ["Przewyższenie", (r) => { const e = r.elevations.filter((x) => x.dplus); return e.length ? <ul className="space-y-0.5">{e.map((x) => <li key={x.km}>{fmtKm(x.km)}: {x.approx ? "ok. " : ""}+{x.dplus} m</li>)}</ul> : none; }],
    ["Limit czasu", (r) => { const e = r.elevations.filter((x) => x.limitH); return e.length ? <ul className="space-y-0.5">{e.map((x) => <li key={x.km}>{fmtKm(x.km)}: {x.limitH} h</li>)}</ul> : none; }],
    ["Cena", (r) => (r.fees?.length ? <><ul className="space-y-0.5">{r.fees.map(([k, v]) => <li key={k + v}>{k ? <span className="font-semibold">{k}: </span> : null}{v}</li>)}</ul>{r.feesYear ? <span className="block mt-1 text-xs text-[var(--muted)]">wg regulaminu edycji {r.feesYear}, kwoty mogą się zmienić</span> : null}</> : none)],
    ["Sprzęt obowiązkowy", (r) => (r.gear?.length ? <ul className="list-[square] pl-4 space-y-0.5">{r.gear.map((x) => <li key={x}>{x}</li>)}</ul> : none)],
    ["Dla początkujących", (r) => <Score s={r.beginnerScore} />],
    ["Zapisy", (r) => (r.provisional ? none : <SignupChip race={r} />)],
  ];
  return (
    <>
      <p className="mb-2 text-xs text-[var(--muted)] sm:hidden">Tabela przesuwa się w bok.</p>
      <div className="card p-0 overflow-x-auto" role="region" aria-label="Porównanie biegów" tabIndex={0}>
        <table className="cmp">
          <thead><tr><th scope="col"><span className="sr-only">Cecha</span></th>{races.map((r) => <th key={r.id} scope="col"><Link href={`/bieg/${r.id}`} className="underline text-[var(--moss-dark)]">{r.eventName}</Link></th>)}</tr></thead>
          <tbody>{rows.map(([label, cell]) => <tr key={label}><th scope="row">{label}</th>{races.map((r) => <td key={r.id}>{cell(r)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">Limity, ceny i sprzęt to automatyczny wyciąg z regulaminów. Przed zapisem sprawdź oryginał na stronie biegu.</p>
    </>
  );
}

export function MojeBiegi({ dataUrl, today }: { dataUrl: string; today: string }) {
  const inBrowser = useInBrowser();
  const saved = useSaved();
  const param = useSyncExternalStore(subscribeUrl, readUrl, () => "");
  const sharedIds = useMemo(() => idsFromParam(param), [param]);
  const shared = sharedIds.length > 0; // otwarty cudzy link: pokazujemy tamtą listę, własnej nie ruszamy
  const ids = shared ? sharedIds : saved;

  const [data, setData] = useState<Map<string, MojeRace> | null>(null);
  const [failed, setFailed] = useState(false);
  const need = ids.length > 0 && !data && !failed;
  useEffect(() => {
    if (!need) return;
    let on = true;
    fetch(dataUrl).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))).then((list: MojeRace[]) => { if (on) setData(new Map(list.map((r) => [r.id, r]))); }).catch(() => { if (on) setFailed(true); });
    return () => { on = false; };
  }, [need, dataUrl]);

  const races = useMemo(() => {
    if (!data) return [];
    const list = ids.map((id) => data.get(id)).filter((r): r is MojeRace => !!r);
    // nadchodzące od najbliższego, minione na końcu
    return list.sort((a, b) => Number(a.dateEnd < today) - Number(b.dateEnd < today) || a.dateStart.localeCompare(b.dateStart));
  }, [data, ids, today]);
  const gone = data ? ids.filter((id) => !data.has(id)) : [];

  // porównywarka: przy 2-3 biegach na liście porównujemy od razu wszystkie, przy większej liczbie wybiera użytkownik
  const [picked, setPicked] = useState<string[] | null>(null);
  const cmpIds = (picked ?? (races.length >= 2 && races.length <= MAX_CMP ? races.map((r) => r.id) : [])).filter((id) => races.some((r) => r.id === id)).slice(0, MAX_CMP);
  const cmp = races.filter((r) => cmpIds.includes(r.id));
  const togglePick = (id: string) => setPicked(cmpIds.includes(id) ? cmpIds.filter((x) => x !== id) : [...cmpIds, id]);

  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.origin + sharePath(races.map((r) => r.id));
    setLink(url);
    try { if (navigator.share) { await navigator.share({ title: "Moje biegi (Płaskie jest nudne)", url }); return; } } catch { /* anulowane */ }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* brak schowka: link zostaje w polu do skopiowania ręcznie */ }
  };

  const [msg, setMsg] = useState("");
  const toOwn = () => { window.history.replaceState(null, "", "/moje"); window.dispatchEvent(new Event(URL_EVT)); setPicked(null); setLink(""); };
  const saveShared = () => {
    const before = saved.length;
    const ok = addSaved(races.map((r) => r.id));
    const added = Math.min(MAX_SAVED, new Set([...saved, ...races.map((r) => r.id)]).size) - before;
    setMsg(ok ? (added ? `Zapisano ${added} ${pl(added)} na Twojej liście.` : "Te biegi były już na Twojej liście.") : `Lista mieści ${MAX_SAVED} biegów, więc nie wszystkie się zmieściły.`);
    toOwn();
  };

  const h1 = shared ? "Udostępniona lista biegów" : "Moje biegi";
  const loading = !inBrowser || need;

  return (
    <div>
      <h1 className="text-[3rem] mb-1">{h1}</h1>
      {shared ? (
        <div className="card border-[var(--sun)] bg-[#fff8e1] text-sm mb-6">
          <p><strong>Ktoś podzielił się z Tobą listą biegów.</strong> To nie jest Twoja lista: możesz ją zapisać u siebie w całości albo sercem wybrać pojedyncze biegi. Zapis zostaje w tej przeglądarce, bez konta.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={saveShared} disabled={!races.length}>Zapisz te biegi u siebie</button>
            <button type="button" className="btn btn-ghost" onClick={toOwn}>Moja lista{saved.length ? ` (${saved.length})` : ""}</button>
          </div>
        </div>
      ) : (
        <p className="text-[var(--muted)] mb-6">Biegi, które zaznaczasz sercem. Lista siedzi tylko w tej przeglądarce: bez konta i bez wysyłania czegokolwiek na serwer.</p>
      )}
      <p role="status" aria-live="polite" className={msg ? "card text-sm mb-6 border-[var(--moss)]" : "sr-only"}>{msg}</p>

      {loading ? (
        <p className="text-[var(--muted)] min-h-[40vh]">Wczytuję listę...</p>
      ) : failed ? (
        <p className="empty text-sm">Nie udało się wczytać danych biegów. Odśwież stronę, a jeśli to nie pomoże, zajrzyj do <Link href="/biegi" className="underline font-semibold text-[var(--moss)]">kalendarza</Link>.</p>
      ) : !ids.length ? (
        <div className="empty">
          <h2 className="text-[1.8rem]">Jeszcze nic tu nie ma</h2>
          <p className="mt-2 text-sm max-w-xl">Kliknij serce na karcie biegu w kalendarzu albo na stronie biegu, a pojawi się tutaj. Gdy zbierzesz dwa albo trzy, porównasz je w jednej tabeli: termin, dystans, przewyższenie, limit czasu, cena, sprzęt obowiązkowy. Całą listę wrzucisz jednym plikiem do kalendarza w telefonie albo wyślesz linkiem komuś, z kim biegasz.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/biegi" className="btn">Przejdź do kalendarza</Link>
            <Link href="/kreator" className="btn btn-ghost">Wybierz swój pierwszy bieg</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {gone.length > 0 && (
            <p className="card text-sm">{gone.length === 1 ? "Jednego biegu z tej listy nie ma już w kalendarzu" : `${gone.length} biegów z tej listy nie ma już w kalendarzu`} (zmiana terminu albo odwołanie). Poszukaj nowego terminu w <Link href="/biegi" className="underline font-semibold text-[var(--moss)]">kalendarzu</Link>.{!shared && <> <button type="button" className="underline font-semibold text-[var(--moss)] cursor-pointer" onClick={() => removeSaved(gone)}>Usuń z listy</button></>}</p>
          )}

          {races.length > 0 && (
            <section>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h2 className="text-[1.8rem] mr-auto">{races.length} {pl(races.length)} na liście</h2>
                <a className="btn !py-2 !px-4 text-sm" href={icsPath(races.map((r) => r.id))} download="moje-biegi.ics"><IconCalendar />Dodaj wszystkie do kalendarza</a>
                <button type="button" className="btn btn-ghost !py-2 !px-4 text-sm cursor-pointer" onClick={share}><IconShare />{copied ? "Link skopiowany" : "Udostępnij listę"}</button>
              </div>
              {link && (
                <div className="card text-sm mb-3 flex flex-col gap-1">
                  <label htmlFor="moje-link">Link do tej listy. Kto go otworzy, zobaczy te same biegi i może zapisać je u siebie.</label>
                  <input id="moje-link" type="text" readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="w-full" />
                </div>
              )}
              <ul className="card divide-y divide-[#e3e7e1] p-0 overflow-hidden">{races.map((r) => {
                const past = r.dateEnd < today;
                const on = cmpIds.includes(r.id);
                const full = !on && cmpIds.length >= MAX_CMP;
                return (
                  <li key={r.id} className={`flex items-center gap-3 px-4 py-3${past ? " opacity-70" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--muted)]">{fmtDate(r.dateStart, r.dateEnd)}{past ? " · już się odbył" : untilLabel(r.dateStart, r.dateEnd, today) ? ` · ${untilLabel(r.dateStart, r.dateEnd, today)}` : ""}</p>
                      <Link href={`/bieg/${r.id}`} className="mt-0.5 block font-semibold hover:underline">{r.eventName}</Link>
                      <p className="text-xs text-[var(--muted)]">{[r.city, r.region, dist(r)].filter(Boolean).join(" · ")}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Score s={r.beginnerScore} />
                        {races.length >= 2 && <label className={`flex items-center gap-1.5 cursor-pointer${full ? " opacity-50" : ""}`} title={full ? `Porównasz najwyżej ${MAX_CMP} biegi naraz. Odznacz któryś.` : undefined}><input type="checkbox" checked={on} disabled={full} onChange={() => togglePick(r.id)} /> porównaj</label>}
                      </p>
                    </div>
                    <SaveHeart id={r.id} name={r.eventName} />
                  </li>
                );
              })}</ul>
            </section>
          )}

          {races.length > 0 && (
            <section>
              <h2 className="text-[1.8rem] mb-2">Porównanie</h2>
              {cmp.length >= 2 ? <Compare races={cmp} today={today} /> : (
                <p className="empty text-sm">{races.length < 2 ? <>Do porównania potrzeba dwóch biegów. Dodaj sercem jeszcze jeden z <Link href="/biegi" className="underline font-semibold text-[var(--moss)]">kalendarza</Link>.</> : <>Zaznacz &quot;porównaj&quot; przy dwóch albo trzech biegach, a zestawimy je w jednej tabeli.</>}</p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
