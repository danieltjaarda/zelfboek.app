import { db } from "@/lib/db";
import { rond } from "@/lib/btw";

export type ActivumBasis = {
  id: string;
  naam: string;
  aanschafDatum: Date;
  aanschafBedrag: number;
  restwaarde: number;
  looptijdJaren: number;
  priveDeel: number;
  verkochtOp: Date | null;
  verkoopBedrag: number | null;
};

/** Afschrijving per maand (lineair, vanaf de maand van aanschaf). Zakelijk deel alleen. */
export function maandAfschrijving(a: ActivumBasis): number {
  const basis = Math.max(0, a.aanschafBedrag - a.restwaarde) * (1 - a.priveDeel);
  const maanden = Math.max(1, a.looptijdJaren * 12);
  return rond(basis / maanden);
}

function maandIndex(d: Date) {
  return d.getFullYear() * 12 + d.getMonth();
}

/** Aantal afgeschreven maanden tot en met de peildatum (of verkoopdatum). */
export function afgeschrevenMaanden(a: ActivumBasis, peildatum: Date): number {
  const einde = a.verkochtOp && a.verkochtOp < peildatum ? a.verkochtOp : peildatum;
  const n = maandIndex(einde) - maandIndex(a.aanschafDatum) + 1;
  return Math.min(Math.max(0, n), a.looptijdJaren * 12);
}

/** Cumulatieve afschrijving en boekwaarde op een peildatum. */
export function boekwaarde(a: ActivumBasis, peildatum: Date) {
  const zakelijkDeel = 1 - a.priveDeel;
  const aanschafZakelijk = rond(a.aanschafBedrag * zakelijkDeel);
  const restZakelijk = rond(a.restwaarde * zakelijkDeel);
  const cumulatief = Math.min(rond(maandAfschrijving(a) * afgeschrevenMaanden(a, peildatum)), aanschafZakelijk - restZakelijk);
  return {
    aanschafZakelijk,
    cumulatief,
    boekwaarde: rond(aanschafZakelijk - cumulatief),
    perMaand: maandAfschrijving(a),
    perJaar: rond(maandAfschrijving(a) * 12),
  };
}

/** Afschrijving binnen een boekjaar. */
export function afschrijvingInJaar(a: ActivumBasis, jaar: number): number {
  const start = new Date(jaar, 0, 1);
  const eind = new Date(jaar, 11, 31);
  const tot = afgeschrevenMaanden(a, eind);
  const voor = a.aanschafDatum < start ? afgeschrevenMaanden(a, new Date(jaar - 1, 11, 31)) : 0;
  const maanden = Math.max(0, tot - voor);
  const bw = boekwaarde(a, new Date(jaar - 1, 11, 31));
  const maxRest = Math.max(0, bw.boekwaarde - rond(a.restwaarde * (1 - a.priveDeel)));
  return Math.min(rond(maandAfschrijving(a) * maanden), maxRest);
}

/** Boekresultaat bij verkoop: verkoopprijs (zakelijk deel) minus boekwaarde op verkoopdatum. */
export function boekresultaatVerkoop(a: ActivumBasis): number | null {
  if (!a.verkochtOp || a.verkoopBedrag == null) return null;
  const bw = boekwaarde(a, a.verkochtOp).boekwaarde;
  return rond(a.verkoopBedrag * (1 - a.priveDeel) - bw);
}

/** Jaarschema: per jaar afschrijving en boekwaarde einde jaar. */
export function afschrijvingsschema(a: ActivumBasis) {
  const rijen: { jaar: number; afschrijving: number; boekwaardeEind: number }[] = [];
  const startJaar = a.aanschafDatum.getFullYear();
  const eindJaar = a.verkochtOp ? a.verkochtOp.getFullYear() : startJaar + a.looptijdJaren;
  for (let j = startJaar; j <= eindJaar; j++) {
    const af = afschrijvingInJaar(a, j);
    if (af <= 0 && j > startJaar) break;
    rijen.push({ jaar: j, afschrijving: af, boekwaardeEind: boekwaarde(a, new Date(j, 11, 31)).boekwaarde });
  }
  return rijen;
}

/**
 * Memoriaalboekingen "afschrijving" aanmaken voor alle maanden tot en met de peildatum.
 * Idempotent: de omschrijving bevat activumId en maand als sleutel.
 */
export async function boekAfschrijvingen(ondernemingId: string, totEnMet = new Date()) {
  const activa = await db.activum.findMany({ where: { ondernemingId } });
  const bestaande = await db.memoriaalboeking.findMany({
    where: { ondernemingId, soort: "afschrijving" },
    select: { omschrijving: true },
  });
  const sleutels = new Set(bestaande.map((b) => b.omschrijving.split(" | ")[0]));
  let aangemaakt = 0;
  for (const a of activa) {
    const per = maandAfschrijving(a);
    if (per <= 0) continue;
    const maanden = afgeschrevenMaanden(a, totEnMet);
    for (let i = 0; i < maanden; i++) {
      const d = new Date(a.aanschafDatum.getFullYear(), a.aanschafDatum.getMonth() + i + 1, 0);
      const sleutel = `AFS:${a.id}:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (sleutels.has(sleutel)) continue;
      await db.memoriaalboeking.create({
        data: {
          ondernemingId,
          datum: d,
          omschrijving: `${sleutel} | Afschrijving ${a.naam}`,
          bedrag: -per,
          categorie: "afschrijving",
          grootboek: "WAfsAmvAmv",
          btwCode: "geen",
          btwBedrag: 0,
          soort: "afschrijving",
        },
      });
      aangemaakt++;
    }
  }
  return { aangemaakt };
}
