"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  icoon: React.ReactNode;
  naam: string;
  uitleg: string;
  status: React.ReactNode;
  /** Tekst op de knop; met `licht` wordt het een witte knop (bijvoorbeeld "Beheren"). */
  knop?: { tekst: string; licht?: boolean };
  /** Eigen actie in de voet (bijvoorbeeld een formulier dat direct naar de bank gaat); dan geen dialoog. */
  actie?: React.ReactNode;
  /** Inhoud van de dialoog die opent bij klikken op de knop. */
  children?: React.ReactNode;
};

/** Tegel zoals in een app store: icoon, naam, één regel uitleg, status en een knop. De details zitten in een dialoog. */
export function AppTegel({ icoon, naam, uitleg, status, knop, actie, children }: Props) {
  const [open, setOpen] = useState(false);
  const [uit, setUit] = useState(false);
  const sluit = () => { if (open && !uit) setUit(true); };

  useEffect(() => {
    if (!open) return;
    const toets = (e: KeyboardEvent) => { if (e.key === "Escape") sluit(); };
    document.addEventListener("keydown", toets);
    const vorige = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", toets); document.body.style.overflow = vorige; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!uit) return;
    const t = setTimeout(() => { setOpen(false); setUit(false); }, 220);
    return () => clearTimeout(t);
  }, [uit]);

  return (
    <>
      <div className="app-tegel kaart flex flex-col p-4">
        <div className="flex items-start gap-3">
          <span className="shrink-0">{icoon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{naam}</p>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-tekst-2">{uitleg}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate">{status}</span>
          {actie ?? (knop && children ? (
            <button type="button" onClick={() => { setUit(false); setOpen(true); }} className={`${knop.licht ? "knop-licht" : "knop"} knop-klein shrink-0`}>{knop.tekst}</button>
          ) : null)}
        </div>
      </div>

      {open && children && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <button type="button" aria-label="Sluiten" onClick={sluit} className={`bot-achter absolute inset-0 ${uit ? "uit" : ""}`} />
          <div role="dialog" aria-modal="true" aria-label={naam} className={`dialoog kaart relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden ${uit ? "uit" : ""}`}>
            <header className="flex shrink-0 items-center gap-3 border-b border-lijn px-5 py-3">
              <span className="shrink-0">{icoon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{naam}</span>
                <span className="block truncate text-[13px] text-tekst-3">{status}</span>
              </span>
              <button type="button" onClick={sluit} className="iconknop h-8 w-8" aria-label="Sluiten">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </header>
            <div className="min-h-0 overflow-y-auto p-5">{children}</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
