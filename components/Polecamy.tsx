import { SpotifyEmbed } from "./SpotifyEmbed";
import { outLink } from "@/lib/format";

const KR = { site: "https://www.kingrunner.com/", magazyn: "https://www.kingrunner.com/magazyn-ultra", ig: "https://www.instagram.com/kingrunner_ultra/", fb: "https://www.facebook.com/kingrunnerultra", yt: "https://www.youtube.com/channel/UCr-WA0QIbmzQZn74c_jpdaQ", podcast: "https://podcasts.apple.com/pl/podcast/id1610532486" };

/** Sekcja "Polecamy" nad stopką: ludzie i media, od których sami uczymy się gór. Grafiki: oficjalne logo i okładki, linki do ich kanałów. */
export function Polecamy() {
  return (
    <section className="cv-auto" aria-labelledby="polecamy">
      <div className="flex items-end justify-between mb-3"><h2 id="polecamy" className="text-[2.2rem]">Polecamy</h2><p className="text-sm text-[var(--muted)]">Skąd sami bierzemy wiedzę o górach</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="card flex flex-col gap-3">
          <a href={outLink(KR.site, "polecamy")} target="_blank" rel="noopener" className="block rounded-xl bg-[#111] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/polecamy/logo-ultra.png" alt="Kingrunner ULTRA" width={343} height={123} className="mx-auto h-14 w-auto" loading="lazy" />
          </a>
          <div>
            <h3 className="text-[1.5rem]">Kingrunner ULTRA</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Magazyn drukowany i portal o biegach górskich i ultra: relacje, treningi, testy sprzętu, Korona Polskich Ultramaratonów. Najlepsze miejsce, żeby poczuć, czym ten sport żyje.</p>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5 text-xs font-bold">
            <a className="qchip" href={outLink(KR.site, "polecamy")} target="_blank" rel="noopener">Portal</a>
            <a className="qchip" href={outLink(KR.magazyn, "polecamy")} target="_blank" rel="noopener">Magazyn</a>
            <a className="qchip" href={KR.podcast} target="_blank" rel="noopener">Podcast</a>
            <a className="qchip" href={KR.ig} target="_blank" rel="noopener">Instagram</a>
            <a className="qchip" href={KR.fb} target="_blank" rel="noopener">Facebook</a>
            <a className="qchip" href={KR.yt} target="_blank" rel="noopener">YouTube</a>
          </div>
        </article>
        <article className="card flex flex-col gap-3">
          <SpotifyEmbed showId="6ygtJLTnHvVFsx1Oi9ZcTt" title="RACE PACE, podcasty o bieganiu" cover="/polecamy/racepace.jpg" />
          <div>
            <h3 className="text-[1.5rem]">Race Pace</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Podcast Kuby Pawlaka o bieganiu: rozmowy z zawodnikami i trenerami, od maratonu po ultra. Dobry na długie wybieganie.</p>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5 text-xs font-bold"><a className="qchip" href={outLink("https://racepace.pl/", "polecamy")} target="_blank" rel="noopener">racepace.pl</a><a className="qchip" href="https://open.spotify.com/show/6ygtJLTnHvVFsx1Oi9ZcTt" target="_blank" rel="noopener">Spotify</a><a className="qchip" href="https://podcasts.apple.com/pl/podcast/id1636462160" target="_blank" rel="noopener">Apple Podcasts</a></div>
        </article>
        <article className="card flex flex-col gap-3">
          <SpotifyEmbed showId="34rWz2JbPBkVp5jVmWgJv0" title="Black Hat Ultra" cover="/polecamy/blackhat.jpg" />
          <div>
            <h3 className="text-[1.5rem]">Black Hat Ultra</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Podcast Kamila Dąbkowskiego: długie rozmowy z ludźmi od ultra i wysiłku na własnych nogach, o treningu, głowie i jedzeniu. Ponad 170 odcinków.</p>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5 text-xs font-bold"><a className="qchip" href="https://open.spotify.com/show/34rWz2JbPBkVp5jVmWgJv0" target="_blank" rel="noopener">Spotify</a><a className="qchip" href="https://podcasts.apple.com/pl/podcast/id1435291476" target="_blank" rel="noopener">Apple Podcasts</a></div>
        </article>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">Polecamy, bo sami słuchamy i czytamy. Bez umów i prowizji. Loga i okładki należą do ich autorów.</p>
    </section>
  );
}
