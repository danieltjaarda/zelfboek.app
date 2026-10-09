import { db } from "@/lib/db";
import { btwUitInclusief, periodeBereik, rond } from "@/lib/btw";
import { EU } from "@/lib/facturen/bereken";

const EU_BUITEN_NL = [...EU].filter((l) => l !== "NL");

export type IcpRegel = { land: string; btwNummer: string; naam: string; diensten: number; goederen: number };

/**
 * Opgaaf intracommunautaire prestaties: per EU-afnemer met btw-nummer de omzet (ex btw) aan diensten en goederen.
 * Bron: verzonden facturen met btwVerlegd en een EU-klant, aangevuld met bankregels categorie omzet_eu zonder factuur
 * (die komen op "onbekend" en moeten handmatig worden toegewezen).
 */
export async function icpOpgaaf(ondernemingId: string, tijdvak: string, jaar: number, periode: number) {
  const { start, eind } = periodeBereik(tijdvak, jaar, periode);
  const [facturen, losse] = await Promise.all([
    db.factuur.findMany({
      where: { ondernemingId, datum: { gte: start, lt: eind }, btwVerlegd: true, status: { not: "concept" }, klant: { land: { in: EU_BUITEN_NL } } },
      include: { klant: true },
    }),
    db.transactie.findMany({
      where: { ondernemingId, datum: { gte: start, lt: eind }, zakelijk: true, factuurId: null, bedrag: { gt: 0 }, OR: [{ categorie: "omzet_eu" }, { btwCode: { in: ["eu_dienst", "eu_goed"] } }] },
    }),
  ]);
  const per = new Map<string, IcpRegel>();
  for (const f of facturen) {
    const nr = (f.klant.btwNummer ?? "").replace(/[\s.-]/g, "").toUpperCase();
    if (!nr) continue;
    const sleutel = nr;
    const r = per.get(sleutel) ?? { land: nr.slice(0, 2), btwNummer: nr, naam: f.klant.naam, diensten: 0, goederen: 0 };
    const regels = JSON.parse(f.regels) as { omschrijving?: string; eenheid?: string }[];
    const goed = regels.some((x) => /stuk|product|artikel/i.test(x.eenheid ?? "") || /levering|product/i.test(x.omschrijving ?? ""));
    if (goed) r.goederen += f.subtotaal; else r.diensten += f.subtotaal;
    per.set(sleutel, r);
  }
  let onbekend = 0;
  for (const t of losse) onbekend += t.bedrag - (t.btwBedrag ?? btwUitInclusief(t.bedrag, t.btwCode));
  const regels = [...per.values()].map((r) => ({ ...r, diensten: rond(r.diensten), goederen: rond(r.goederen) }));
  return {
    periode: { start, eind },
    regels,
    totaal: rond(regels.reduce((s, r) => s + r.diensten + r.goederen, 0)),
    onbekend: rond(onbekend),
  };
}

export function icpCsv(r: Awaited<ReturnType<typeof icpOpgaaf>>): string {
  const regels = ["Landcode;Btw-identificatienummer;Naam;Leveringen;Diensten"];
  for (const x of r.regels) regels.push([x.land, x.btwNummer.slice(2), x.naam.replace(/;/g, ","), x.goederen.toFixed(0), x.diensten.toFixed(0)].join(";"));
  return regels.join("\n");
}
