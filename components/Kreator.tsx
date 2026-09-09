"use client";
import { useMemo, useState } from "react";
import type { Race } from "@/lib/types";
import { RaceCard } from "./RaceCard";

type A = { level: string; longest: string; region: string; when: string; goal: string };
const Q = [
  { key: "level", q: "Skąd startujesz biegowo?", opts: [["zero", "Prawie nie biegam, ale chodzę po górach"], ["flat", "Biegam po płaskim regularnie"], ["marathon", "Mam za sobą półmaraton lub maraton"]] },
  { key: "longest", q: "Najdłuższy dystans, jaki przebiegłeś/aś jednym ciągiem?", opts: [["5", "do 5 km"], ["10", "ok. 10 km"], ["21", "ok. 21 km"], ["42", "42 km i więcej"]] },
  { key: "region", q: "Gdzie chcesz pobiec?", opts: [["", "gdziekolwiek w Polsce"], ["Karkonosze", "Sudety (Karkonosze, Góry Stołowe, Sowie...)"], ["Beskid", "Beskidy (Śląski, Żywiecki, Sądecki, Niski...)"], ["Tatry", "Tatry, Pieniny, Gorce"], ["Bieszczady", "Bieszczady"], ["nizina", "blisko domu, niekoniecznie góry (przełaje, Jura, Kaszuby)"]] },
  { key: "when", q: "Kiedy?", opts: [["3", "w najbliższe 3 miesiące"], ["6", "w pół roku"], ["12", "w ciągu roku, spokojnie"]] },
  { key: "goal", q: "Cel?", opts: [["finish", "Ukończyć na luzie i mieć frajdę"], ["race", "Ścigać się, sprawdzić czas"]] },
] as const;

const REGION_GROUPS: Record<string, string[]> = {
  Karkonosze: ["Karkonosze", "Góry Stołowe", "Góry Sowie", "Góry Izerskie", "Góry Złote", "Masyw Śnieżnika", "Góry Wałbrzyskie", "Sudety", "Góry Opawskie", "Góry Bystrzyckie", "Góry Kaczawskie", "Rudawy Janowickie"],
  Beskid: ["Beskid Śląski", "Beskid Żywiecki", "Beskid Sądecki", "Beskid Niski", "Beskid Wyspowy", "Beskid Mały", "Beskid Makowski", "Beskidy", "Pogórze"],
  Tatry: ["Tatry", "Pieniny", "Gorce", "Podhale"],
  Bieszczady: ["Bieszczady"],
  nizina: ["Jura", "Jura Krakowsko-Częstochowska", "Kaszuby", "Góry Świętokrzyskie", "Roztocze", "Lasek Wolski", "Mazury", "Warmia", ""],
};

export function Kreator({ races, today }: { races: Race[]; today: string }) {
  const [a, setA] = useState<Partial<A>>({});
  const [step, setStep] = useState(0);
  const done = step >= Q.length;
  const results = useMemo(() => {
    if (!done) return [];
    const maxKm = a.longest === "5" ? 12 : a.longest === "10" ? 18 : a.longest === "21" ? 30 : 60;
    const lvlKm = a.level === "zero" ? 12 : a.level === "flat" ? 22 : 45;
    const limit = Math.min(maxKm, lvlKm);
    const end = new Date(today); end.setMonth(end.getMonth() + Number(a.when || 12));
    const endS = end.toISOString().slice(0, 10);
    const regs = a.region ? REGION_GROUPS[a.region] : null;
    return races
      .filter((r) => r.dateStart >= today && r.dateStart <= endS && r.minKm > 0 && r.minKm <= limit)
      .map((r) => {
        let s = r.beginnerScore * 2;
        if (regs) s += regs.includes(r.region) ? 3 : -3;
        const grad = r.elevations[0]?.dplus ? r.elevations[0].dplus! / r.elevations[0].km : 45;
        if (a.level === "zero" && grad > 60) s -= 2;
        if (a.goal === "race" && r.category && /Kat\.(I|II)\b/.test(r.category)) s += 1;
        if (a.goal === "finish" && r.distancesKm.length >= 3) s += 1;
        if (r.minKm >= limit * 0.5) s += 1; // nie za krótki, żeby się opłacało jechać
        return { r, s };
      })
      .sort((x, y) => y.s - x.s || x.r.dateStart.localeCompare(y.r.dateStart))
      .slice(0, 5)
      .map((x) => x.r);
  }, [a, done, races, today]);

  if (!done) {
    const cur = Q[step];
    return (
      <div className="card max-w-2xl">
        <p className="text-xs font-semibold text-[var(--muted)]">Pytanie {step + 1} z {Q.length}</p>
        <h2 className="text-xl font-bold mt-1">{cur.q}</h2>
        <div className="mt-4 grid gap-2">
          {cur.opts.map(([v, label]) => (
            <button key={v} className="text-left card hover:border-[var(--moss)] py-3" onClick={() => { setA({ ...a, [cur.key]: v }); setStep(step + 1); }}>{label}</button>
          ))}
        </div>
        {step > 0 && <button className="mt-4 text-sm text-[var(--muted)] underline" onClick={() => setStep(step - 1)}>wróć</button>}
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-baseline justify-between mb-4"><h2 className="text-2xl font-bold">Twoje pierwsze niepłaskie biegi</h2><button className="text-sm underline text-[var(--muted)]" onClick={() => { setA({}); setStep(0); }}>od nowa</button></div>
      {results.length === 0 ? <p>Nic nie pasuje do tych odpowiedzi w tym oknie czasu. Wydłuż horyzont albo poluzuj region.</p> : (
        <div className="grid gap-3 sm:grid-cols-2">{results.map((r) => <RaceCard key={r.id} race={r} />)}</div>
      )}
      <p className="mt-6 text-sm text-[var(--muted)]">Jak liczymy: ocena "dobry na start" (najkrótszy dystans, przewyższenie na km, formuła) plus dopasowanie do Twojego najdłuższego biegu, regionu i terminu. Zawsze sprawdź limit czasu i sprzęt obowiązkowy w regulaminie.</p>
    </div>
  );
}
