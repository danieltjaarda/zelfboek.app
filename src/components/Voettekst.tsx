import Link from "next/link";
import { MERK } from "@/lib/merk";
import { Woordmerk } from "@/components/Merk";

const kolommen: { kop: string; links: [string, string][] }[] = [
  { kop: "Product", links: [["Wat hij doet", "/#functies"], ["Werkt met", "/#werkt-met"], ["Prijs", "/#prijs"], ["Inloggen", "/login"]] },
  { kop: "Voor wie", links: [["Zzp'ers en freelancers", "/#functies"], ["Webshops en marktplaatsen", "/#werkt-met"], ["Overstappen van een ander pakket", "/#werkt-met"]] },
  { kop: "Hulp", links: [["Veelgestelde vragen", "/#vragen"], ["Contact", "mailto:hallo@zelfboek.nl"], ["Status", "/#"]] },
  { kop: "Juridisch", links: [["Privacy", "/privacy"], ["Voorwaarden", "/voorwaarden"], ["Verwerkersovereenkomst", "/privacy#verwerker"]] },
];

export function Voettekst() {
  return (
    <footer className="bg-inkt text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          <div>
            <Woordmerk donker size={20} />
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-white/65">Boekhouding die zichzelf doet. Voor eenmanszaken en vof's zonder personeel.</p>
            <Link href="/login" className="knop mt-6 bg-mosterd text-inkt hover:bg-[#f0c74a]">Start gratis, 30 dagen</Link>
          </div>
          {kolommen.map((k) => (
            <div key={k.kop}>
              <p className="text-[15px] font-semibold">{k.kop}</p>
              <ul className="mt-3 space-y-2 text-[15px] text-white/65">
                {k.links.map(([t, h]) => <li key={t}><Link href={h} className="hover:text-white">{t}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[14px] text-white/45">
          <span>© 2026 {MERK}. Servers in de EU.</span>
          <span>{MERK} is software en geeft geen fiscaal advies over je privésituatie. Je dient je aangiften zelf in.</span>
        </div>
      </div>
    </footer>
  );
}
