"use client";

import Link from "next/link";
import { useState } from "react";
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
};

export function Zijbalk({ onderneming, ondernemingen, email, status, tellers, uitloggen, wissel }: Props) {
  const pad = usePathname();
  const [open, setOpen] = useState(false);
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
      { href: "/app/meldingen", label: "Meldingen", icoon: "bel", teller: tellers.meldingen },
      { href: "/app/instellingen", label: "Instellingen", icoon: "instel" },
    ] },
  ];
  const actief = (href: string) => (href === "/app" ? pad === "/app" : pad.startsWith(href));

  return (
    <aside className="flex w-full shrink-0 flex-col bg-inkt text-white md:sticky md:top-0 md:h-screen md:w-[264px]">
      <div className="flex items-center justify-between px-5 pb-3 pt-4 md:block md:pb-1 md:pt-4">
        <Link href="/app"><Woordmerk donker size={19} /></Link>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="menu" className="knop-licht knop-klein border-white/20 bg-transparent text-white md:hidden">
          {open ? "Sluiten" : "Menu"}
        </button>
        {ondernemingen.length > 1 ? (
          <form action={wissel} className="mt-3 hidden md:block">
            <select
              name="id"
              defaultValue={onderneming.id}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="w-full rounded-lg border border-white/15 bg-white/[.06] px-3 py-2 text-[15px] text-white"
            >
              {ondernemingen.map((x) => <option key={x.id} value={x.id} className="text-inkt">{x.naam}</option>)}
            </select>
          </form>
        ) : (
          <p className="truncate text-[15px] text-white/60 md:mt-1">{onderneming.naam}</p>
        )}
      </div>

      <nav id="menu" className={`${open ? "block" : "hidden"} px-3 pb-3 md:block md:flex-1 md:overflow-y-auto md:pb-2 md:pt-2`}>
        {groepen.map((g) => (
          <div key={g.kop} className="mb-1.5">
            <p className="px-3 pb-1 pt-2.5 text-[12px] font-medium uppercase tracking-[.08em] text-white/35">{g.kop}</p>
            {g.items.map((it) => {
              const a = actief(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={a ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`relative flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-[6px] text-[15px] ${a ? "bg-white/[.12] font-medium text-white" : "text-white/75 hover:bg-white/[.06] hover:text-white"}`}
                >
                  {a && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-mosterd" />}
                  <Icoon naam={it.icoon} className={a ? "text-mosterd" : "text-white/55"} />
                  <span className="flex-1">{it.label}</span>
                  {it.teller ? (
                    <span className="rounded-full bg-mosterd px-2 text-[13px] font-semibold leading-[22px] text-inkt">{it.teller}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="hidden border-t border-white/10 px-5 py-3 md:block">
        <p className="truncate text-[13px] text-white/60" title={email}>{email}</p>
        <div className="mt-0.5 flex items-center justify-between text-[14px]">
          <Link href="/app/instellingen?tab=abonnement" className={status.toegang ? "text-white/55 hover:text-white" : "font-semibold text-mosterd"}>{status.tekst}</Link>
          <form action={uitloggen}><button className="text-white/55 hover:text-white">Uitloggen</button></form>
        </div>
      </div>
    </aside>
  );
}
