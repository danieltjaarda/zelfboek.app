import { db } from "@/lib/db";
import { esc, htmlMail, verstuurMail } from "@/lib/mail";
import { datumNl, euro } from "@/lib/btw";
import { factuurPdf, offertePdf } from "./pdf";
import { factuurUbl } from "./ubl";
import { maakBetaallink } from "./mollie";

/** Factuur per e-mail versturen met PDF en UBL; maakt een Mollie-betaallink als die koppeling bestaat. */
export async function verzendFactuur(factuurId: string, ondernemingId: string, opties?: { aan?: string; tekst?: string }) {
  const f = await db.factuur.findFirstOrThrow({ where: { id: factuurId, ondernemingId }, include: { klant: true, onderneming: true } });
  const aan = opties?.aan ?? f.klant.email;
  if (!aan) throw new Error("Klant heeft geen e-mailadres.");

  let betaalLink: string | null = null;
  if (f.soort === "factuur") {
    try {
      betaalLink = await maakBetaallink(f.id, ondernemingId);
    } catch (e) {
      await db.melding.create({
        data: { ondernemingId, soort: "systeem", titel: "Betaallink mislukt", tekst: e instanceof Error ? e.message : String(e), link: `/app/facturen/${f.id}` },
      });
    }
  }
  const vers = await db.factuur.findUniqueOrThrow({ where: { id: f.id }, include: { klant: true, onderneming: true } });
  const [pdf, ubl] = await Promise.all([factuurPdf(vers), factuurUbl(vers)]);

  const o = vers.onderneming;
  const credit = vers.soort === "credit";
  const onderwerp = credit ? `Creditfactuur ${vers.nummer} van ${o.naam}` : `Factuur ${vers.nummer} van ${o.naam}`;
  const regels = [
    `Beste ${esc(vers.klant.contactpersoon ?? vers.klant.naam)},`,
    opties?.tekst ??
      (credit
        ? `Hierbij ontvang je creditfactuur ${vers.nummer} van ${euro(Math.abs(vers.totaal))}.`
        : `Hierbij ontvang je factuur ${vers.nummer} van ${euro(vers.totaal)}. Graag betalen vóór ${datumNl(vers.vervaldatum)} op ${o.iban ?? "[IBAN]"} onder vermelding van ${vers.nummer}.`),
    "De factuur zit als PDF en als UBL e-factuur in de bijlage.",
    `Met vriendelijke groet,<br>${esc(o.naam)}`,
  ];
  await verstuurMail({
    aan,
    onderwerp,
    antwoordAan: o.email ?? undefined,
    tekst: regels.map((r) => r.replace(/<br>/g, "\n")).join("\n\n") + (betaalLink ? `\n\nDirect betalen: ${betaalLink}` : ""),
    html: htmlMail(onderwerp, regels, betaalLink ? { tekst: "Direct betalen via iDEAL", url: betaalLink } : undefined),
    bijlagen: [
      { filename: `${vers.nummer}.pdf`, content: pdf, contentType: "application/pdf" },
      { filename: `${vers.nummer}.xml`, content: Buffer.from(ubl, "utf8"), contentType: "application/xml" },
    ],
  });
  await db.factuur.update({
    where: { id: vers.id },
    data: { status: vers.status === "concept" ? "verzonden" : vers.status, verzondenOp: vers.verzondenOp ?? new Date() },
  });
}

export async function verzendOfferte(offerteId: string, ondernemingId: string, opties?: { aan?: string; tekst?: string }) {
  const of = await db.offerte.findFirstOrThrow({ where: { id: offerteId, ondernemingId }, include: { klant: true, onderneming: true } });
  const aan = opties?.aan ?? of.klant.email;
  if (!aan) throw new Error("Klant heeft geen e-mailadres.");
  const pdf = await offertePdf(of);
  const basis = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${basis}/offerte/${of.acceptToken}`;
  const o = of.onderneming;
  const onderwerp = `Offerte ${of.nummer} van ${o.naam}`;
  const regels = [
    `Beste ${esc(of.klant.contactpersoon ?? of.klant.naam)},`,
    opties?.tekst ?? `Hierbij ontvang je offerte ${of.nummer} van ${euro(of.totaal)} (inclusief btw). De offerte is geldig tot ${datumNl(of.geldigTot)}.`,
    "Je kunt de offerte online accepteren of afwijzen via de knop hieronder.",
    `Met vriendelijke groet,<br>${esc(o.naam)}`,
  ];
  await verstuurMail({
    aan,
    onderwerp,
    antwoordAan: o.email ?? undefined,
    tekst: regels.map((r) => r.replace(/<br>/g, "\n")).join("\n\n") + `\n\nAccepteren: ${link}`,
    html: htmlMail(onderwerp, regels, { tekst: "Offerte bekijken en accepteren", url: link }),
    bijlagen: [{ filename: `${of.nummer}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  await db.offerte.update({ where: { id: of.id }, data: { status: of.status === "concept" ? "verzonden" : of.status, verzondenOp: of.verzondenOp ?? new Date() } });
}
