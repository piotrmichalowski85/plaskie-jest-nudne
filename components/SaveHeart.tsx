"use client";
import { toggleSaved, useSaved } from "@/lib/moje-store";
import { MAX_SAVED } from "@/lib/moje";
import { IconHeart } from "./Icons";

/** Serce "Moje biegi": zapisuje bieg w przeglądarce albo go usuwa. "icon" = samo serce (karta, lista), "button" = przycisk z napisem (strona biegu). */
export function SaveHeart({ id, name, variant = "icon" }: { id: string; name: string; variant?: "icon" | "button" }) {
  const saved = useSaved().includes(id);
  const toggle = () => { if (!toggleSaved(id)) window.alert(`W Moich biegach mieści się ${MAX_SAVED} biegów. Usuń któryś, żeby dodać kolejny.`); };
  if (variant === "button") return <button type="button" className={`btn btn-ghost heart-btn${saved ? " on" : ""}`} aria-pressed={saved} onClick={toggle}><IconHeart filled={saved} />{saved ? "W Moich biegach" : "Zapisz w Moich biegach"}</button>;
  // samo serce rysuje CSS (maska na ::before), bez inline SVG: w kalendarzu jest kilkadziesiąt kart i każdy bajt znacznika liczy się razy tyle
  return <button type="button" className={`heart${saved ? " on" : ""}`} aria-pressed={saved} aria-label={`Zapisz w Moich biegach: ${name}`} onClick={toggle} />;
}
