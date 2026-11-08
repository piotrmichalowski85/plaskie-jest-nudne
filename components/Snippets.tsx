"use client";
import { useMemo, useState } from "react";

type R = { id: string; label: string; good: boolean };
type H = { q: string; label: string };
const SITE = "https://plaskiejestnudne.pl";

function Code({ code }: { code: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="mt-2">
      <pre className="text-xs bg-[#17201a] text-[#f4efe4] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all"><code>{code}</code></pre>
      <button type="button" className="qchip mt-2" onClick={() => { navigator.clipboard?.writeText(code).then(() => { setOk(true); setTimeout(() => setOk(false), 2000); }); }}>{ok ? "Skopiowane" : "Kopiuj kod"}</button>
    </div>
  );
}

/** generator kodu odznaki dla wybranego biegu: "dobry na start" dla biegów z zieloną oceną, "w kalendarzu" dla pozostałych */
export function BadgeSnippet({ races }: { races: R[] }) {
  const [q, setQ] = useState("");
  const [id, setId] = useState("");
  const list = useMemo(() => races.filter((r) => !q || r.label.toLowerCase().includes(q.toLowerCase())).slice(0, 30), [races, q]);
  const r = races.find((x) => x.id === id);
  const badge = r?.good ? "dobry-na-start" : "w-kalendarzu";
  const alt = r?.good ? "Dobry na start: ocena kalendarza Płaskie jest nudne" : "Bieg w kalendarzu Płaskie jest nudne";
  const code = `<a href="${SITE}/bieg/${r?.id ?? "TWOJ-BIEG"}" title="${r ? r.label.replace(/"/g, "") : "Twój bieg"} w kalendarzu Płaskie jest nudne"><img src="${SITE}/odznaka/${badge}.svg" alt="${alt}" width="200" height="64"></a>`;
  return (
    <div>
      <label htmlFor="b-q">Znajdź swój bieg</label>
      <input id="b-q" type="text" className="w-full mt-1" placeholder="nazwa albo miejscowość" value={q} onChange={(e) => setQ(e.target.value)} />
      <select aria-label="Bieg" className="w-full mt-2" value={id} onChange={(e) => setId(e.target.value)}>
        <option value="">wybierz bieg z listy</option>
        {list.map((x) => <option key={x.id} value={x.id}>{x.label}{x.good ? " (dobry na start)" : ""}</option>)}
      </select>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <p className="mt-3"><img src={`/odznaka/${badge}.svg`} alt={alt} width={200} height={64} /></p>
      <Code code={code} />
    </div>
  );
}

export function WidgetSnippet({ hubs }: { hubs: H[] }) {
  const [q, setQ] = useState(hubs[0]?.q ?? "");
  const [limit, setLimit] = useState(5);
  const url = `${SITE}/embed?${q ? q + "&" : ""}limit=${limit}`;
  const h = hubs.find((x) => x.q === q);
  const code = `<iframe src="${url}" title="${h ? h.label : "Najbliższe biegi"}: kalendarz Płaskie jest nudne" width="100%" height="${110 + limit * 52}" style="border:0;max-width:520px" loading="lazy"></iframe>`;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div className="flex flex-col gap-1"><label htmlFor="w-h">Zestawienie</label><select id="w-h" value={q} onChange={(e) => setQ(e.target.value)}><option value="">wszystkie biegi w Polsce</option>{hubs.map((x) => <option key={x.q} value={x.q}>{x.label}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label htmlFor="w-l">Liczba biegów</label><select id="w-l" value={limit} onChange={(e) => setLimit(+e.target.value)}>{[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
      </div>
      <iframe key={url} src={url.replace(SITE, "")} title="Podgląd widgetu" width="100%" height={110 + limit * 52} className="mt-3 max-w-[520px] block" style={{ border: 0 }} loading="lazy" />
      <Code code={code} />
    </div>
  );
}
