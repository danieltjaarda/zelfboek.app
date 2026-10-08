import { db } from "@/lib/db";
import { rond } from "@/lib/btw";

/** Factuur (deels) betaald markeren. Zonder bedrag: volledig. */
export async function markeerBetaald(factuurId: string, ondernemingId: string, bedrag?: number, datum = new Date()) {
  const f = await db.factuur.findFirstOrThrow({ where: { id: factuurId, ondernemingId } });
  const nieuw = rond(bedrag == null ? f.totaal : f.betaaldBedrag + bedrag);
  const volledig = nieuw >= f.totaal - 0.01;
  await db.factuur.update({
    where: { id: f.id },
    data: { betaaldBedrag: nieuw, status: volledig ? "betaald" : f.status, betaaldOp: volledig ? datum : null },
  });
}

/** Afletteren: bankregel koppelen aan factuur, als omzet bevestigen, factuur (deels) betaald. */
export async function letterAf(transactieId: string, factuurId: string, ondernemingId: string) {
  const [t, f] = await Promise.all([
    db.transactie.findFirstOrThrow({ where: { id: transactieId, ondernemingId } }),
    db.factuur.findFirstOrThrow({ where: { id: factuurId, ondernemingId } }),
  ]);
  const btwCode = f.btwVerlegd ? "verlegd" : f.btw > 0 ? (rond(f.btw / Math.max(f.subtotaal, 0.01)) >= 0.2 ? "21" : "9") : "0";
  await db.transactie.update({
    where: { id: t.id },
    data: {
      factuurId: f.id,
      zakelijk: true,
      bevestigd: true,
      zekerheid: 1,
      categorie: f.btwVerlegd ? "omzet_eu" : btwCode === "9" ? "omzet_laag" : "omzet",
      btwCode,
      btwBedrag: rond(Math.abs(t.bedrag) * (f.btw / Math.max(f.totaal, 0.01))),
      uitleg: `Afgeletterd met factuur ${f.nummer}`,
    },
  });
  await markeerBetaald(f.id, ondernemingId, Math.abs(t.bedrag), t.datum);
}

/** Open factuurbedrag per klant. */
export async function openstaandPerKlant(ondernemingId: string) {
  const open = await db.factuur.findMany({
    where: { ondernemingId, status: { notIn: ["betaald", "concept", "oninbaar", "gecrediteerd"] }, soort: "factuur" },
    select: { klantId: true, totaal: true, betaaldBedrag: true },
  });
  const m = new Map<string, number>();
  for (const f of open) m.set(f.klantId, rond((m.get(f.klantId) ?? 0) + f.totaal - f.betaaldBedrag));
  return m;
}
