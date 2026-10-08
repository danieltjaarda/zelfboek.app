"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Woordmerk } from "@/components/Merk";
import { Icoon, type IcoonNaam } from "@/components/Iconen";

type Item = { href: string; label: string; icoon: IcoonNaam; teller?: number };
type Groep = { kop: string; items: Item[] };

type Props = {
  onderneming: { id: string; naam: string };
  ondernemingen: { id: string; naam: string }[];
  email: string;
  status: { toegang: boolean; tekst: string };
  tellers: { meldingen: number; bank: number };
  uitloggen: () => Promise<void>;
  wissel: (fd: FormData) => Promise<void>;
  children: React.ReactNode;
};

const NIEUW: { href: string; label: string; icoon: IcoonNaam }[] = [
  { href: "/app/facturen/nieuw", label: "Factuur", icoon: "factuur" },
  { href: "/app/offertes/nieuw", label: "Offerte", icoon: "offerte" },
  { href: "/app/bonnen", label: "Bon uploaden", icoon: "bon" },
  { href: "/app/klanten", label: "Klant", icoon: "klanten" },
  { href: "/app/uren", label: "Uren", icoon: "uren" },
];

/** De schil van de app: lichte zijbalk links, topbalk met zoeken en snelle acties, inhoud rechts. */
export function Schil({ onderneming, ondernemingen, email, status, tellers, uitloggen, wissel, children }: Props) {
  const pad = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const zoekveld = useRef<HTMLInputElement>(null);

  // "/" zet de cursor in het zoekveld; uitklapmenu's sluiten bij klik ernaast.
  useEffect(() => {
    const toets = (e: KeyboardEvent) => {
      const doel = e.target as HTMLElement | null;
      const typt = doel && (doel.tagName === "INPUT" || doel.tagName === "TEXTAREA" || doel.tagName === "SELECT" || doel.isContentEditable);
      if (e.key === "/" && !typt && !e.metaKey && !e.ctrlKey) { e.preventDefault(); zoekveld.current?.focus(); }
    };
    const klik = (e: MouseEvent) => {
      document.querySelectorAll<HTMLDetailsElement>("details.menu[open]").forEach((d) => { if (!d.contains(e.target as Node)) d.open = false; });
    };
    document.addEventListener("keydown", toets);
    document.addEventListener("click", klik);
    return () => { document.removeEventListener("keydown", toets); document.removeEventListener("click", klik); };
  }, []);

  const groepen: Groep[] = [
    { kop: "Vandaag", items: [
      { href: "/app", label: "Overzicht", icoon: "overzicht" },
      { href: "/app/bank", label: "Bank", icoon: "bank", teller: tellers.bank },
      { href: "/app/bonnen", label: "Bonnen", icoon: "bon" },
      { href: "/app/assistent", label: "Vraag het de bot", icoon: "bot" },
    ] },
    { kop: "Verkoop", items: [
      { href: "/app/facturen", label: "Facturen", icoon: "factuur" },
      { href: "/app/offertes", label: "Offertes", icoon: "offerte" },
      { href: "/app/klanten", label: "Klanten", icoon: "klanten" },
      { href: "/app/uren", label: "Uren", icoon: "uren" },
      { href: "/app/kilometers", label: "Kilometers", icoon: "km" },
    ] },
    { kop: "Belasting", items: [
      { href: "/app/btw", label: "Btw-aangifte", icoon: "btw" },
      { href: "/app/ib", label: "Inkomstenbelasting", icoon: "ib" },
      { href: "/app/activa", label: "Investeringen", icoon: "activa" },
      { href: "/app/jaarrekening", label: "Jaarrekening", icoon: "jaar" },
      { href: "/app/exports", label: "Exporteren", icoon: "export" },
    ] },
    { kop: "Instellen", items: [
      { href: "/app/koppelingen", label: "Koppelingen", icoon: "koppel" },
      { href: "/app/importeren", label: "Overstappen", icoon: "import" },
      { href: "/app/instellingen", label: "Instellingen", icoon: "instel" },
    ] },
  ];
  const actief = (href: string) => (href === "/app" ? pad === "/app" : pad.startsWith(href));
  const initialen = email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen md:flex">
      {menuOpen && <button type="button" aria-label="Menu sluiten" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-20 bg-inkt/30 md:hidden" />}

      <aside className={`${menuOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 w-[240px] flex-col border-r border-lijn bg-white md:sticky md:top-0 md:flex md:h-screen md:shrink-0`}>
        <div className="flex h-14 shrink-0 items-center px-5">
          <Link href="/app" aria-label="Naar het overzicht"><Woordmerk size={16} /></Link>
        </div>

        <div className="px-3 pb-1">
          {ondernemingen.length > 1 ? (
            <form action={wissel}>
              <select
                name="id"
                defaultValue={onderneming.id}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                aria-label="Onderneming"
                className="veld veld-klein font-medium"
              >
                {ondernemingen.map((x) => <option key={x.id} value={x.id}>{x.naam}</option>)}
              </select>
            </form>
          ) : (
            <p className="truncate rounded-md border border-lijn bg-papier px-2.5 py-1.5 text-[13px] font-medium text-tekst-2" title={onderneming.naam}>{onderneming.naam}</p>
          )}
        </div>

        <nav id="menu" className="flex-1 overflow-y-auto px-3 pb-3 pt-1">
          {groepen.map((g) => (
            <div key={g.kop} className="mb-1">
              <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[.06em] text-tekst-3">{g.kop}</p>
              {g.items.map((it) => {
                const a = actief(it.href);
                return (
                  <Link key={it.href} href={it.href} aria-current={a ? "page" : undefined} onClick={() => setMenuOpen(false)} className={`nav-item ${a ? "nav-item-actief" : ""}`}>
                    <Icoon naam={it.icoon} size={18} />
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.teller ? <span className="rounded-full bg-mosterd-licht px-1.5 text-[11px] font-semibold leading-[18px] text-mosterd-tekst">{it.teller}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-lijn px-5 py-3 text-[12px] text-tekst-3">
          <Link href="/app/instellingen?tab=abonnement" className={status.toegang ? "hover:text-tekst" : "font-semibold text-rood-tekst"}>{status.tekst}</Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="topbalk sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-lijn bg-white px-4 md:px-6">
          <button type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="menu" className="iconknop md:hidden" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>

          <form action="/app/zoeken" method="get" role="search" className="relative w-full max-w-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tekst-3" aria-hidden>
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              ref={zoekveld}
              name="q"
              type="search"
              placeholder="Zoek facturen, klanten, bankregels"
              aria-label="Zoeken"
              autoComplete="off"
              className="veld veld-klein border-transparent bg-papier pl-9 pr-9 shadow-none focus:bg-white"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-lijn-2 bg-white px-1.5 font-sans text-[11px] leading-[16px] text-tekst-3 md:block">/</kbd>
          </form>

          <div className="ml-auto flex items-center gap-1.5">
            <details className="menu relative">
              <summary className="knop knop-klein">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                Nieuw
              </summary>
              <div className="menu-lijst">
                {NIEUW.map((n) => <Link key={n.href} href={n.href}><Icoon naam={n.icoon} size={16} className="text-tekst-3" />{n.label}</Link>)}
              </div>
            </details>

            <Link href="/app/meldingen" className="iconknop relative" aria-label={tellers.meldingen ? `${tellers.meldingen} ongelezen meldingen` : "Meldingen"}>
              <Icoon naam="bel" size={18} />
              {tellers.meldingen > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rood ring-2 ring-white" />}
            </Link>

            <details className="menu relative">
              <summary className="flex h-8 w-8 items-center justify-center rounded-full bg-groen-licht text-[12px] font-semibold text-groen-tekst" aria-label="Account">{initialen}</summary>
              <div className="menu-lijst">
                <p className="truncate px-2.5 py-1.5 text-[13px] text-tekst-2" title={email}>{email}</p>
                <hr />
                <Link href="/app/instellingen">Instellingen</Link>
                <Link href="/app/instellingen?tab=abonnement">Abonnement <span className="ml-auto text-[12px] text-tekst-3">{status.tekst}</span></Link>
                <hr />
                <form action={uitloggen}><button type="submit">Uitloggen</button></form>
              </div>
            </details>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
