import { db } from "@/lib/db";

/**
 * Atomisch volgnummer. Reeks per jaar: "<prefix>2026-0001".
 * Eén UPDATE doet het ophogen én de jaarreset, zodat twee gelijktijdige aanroepen (cron plus gebruiker,
 * twee tabbladen) nooit hetzelfde nummer krijgen. Een nummer dat toch al bestaat (handmatig of geïmporteerd) wordt overgeslagen.
 */
async function volgnummer(ondernemingId: string, soort: "factuur" | "offerte"): Promise<number> {
  const jaar = new Date().getFullYear();
  const kolomNr = soort === "factuur" ? "factuurVolgnr" : "offerteVolgnr";
  const kolomJaar = soort === "factuur" ? "factuurJaar" : "offerteJaar";
  const rijen = await db.$queryRawUnsafe<{ nr: number }[]>(
    `UPDATE "Onderneming" SET "${kolomNr}" = CASE WHEN "${kolomJaar}" IS NULL OR "${kolomJaar}" = $2 THEN "${kolomNr}" + 1 ELSE 1 END, "${kolomJaar}" = $2 WHERE id = $1 RETURNING "${kolomNr}" AS nr`,
    ondernemingId,
    jaar,
  );
  if (!rijen[0]) throw new Error("Onderneming niet gevonden.");
  return rijen[0].nr;
}

export async function volgendFactuurnummer(ondernemingId: string): Promise<string> {
  const o = await db.onderneming.findUniqueOrThrow({ where: { id: ondernemingId }, select: { factuurPrefix: true } });
  const jaar = new Date().getFullYear();
  for (let poging = 0; poging < 50; poging++) {
    const nr = await volgnummer(ondernemingId, "factuur");
    const nummer = `${o.factuurPrefix}${jaar}-${String(nr).padStart(4, "0")}`;
    const bestaat = await db.factuur.findFirst({ where: { ondernemingId, nummer }, select: { id: true } });
    if (!bestaat) return nummer;
  }
  throw new Error("Geen vrij factuurnummer gevonden.");
}

export async function volgendOffertenummer(ondernemingId: string): Promise<string> {
  const o = await db.onderneming.findUniqueOrThrow({ where: { id: ondernemingId }, select: { offertePrefix: true } });
  const jaar = new Date().getFullYear();
  for (let poging = 0; poging < 50; poging++) {
    const nr = await volgnummer(ondernemingId, "offerte");
    const nummer = `${o.offertePrefix}${jaar}-${String(nr).padStart(4, "0")}`;
    const bestaat = await db.offerte.findFirst({ where: { ondernemingId, nummer }, select: { id: true } });
    if (!bestaat) return nummer;
  }
  throw new Error("Geen vrij offertenummer gevonden.");
}
