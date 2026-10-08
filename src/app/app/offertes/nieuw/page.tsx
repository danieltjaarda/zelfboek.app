import { db, huidigeOnderneming } from "@/lib/db";
import { offerteOpslaan } from "@/lib/acties-facturen";
import { parseRegels } from "@/lib/facturen/bereken";
import { FactuurFormulier } from "@/components/FactuurFormulier";
import { Kop } from "@/components/ui";

export const instant = false;

export default async function NieuweOfferte({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const o = await huidigeOnderneming();
  const [klanten, producten, bestaand] = await Promise.all([
    db.klant.findMany({ where: { ondernemingId: o.id }, orderBy: { naam: "asc" } }),
    db.product.findMany({ where: { ondernemingId: o.id }, orderBy: { naam: "asc" } }),
    id ? db.offerte.findFirst({ where: { id, ondernemingId: o.id, status: "concept" } }) : null,
  ]);
  return (
    <>
      <Kop titel={bestaand ? `Offerte ${bestaand.nummer} bewerken` : "Nieuwe offerte"} sub="De klant krijgt een link om online te accepteren." />
      <FactuurFormulier
        soort="offerte"
        actie={offerteOpslaan}
        klanten={klanten}
        producten={producten}
        korDeelnemer={o.korDeelnemer}
        standaardTermijn={30}
        terugNaar="/app/offertes"
        bestaand={bestaand ? { id: bestaand.id, klantId: bestaand.klantId, regels: parseRegels(bestaand.regels), opmerking: bestaand.opmerking, datum: bestaand.datum.toISOString().slice(0, 10) } : undefined}
      />
    </>
  );
}
