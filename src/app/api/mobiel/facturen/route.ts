import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mobielContext, route } from "@/lib/mobiel";

/** Facturen, nieuwste eerst. */
export const GET = route(async (req: Request) => {
  const { onderneming: o } = await mobielContext(req);
  const facturen = await db.factuur.findMany({ where: { ondernemingId: o.id }, orderBy: { datum: "desc" }, take: 200, include: { klant: { select: { naam: true } } } });
  return NextResponse.json({
    facturen: facturen.map((f) => ({
      id: f.id, nummer: f.nummer, soort: f.soort, klant: f.klant.naam, datum: f.datum.toISOString(), vervaldatum: f.vervaldatum.toISOString(),
      totaal: f.totaal, betaaldBedrag: f.betaaldBedrag, status: f.status,
    })),
  });
});
