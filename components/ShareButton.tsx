"use client";
import { useState } from "react";
import { IconShare } from "./Icons";
export function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn btn-ghost w-full justify-center" onClick={async () => {
      const url = window.location.href;
      try { if (navigator.share) { await navigator.share({ title, url }); return; } } catch { /* anulowane */ }
      try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* brak schowka */ }
    }}><IconShare />{done ? "Link skopiowany" : "Podziel się"}</button>
  );
}
