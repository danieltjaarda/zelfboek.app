import { connection } from "next/server";
import Link from "next/link";
import { db, huidigeOnderneming } from "@/lib/db";
import { btwAangifte, btwDeadline, datumNl, euro, periodeBereik, rond } from "@/lib/btw";
import { CATEGORIE_INFO } from "@/lib/categorieen";
import { huidigTijdvak } from "@/lib/assistent/tools";
import { Cijferband, Kaart, Kop, Tegel, knop, knopLicht } from "@/components/ui";
import { OmzetGrafiek } from "@/components/OmzetGrafiek";
import { EersteStappen } from "@/components/EersteStappen";

export const instant = false;

export default async function Overzicht() {
  await connection();
  const o = await huidigeOnderneming();
  const nu = new Date();
  const jaar = nu.getFullYear();
  const tv = huidigTijdvak(o.btwTijdvak);
  const { start, eind } = periodeBereik(o.btwTijdvak, tv.jaar, tv.periode || 1);
  const twaalfTerug = new Date(nu.getFullYear(), nu.getMonth() - 11, 1);

  const [regels, tijdvakRegels, twijfelRegels, twijfelTotaal, onbeoordeeld, openFacturen, bonnenLos, rekeningen, taken] = await Promise.all([
    db.transactie.findMany({ where: { ondernemingId: o.id, zakelijk: true, datum: { gte: new Date(Math.min(twaalfTerug.getTime(), new Date(jaar, 0, 1).getTime())) } } }),
    db.transactie.findMany({ where: { ondernemingId: o.id, datum: { gte: start, lt: eind } } }),
    db.transactie.findMany({ where: { ondernemingId: o.id, bevestigd: false, zakelijk: { not: null } }, orderBy: { datum: "desc" }, take: 4 }),
    db.transactie.count({ where: { ondernemingId: o.id, bevestigd: false, zakelijk: { not: null } } }),
    db.transactie.count({ where: { ondernemingId: o.id, zakelijk: null } }),
    db.factuur.findMany({ where: { ondernemingId: o.id, status: { in: ["verzonden", "herinnerd", "aangemaand"] } }, include: { klant: true }, orderBy: { vervaldatum: "asc" } }),
    db.bon.count({ where: { ondernemingId: o.id, status: "uitgelezen" } }),
    db.bankrekening.findMany({ where: { ondernemingId: o.id } }),
    db.taak.findMany({ where: { ondernemingId: o.id, klaar: false }, orderBy: [{ deadline: "asc" }, { aangemaakt: "desc" }], take: 4 }),
  ]);

  const excl = (t: { bedrag: number; btwBedrag: number | null; priveDeel: number }) => (Math.abs(t.bedrag) - (t.btwBedrag ?? 0)) * (1 - t.priveDeel);
  const telt = (t: { categorie: string | null }) => {
    const s = t.categorie && t.categorie in CATEGORIE_INFO ? CATEGORIE_INFO[t.categorie as keyof typeof CATEGORIE_INFO].soort : "kosten";
    return s === "omzet" || s === "kosten";
  };
  const jaarRegels = regels.filter((t) => t.datum.getFullYear() === jaar && telt(t));
  const omzetJaar = rond(jaarRegels.filter((t) => t.bedrag > 0).reduce((s, t) => s + excl(t), 0));
  const kostenJaar = rond(jaarRegels.filter((t) => t.bedrag < 0).reduce((s, t) => s + excl(t), 0));
  const winst = rond(omzetJaar - kostenJaar);
  const aangifte = btwAangifte(tijdvakRegels);
  const deadline = btwDeadline(eind);
  const saldo = rekeningen.reduce((s, r) => s + (r.saldo ?? 0), 0);
  const openBedrag = rond(openFacturen.reduce((s, f) => s + f.totaal - f.betaaldBedrag, 0));
  const teLaat = openFacturen.filter((f) => f.vervaldatum < nu);

  const maanden = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(twaalfTerug.getFullYear(), twaalfTerug.getMonth() + i, 1);
    return { sleutel: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("nl-NL", { month: "short" }).replace(".", ""), omzet: 0, kosten: 0 };
  });
  for (const t of regels) {
    if (!telt(t)) continue;
    const m = maanden.find((x) => x.sleutel === `${t.datum.getFullYear()}-${t.datum.getMonth()}`);
    if (!m) continue;
    if (t.bedrag > 0) m.omzet += excl(t); else m.kosten += excl(t);
  }

  const tijdvakNaam = o.btwTijdvak === "maand" ? `maand ${tv.periode}` : o.btwTijdvak === "jaar" ? `${tv.jaar}` : `${tv.periode}e kwartaal`;
  const vragen = twijfelTotaal + bonnenLos + taken.length + (onbeoordeeld > 0 ? 1 : 0);
  const dagenTotDeadline = Math.ceil((deadline.getTime() - nu.getTime()) / 864e5);
  const [aantalTransacties, aantalBonnen, aantalFacturen, aantalKoppelingen] = await Promise.all([
    db.transactie.count({ where: { ondernemingId: o.id } }),
    db.bon.count({ where: { ondernemingId: o.id } }),
    db.factuur.count({ where: { ondernemingId: o.id } }),
    db.koppeling.count({ where: { ondernemingId: o.id, soort: "enablebanking" } }),
  ]);
  const stappen = [
    { klaar: Boolean(o.kvk && o.iban), titel: "Vul je bedrijfsgegevens in", tekst: "KvK, btw-nummer en IBAN. Komen op je facturen en in je aangifte.", href: "/app/instellingen", knop: "Invullen" },
    { klaar: aantalTransacties > 0 || aantalKoppelingen > 0, titel: "Koppel je bank of upload een afschrift", tekst: "Vanaf dan boekt de bot elke nacht je nieuwe regels.", href: "/app/koppelingen", knop: "Bank koppelen" },
    { klaar: aantalBonnen > 0, titel: "Maak een foto van je eerste bon", tekst: "De bot leest het bedrag en hangt de bon aan de juiste bankregel.", href: "/app/bonnen", knop: "Bon uploaden" },
    { klaar: aantalFacturen > 0, titel: "Stuur je eerste factuur", tekst: "Met iDEAL-link. De bot volgt de betaling en herinnert zelf.", href: "/app/facturen/nieuw", knop: "Factuur maken" },
  ];
  const groet = nu.getHours() < 12 ? "Goedemorgen" : nu.getHours() < 18 ? "Goedemiddag" : "Goedenavond";
  const teDoenTitel = aantalTransacties === 0 && vragen === 0 ? "Nog niets te boeken" : vragen === 0 ? "Alles is geboekt" : vragen === 1 ? "Alles is geboekt, één vraag voor je" : `Alles is geboekt, ${vragen} kleine vragen voor je`;
  const btwZin = `Btw ${tijdvakNaam}: ${euro(Math.abs(aangifte["5c_te_betalen"]))} ${aangifte["5c_te_betalen"] >= 0 ? "te betalen" : "terug"}, uiterlijk ${datumNl(deadline)}${dagenTotDeadline <= 14 ? ` (over ${dagenTotDeadline} dagen)` : ""}.`;

  return (
    <>
      <Kop titel={`${groet}, ${o.naam}`} sub={datumNl(nu)}>
        <Link href="/app/assistent" className={knopLicht}>Vraag het de bot</Link>
        <Link href="/app/facturen/nieuw" className={knop}>Nieuwe factuur</Link>
      </Kop>

      <EersteStappen stappen={stappen} />

      {/* Te doen: één regel die zegt of je iets moet doen, daaronder de open vragen. */}
      <Kaart className="mb-6" titel={teDoenTitel} actie={
        vragen > 0 ? <Link href="/app/bank?filter=twijfel" className="knop knop-klein">Beantwoord de vragen</Link>
        : aantalTransacties === 0 ? <Link href="/app/koppelingen" className="knop knop-klein">Bank koppelen</Link> : undefined
      }>
        {vragen === 0 ? (
          <p className="flex items-center gap-2.5 px-5 py-4 text-sm text-tekst-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-groen-licht text-groen">
              <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            {aantalTransacties === 0 ? "Zodra er bankregels zijn, boekt de bot ze elke nacht en stelt alleen vragen bij twijfel." : "Geen open vragen. De bot kijkt elke nacht opnieuw."}
          </p>
        ) : (
          <ul className="divide-y divide-lijn">
            {twijfelRegels.map((t) => (
              <li key={t.id}>
                <Link href="/app/bank?filter=twijfel" className="flex items-center gap-3 px-5 py-3 hover:bg-papier">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-mosterd" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{t.tegenpartij} {euro(Math.abs(t.bedrag))}: zakelijk of privé?</span>
                    <span className="block truncate text-[13px] text-tekst-3">{t.uitleg}</span>
                  </span>
                  <span className="text-[13px] text-tekst-3">{datumNl(t.datum)}</span>
                </Link>
              </li>
            ))}
            {twijfelTotaal > twijfelRegels.length && (
              <li><Link href="/app/bank?filter=twijfel" className="block px-5 py-2.5 text-[13px] text-tekst-2 hover:bg-papier">Nog {twijfelTotaal - twijfelRegels.length} twijfelregels</Link></li>
            )}
            {onbeoordeeld > 0 && (
              <li><Link href="/app/bank?filter=open" className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-papier"><span className="h-2 w-2 shrink-0 rounded-full bg-tekst-3" />{onbeoordeeld} {onbeoordeeld === 1 ? "regel wacht" : "regels wachten"} nog op de bot</Link></li>
            )}
            {bonnenLos > 0 && (
              <li><Link href="/app/bonnen?status=uitgelezen" className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-papier"><span className="h-2 w-2 shrink-0 rounded-full bg-mosterd" />{bonnenLos} {bonnenLos === 1 ? "bon hoort" : "bonnen horen"} nog bij geen bankregel</Link></li>
            )}
            {taken.map((t) => (
              <li key={t.id}><Link href="/app/meldingen" className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-papier"><span className="h-2 w-2 shrink-0 rounded-full bg-mosterd" /><span className="min-w-0 flex-1 truncate">{t.titel}</span>{t.deadline && <span className="text-[13px] text-tekst-3">{datumNl(t.deadline)}</span>}</Link></li>
            ))}
          </ul>
        )}
        <p className="border-t border-lijn bg-papier px-5 py-2.5 text-[13px] text-tekst-2">{btwZin} <Link href="/app/btw" className="font-medium text-primair-tekst hover:underline">Naar de aangifte</Link></p>
      </Kaart>

      <Cijferband>
        <Tegel label={`Omzet ${jaar}`} waarde={omzetJaar} hint="zonder btw" reeks={maanden.map((m) => m.omzet)} />
        <Tegel label={`Kosten ${jaar}`} waarde={kostenJaar} hint="zonder btw" reeks={maanden.map((m) => m.kosten)} reeksKleur="var(--tekst-3)" />
        <Tegel label="Winst tot nu" waarde={winst} accent={winst >= 0 ? "groen" : "rood"} hint="basis voor je IB" />
        <Tegel label="Op de bank" waarde={rekeningen.some((r) => r.saldo != null) ? saldo : "–"} hint={`${rekeningen.length} ${rekeningen.length === 1 ? "rekening" : "rekeningen"}`} />
        <Tegel label="Nog te ontvangen" waarde={openBedrag} accent={teLaat.length ? "rood" : undefined} hint={teLaat.length ? `${teLaat.length} te laat` : `${openFacturen.length} open`} />
        <Tegel label={`Btw ${tijdvakNaam}`} waarde={Math.abs(aangifte["5c_te_betalen"])} hint={aangifte["5c_te_betalen"] >= 0 ? "te betalen" : "terug te krijgen"} />
      </Cijferband>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Kaart titel="Omzet en kosten, laatste 12 maanden" actie={<Link href="/app/jaarrekening" className="knop-tekst knop-klein">Jaarrekening</Link>}>
          <div className="px-5 pb-5 pt-4">
            <OmzetGrafiek data={maanden.map((m) => ({ label: m.label, omzet: rond(m.omzet), kosten: rond(m.kosten) }))} />
          </div>
        </Kaart>

        <Kaart titel="Openstaande facturen" actie={<Link href="/app/facturen" className="knop-tekst knop-klein">Alle facturen</Link>}>
          {openFacturen.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-tekst-2">Niets open. <Link href="/app/facturen/nieuw" className="text-primair-tekst underline">Nieuwe factuur</Link></p>
          ) : (
            <ul className="divide-y divide-lijn">
              {openFacturen.slice(0, 6).map((f) => {
                const laat = f.vervaldatum < nu;
                return (
                  <li key={f.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <Link href={`/app/facturen/${f.id}`} className="block truncate font-medium hover:underline">{f.klant.naam}</Link>
                      <span className={`text-[13px] ${laat ? "text-rood-tekst" : "text-tekst-3"}`}>
                        {f.nummer}, {laat ? `${Math.ceil((nu.getTime() - f.vervaldatum.getTime()) / 864e5)} dagen te laat` : `vervalt ${datumNl(f.vervaldatum)}`}
                      </span>
                    </div>
                    <span className="cijfer">{euro(f.totaal - f.betaaldBedrag)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Kaart>
      </div>
    </>
  );
}
