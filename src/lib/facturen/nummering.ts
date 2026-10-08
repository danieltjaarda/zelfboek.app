import { db } from "@/lib/db";

/**
 * Atomisch volgnummer. Reeks per jaar: "<prefix>2026-0001".
 * Bij een nieuw jaar begint de teller opnieuw (volgnr wordt gereset als het laatste nummer uit een ander jaar komt).
 */
export async function volgendFactuurnummer(ondernemingId: string): Promise<string> {
  const jaar = new Date().getFullYear();
  return db.$transaction(async (tx) => {
    const o = await tx.onderneming.findUniqueOrThrow({ where: { id: ondernemingId } });
    const laatste = await tx.factuur.findFirst({ where: { ondernemingId }, orderBy: { aangemaakt: "desc" }, select: { nummer: true } });
    const laatsteJaar = laatste ? Number(laatste.nummer.replace(o.factuurPrefix, "").slice(0, 4)) : jaar;
    let volgnr = laatsteJaar === jaar ? o.factuurVolgnr : 0;
    volgnr += 1;
    await tx.onderneming.update({ where: { id: ondernemingId }, data: { factuurVolgnr: volgnr } });
    return `${o.factuurPrefix}${jaar}-${String(volgnr).padStart(4, "0")}`;
  });
}

export async function volgendOffertenummer(ondernemingId: string): Promise<string> {
  const jaar = new Date().getFullYear();
  return db.$transaction(async (tx) => {
    const o = await tx.onderneming.findUniqueOrThrow({ where: { id: ondernemingId } });
    const laatste = await tx.offerte.findFirst({ where: { ondernemingId }, orderBy: { datum: "desc" }, select: { nummer: true } });
    const laatsteJaar = laatste ? Number(laatste.nummer.replace(o.offertePrefix, "").slice(0, 4)) : jaar;
    let volgnr = laatsteJaar === jaar ? o.offerteVolgnr : 0;
    volgnr += 1;
    await tx.onderneming.update({ where: { id: ondernemingId }, data: { offerteVolgnr: volgnr } });
    return `${o.offertePrefix}${jaar}-${String(volgnr).padStart(4, "0")}`;
  });
}
