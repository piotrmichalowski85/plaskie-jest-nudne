"use client";
import { useState } from "react";
/** Fasada odtwarzacza Spotify: do kliknięcia pokazujemy lokalną okładkę (zero skryptów Spotify), po kliknięciu ładujemy oficjalny embed. */
export function SpotifyEmbed({ showId, title, cover }: { showId: string; title: string; cover: string }) {
  const [on, setOn] = useState(false);
  if (on) return <iframe title={`Spotify: ${title}`} src={`https://open.spotify.com/embed/show/${showId}?utm_source=plaskiejestnudne.pl&theme=0`} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded-xl" />;
  return (
    <button type="button" onClick={() => setOn(true)} className="group flex w-full items-center gap-4 rounded-xl bg-[#121212] p-3 text-left text-white hover:bg-[#1f1f1f]" aria-label={`Odtwórz ${title} w Spotify`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cover} alt="" width={96} height={96} className="h-24 w-24 shrink-0 rounded-lg object-cover" loading="lazy" />
      <span className="min-w-0">
        <span className="block truncate font-bold">{title}</span>
        <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-3 py-1 text-xs font-bold text-black group-hover:bg-[#1ed760]"><span aria-hidden>▶</span> Słuchaj na Spotify</span>
        <span className="mt-1 block text-[11px] text-white/60">Po kliknięciu ładuje się odtwarzacz Spotify.</span>
      </span>
    </button>
  );
}
