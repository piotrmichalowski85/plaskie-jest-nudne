"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type State = "idle" | "sending" | "ok" | "bad_email" | "unavailable" | "too_many" | "error";
const MSG: Record<Exclude<State, "idle" | "sending">, string> = {
  ok: "Prawie gotowe. Wysłaliśmy mail z prośbą o potwierdzenie: kliknij w nim przycisk, a zapis zacznie działać.",
  bad_email: "Ten adres wygląda na niepełny. Sprawdź go i spróbuj jeszcze raz.",
  unavailable: "Zapis jest chwilowo niedostępny. Spróbuj za kilka dni.",
  too_many: "Za dużo prób z tego adresu sieci. Spróbuj za kwadrans.",
  error: "Coś poszło nie tak po naszej stronie. Spróbuj za chwilę.",
};

/** Zapis na newsletter "nowe biegi w tym tygodniu". compact = wersja pod listą biegów (bez nagłówka w karcie). */
export function NewsletterForm({ compact = false, where = "strona" }: { compact?: boolean; where?: string }) {
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");
  const shown = useRef(0); // chwila pokazania formularza: bot wysyła go natychmiast, człowiek po paru sekundach
  useEffect(() => { shown.current = Date.now(); }, []);
  const id = useId();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setState("sending");
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, website, t: Date.now() - shown.current }) });
      const j = (await r.json().catch(() => ({}))) as { code?: string };
      const next: State = r.ok ? "ok" : j.code === "bad_email" ? "bad_email" : j.code === "unavailable" ? "unavailable" : j.code === "too_many" ? "too_many" : "error";
      setState(next);
      if (next === "ok") { setEmail(""); (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "newsletter_signup", { where }); }
    } catch { setState("error"); }
  }
  const done = state === "ok";
  return (
    <section className={compact ? "mt-10 card" : "card"} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={compact ? "text-[1.6rem]" : "text-[2rem]"}>Nowe biegi w poniedziałek rano</h2>
      <p className="mt-1 text-sm text-[var(--muted)] max-w-[40rem]">Raz w tygodniu krótka lista: biegi, które doszły do kalendarza, zapisy, które właśnie ruszyły, i terminy, które zaraz mijają. Gdy nie ma nic nowego ani żadnego terminu do pilnowania, nie piszemy.</p>
      {!done && (
        <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2 max-w-[34rem]" noValidate>
          <label htmlFor={`${id}-e`} className="sr-only">Adres e-mail</label>
          <input id={`${id}-e`} type="email" name="email" required autoComplete="email" inputMode="email" placeholder="adres e-mail" value={email} onChange={(e) => { setEmail(e.target.value); if (state !== "idle" && state !== "sending") setState("idle"); }}
            aria-invalid={state === "bad_email"} aria-describedby={`${id}-s ${id}-c`} className="nl-input flex-1 min-w-0" />
          {/* pole-pułapka: niewidoczne dla ludzi i czytników, wypełniają je boty */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" defaultValue="" />
          <button type="submit" className="btn justify-center" disabled={state === "sending"}>{state === "sending" ? "Zapisuję..." : "Zapisz mnie"}</button>
        </form>
      )}
      <p id={`${id}-s`} role="status" aria-live="polite" className={`text-sm ${state === "idle" || state === "sending" ? "" : "mt-3"} ${done ? "font-semibold text-[var(--moss-dark)]" : "text-[var(--clay)]"}`}>{state === "idle" || state === "sending" ? "" : MSG[state]}</p>
      {!done && <p id={`${id}-c`} className="mt-2 text-xs text-[var(--muted)]">Zapis to zgoda na ten jeden newsletter. Wypis jednym kliknięciem w każdym mailu. <Link href="/newsletter" className="underline">Jak wygląda wydanie</Link> · <Link href="/prywatnosc#newsletter" className="underline">Prywatność</Link></p>}
    </section>
  );
}
