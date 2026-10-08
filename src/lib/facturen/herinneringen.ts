import { db } from "@/lib/db";
import { htmlMail, verstuurMail } from "@/lib/mail";
import { datumNl, euro, rond } from "@/lib/btw";
import { factuurPdf } from "./pdf";

/** Wettelijke incassokosten (WIK-staffel, art. 2 Besluit vergoeding voor buitengerechtelijke incassokosten). Minimum 40 euro. */
export function incassokosten(hoofdsom: number): number {
  let k = 0;
  let rest = hoofdsom;
  const staffel: [number, number][] = [
    [2500, 0.15],
    [2500, 0.1],
    [5000, 0.05],
    [190000, 0.01],
    [Infinity, 0.005],
  ];
  for (const [grens, pct] of staffel) {
    const deel = Math.min(rest, grens);
    k += deel * pct;
    rest -= deel;
    if (rest <= 0) break;
  }
  return rond(Math.min(6775, Math.max(40, k)));
}

/** Wettelijke handelsrente (indicatief 2026: 10,5% per jaar) over het aantal dagen te laat. */
export function wettelijkeRente(hoofdsom: number, dagenTeLaat: number, pctPerJaar = 10.5): number {
  return rond((hoofdsom * (pctPerJaar / 100) * Math.max(0, dagenTeLaat)) / 365);
}

type Trap = 1 | 2 | 3;

function trapVoor(dagen: number, al: number): Trap | null {
  if (dagen >= 35 && al < 3) return 3;
  if (dagen >= 21 && al < 2) return 2;
  if (dagen >= 7 && al < 1) return 1;
  return null;
}

export async function stuurHerinnering(factuurId: string, ondernemingId: string, forceerTrap?: Trap): Promise<Trap> {
  const f = await db.factuur.findFirstOrThrow({ where: { id: factuurId, ondernemingId }, include: { klant: true, onderneming: true } });
  if (!f.klant.email) throw new Error("Klant heeft geen e-mailadres.");
  const dagen = Math.floor((Date.now() - f.vervaldatum.getTime()) / 864e5);
  const trap: Trap = forceerTrap ?? (Math.min(3, f.herinneringen + 1) as Trap);
  const open = rond(f.totaal - f.betaaldBedrag);
  const o = f.onderneming;
  const pdf = await factuurPdf(f);

  let onderwerp: string;
  let regels: string[];
  if (trap === 1) {
    onderwerp = `Herinnering: factuur ${f.nummer} staat nog open`;
    regels = [
      `Beste ${f.klant.contactpersoon ?? f.klant.naam},`,
      `Misschien is het aan je aandacht ontsnapt: factuur ${f.nummer} van ${euro(open)} had een vervaldatum van ${datumNl(f.vervaldatum)}. Wil je het bedrag binnen 7 dagen overmaken op ${o.iban ?? "[IBAN]"} onder vermelding van ${f.nummer}?`,
      "Heb je al betaald, dan kun je dit bericht negeren.",
      `Met vriendelijke groet,<br>${o.naam}`,
    ];
  } else if (trap === 2) {
    onderwerp = `Tweede herinnering: factuur ${f.nummer}`;
    regels = [
      `Beste ${f.klant.contactpersoon ?? f.klant.naam},`,
      `Ondanks onze eerdere herinnering staat factuur ${f.nummer} van ${euro(open)} nog open (vervaldatum ${datumNl(f.vervaldatum)}). Graag binnen 7 dagen betalen op ${o.iban ?? "[IBAN]"} onder vermelding van ${f.nummer}.`,
      "Blijft betaling uit, dan zijn we genoodzaakt wettelijke rente en incassokosten in rekening te brengen.",
      `Met vriendelijke groet,<br>${o.naam}`,
    ];
  } else {
    const kosten = incassokosten(open);
    const rente = wettelijkeRente(open, dagen);
    onderwerp = `Aanmaning: factuur ${f.nummer}, laatste verzoek`;
    regels = [
      `Beste ${f.klant.contactpersoon ?? f.klant.naam},`,
      `Factuur ${f.nummer} van ${euro(open)} is ${dagen} dagen over de vervaldatum. Dit is een laatste verzoek tot betaling binnen 14 dagen na vandaag.`,
      `Blijft betaling uit, dan brengen we conform de Wet incassokosten ${euro(kosten)} incassokosten in rekening plus wettelijke handelsrente, tot nu ${euro(rente)}. Het totaal wordt dan ${euro(rond(open + kosten + rente))}.`,
      `Betalen kan op ${o.iban ?? "[IBAN]"} onder vermelding van ${f.nummer}.`,
      `Met vriendelijke groet,<br>${o.naam}`,
    ];
  }
  await verstuurMail({
    aan: f.klant.email,
    onderwerp,
    antwoordAan: o.email ?? undefined,
    tekst: regels.map((r) => r.replace(/<br>/g, "\n")).join("\n\n") + (f.betaalLinkUrl ? `\n\nDirect betalen: ${f.betaalLinkUrl}` : ""),
    html: htmlMail(onderwerp, regels, f.betaalLinkUrl ? { tekst: "Direct betalen", url: f.betaalLinkUrl } : undefined),
    bijlagen: [{ filename: `${f.nummer}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  await db.factuur.update({
    where: { id: f.id },
    data: { herinneringen: Math.max(f.herinneringen + 1, trap), laatsteHerinnering: new Date(), status: trap === 3 ? "aangemaand" : "herinnerd" },
  });
  await db.melding.create({
    data: { ondernemingId, soort: "herinnering", titel: `${trap === 3 ? "Aanmaning" : "Herinnering"} verstuurd`, tekst: `${f.nummer} aan ${f.klant.naam} (${euro(open)} open)`, link: `/app/facturen/${f.id}` },
  });
  return trap;
}

/** Automatisch herinneren (cron). Contract: verstuurHerinneringen(ondernemingId) → { verstuurd }. */
export async function verstuurHerinneringen(ondernemingId: string): Promise<{ verstuurd: number }> {
  const o = await db.onderneming.findUnique({ where: { id: ondernemingId } });
  if (!o || !o.herinneringAuto) return { verstuurd: 0 };
  const nu = Date.now();
  const open = await db.factuur.findMany({
    where: { ondernemingId, soort: "factuur", status: { in: ["verzonden", "herinnerd", "aangemaand"] }, vervaldatum: { lt: new Date(nu - 7 * 864e5) } },
    include: { klant: true },
  });
  let verstuurd = 0;
  for (const f of open) {
    if (!f.klant.email) continue;
    if (f.laatsteHerinnering && nu - f.laatsteHerinnering.getTime() < 7 * 864e5) continue;
    const dagen = Math.floor((nu - f.vervaldatum.getTime()) / 864e5);
    const trap = trapVoor(dagen, f.herinneringen);
    if (!trap) continue;
    try {
      await stuurHerinnering(f.id, ondernemingId, trap);
      verstuurd++;
    } catch (e) {
      await db.melding.create({
        data: { ondernemingId, soort: "systeem", titel: "Herinnering mislukt", tekst: `${f.nummer}: ${e instanceof Error ? e.message : String(e)}`, link: `/app/facturen/${f.id}` },
      });
    }
  }
  return { verstuurd };
}
