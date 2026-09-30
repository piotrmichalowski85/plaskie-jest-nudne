"use client";
import Script from "next/script";
import { useEffect, useState } from "react";

const KEY = "pjn-consent"; // "granted" | "denied"

declare global { interface Window { dataLayer: unknown[]; gtag: (...args: unknown[]) => void } }

/** GA4 w trybie zgody: bez kliknięcia "zgadzam się" żadne ciasteczko analityczne nie powstaje. */
export function Analytics({ gaId }: { gaId?: string }) {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v === "granted" || v === "denied") setConsent(v); else setConsent(null); } catch { setConsent(null); }
  }, []);
  useEffect(() => {
    if (!gaId || !consent) return;
    try { window.gtag?.("consent", "update", { analytics_storage: consent }); } catch { /* gtag jeszcze nie załadowany */ }
  }, [consent, gaId]);
  const decide = (v: "granted" | "denied") => { try { localStorage.setItem(KEY, v); } catch { /* prywatne okno */ } setConsent(v); };
  if (!gaId) return null;
  return (
    <>
      <Script id="ga-consent" strategy="beforeInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}</Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      {consent === null && (
        <div role="dialog" aria-label="Zgoda na statystyki" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl card shadow-lg text-sm">
          <p>Używamy Google Analytics, żeby wiedzieć, które biegi i narzędzia są przydatne. Dane są anonimizowane. Bez zgody statystyki nie działają, serwis tak. Szczegóły w <a className="underline" href="/prywatnosc">polityce prywatności</a>.</p>
          <div className="mt-3 flex gap-2">
            <button className="btn" onClick={() => decide("granted")}>Zgadzam się</button>
            <button className="btn btn-ghost" onClick={() => decide("denied")}>Nie teraz</button>
          </div>
        </div>
      )}
    </>
  );
}
