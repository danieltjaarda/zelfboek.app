"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const VOORBEELDEN = ["Hoeveel btw moet ik dit kwartaal betalen?", "Welke facturen staan open?", "Wat was mijn grootste kostenpost vorige maand?"];

function Sterretje({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
      <path d="M19 14l.9 2.6L22.5 17.5l-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z" opacity=".7" />
      <path d="M5 15l.7 1.8 1.8.7-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7L5 15z" opacity=".5" />
    </svg>
  );
}

/**
 * Kleine botbalk onderin de zijbalk (met halo) die een Spotlight-achtige overlay opent:
 * de hele app wordt wazig en een groot vraagveld fadet gecentreerd in beeld. Ook met ⌘K / Ctrl+K.
 */
export function BotSpotlight({ dicht, verborgen }: { dicht: boolean; verborgen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uit, setUit] = useState(false); // sluit met een uitfade; daarna pas weg

  const sluit = () => { if (open) setUit(true); };
  const toon = () => { setUit(false); setOpen(true); };

  useEffect(() => {
    const toets = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (open && !uit) setUit(true); else toon(); }
      if (e.key === "Escape" && open) setUit(true);
    };
    document.addEventListener("keydown", toets);
    return () => document.removeEventListener("keydown", toets);
  }, [open, uit]);

  useEffect(() => {
    if (!uit) return;
    const t = setTimeout(() => { setOpen(false); setUit(false); }, 240);
    return () => clearTimeout(t);
  }, [uit]);

  useEffect(() => {
    if (!open) return;
    const vorige = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = vorige; };
  }, [open]);

  const vraag = (tekst: string) => {
    const t = tekst.trim();
    if (!t) return;
    setUit(true);
    router.push(`/app/assistent?q=${encodeURIComponent(t)}`);
  };

  const overlay = open ? createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[16vh]">
      {/* De blur staat inline: de CSS-compiler laat anders alleen de -webkit-variant over, die Chrome niet kent. */}
      <button type="button" aria-label="Sluiten" onClick={sluit} className={`spot-achter absolute inset-0 ${uit ? "uit" : ""}`} style={{ backdropFilter: "blur(14px) saturate(0.9)", WebkitBackdropFilter: "blur(14px) saturate(0.9)" }} />
      <div role="dialog" aria-modal="true" aria-label="Vraag het de bot" className={`spot-paneel relative w-full max-w-2xl ${uit ? "uit" : ""}`}>
        <div className="ai-balk-binnen spot-vak">
          <form onSubmit={(e) => { e.preventDefault(); vraag(String(new FormData(e.currentTarget).get("q") ?? "")); }} className="flex items-center gap-4 px-5 py-4">
            <span className="shrink-0 text-primair"><Sterretje size={28} /></span>
            <input name="q" autoFocus autoComplete="off" placeholder="Vraag het de bot over je boekhouding" aria-label="Je vraag aan de bot" className="min-w-0 flex-1 bg-transparent text-[20px] text-tekst outline-none placeholder:text-tekst-3" />
            <kbd className="hidden rounded border border-lijn-2 bg-papier px-1.5 font-sans text-[11px] leading-[18px] text-tekst-3 sm:block">esc</kbd>
          </form>
          <div className="flex flex-wrap items-center gap-2 border-t border-lijn px-5 py-3">
            <span className="text-[12px] font-medium uppercase tracking-[.04em] text-tekst-3">Bijvoorbeeld</span>
            {VOORBEELDEN.map((v) => <button key={v} type="button" onClick={() => vraag(v)} className="chip">{v}</button>)}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  if (verborgen) return overlay;
  return (
    <>
      <div className={`bot-mini mb-2 ${dicht ? "md:hidden" : ""}`}>
        <button type="button" onClick={toon} className="bot-mini-vak" aria-haspopup="dialog" aria-expanded={open}>
          <span className="shrink-0 text-primair"><Sterretje size={18} /></span>
          <span className="min-w-0 flex-1 truncate font-medium">Vraag het de bot</span>
          <kbd className="rounded border border-lijn-2 bg-papier px-1 font-sans text-[10px] leading-[16px] text-tekst-3">⌘K</kbd>
        </button>
      </div>
      <div className={`bot-mini mb-2 ${dicht ? "hidden md:flex md:justify-center" : "hidden"}`}>
        <button type="button" onClick={toon} className="bot-mini-vak bot-mini-rond" aria-label="Vraag het de bot" title="Vraag het de bot (⌘K)" aria-haspopup="dialog" aria-expanded={open}>
          <span className="text-primair"><Sterretje size={18} /></span>
        </button>
      </div>
      {overlay}
    </>
  );
}
