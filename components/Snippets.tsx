"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type R = { id: string; label: string; good: boolean; name?: string };
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

/** generator plakietki z pogodą na dzień biegu (/odznaka/pogoda/<id>.svg, 300x170); ?bieg=<id> wybiera bieg z góry (link ze strony biegu). Wymaga <Suspense> (useSearchParams). */
export function WeatherBadgeSnippet({ races }: { races: R[] }) {
  const pre = useSearchParams().get("bieg") ?? "";
  const [q, setQ] = useState("");
  const [id, setId] = useState(races.some((x) => x.id === pre) ? pre : "");
  const list = useMemo(() => races.filter((r) => r.id === id || !q || r.label.toLowerCase().includes(q.toLowerCase())).slice(0, 30), [races, q, id]);
  const r = races.find((x) => x.id === id);
  const attr = (s: string) => s.replace(/"/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const name = r ? attr(r.name ?? r.label) : "Twój bieg";
  const code = `<a href="${SITE}/bieg/${r?.id ?? "TWOJ-BIEG"}?utm_source=plakietka&utm_medium=organizator" title="${r ? attr(r.label) : "Twój bieg"}: pogoda na dzień biegu w kalendarzu Płaskie jest nudne"><img src="${SITE}/odznaka/pogoda/${r?.id ?? "TWOJ-BIEG"}.svg" alt="Pogoda na ${name}" width="300" height="170" loading="lazy" style="max-width:100%;height:auto"></a>`;
  const shown = r ?? races[0];
  return (
    <div>
      <label htmlFor="p-q">Znajdź swój bieg</label>
      <input id="p-q" type="text" className="w-full mt-1" placeholder="nazwa albo miejscowość" value={q} onChange={(e) => setQ(e.target.value)} />
      <select aria-label="Bieg" className="w-full mt-2" value={id} onChange={(e) => setId(e.target.value)}>
        <option value="">wybierz bieg z listy</option>
        {list.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
      </select>
      {shown && (
        <p className="mt-3">
          {!r && <span className="block text-xs text-[var(--muted)] mb-1">Przykład: {shown.label}</span>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={shown.id} src={`/odznaka/pogoda/${shown.id}.svg`} alt={`Pogoda na ${shown.name ?? shown.label}`} width={300} height={170} style={{ maxWidth: "100%", height: "auto" }} />
        </p>
      )}
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
