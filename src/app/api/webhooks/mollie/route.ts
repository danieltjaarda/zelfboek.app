import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leesKoppeling } from "@/lib/koppelingen";
import { haalBetaling } from "@/lib/kanalen/mollie";

/**
 * Mollie-webhook voor betaallinks van facturen. Mollie stuurt alleen een id; wij halen de betaling op
 * en markeren de factuur betaald als metadata.factuurId klopt. URL: /api/webhooks/mollie?o=<ondernemingId>
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const ondernemingId = url.searchParams.get("o");
  const form = await req.formData().catch(() => null);
  const paymentId = String(form?.get("id") ?? "");
  if (!paymentId) return NextResponse.json({ fout: "Geen id" }, { status: 400 });

  // Factuur zoeken op betaalLinkId (werkt ook zonder ?o=)
  const factuur = await db.factuur.findFirst({ where: { betaalLinkId: paymentId, ...(ondernemingId ? { ondernemingId } : {}) } });
  const oId = factuur?.ondernemingId ?? ondernemingId;
  if (!oId) return NextResponse.json({ ontvangen: true, genegeerd: "onbekende onderneming" });

  const cfg = await leesKoppeling<{ apiKey: string }>(oId, "mollie");
  if (!cfg?.apiKey) return NextResponse.json({ ontvangen: true, genegeerd: "geen Mollie-sleutel" });

  let betaling: Awaited<ReturnType<typeof haalBetaling>>;
  try { betaling = await haalBetaling(cfg.apiKey, paymentId); } catch { return NextResponse.json({ ontvangen: true, genegeerd: "betaling niet opvraagbaar" }); }

  const factuurId = factuur?.id ?? betaling.metadata?.factuurId;
  if (!factuurId) return NextResponse.json({ ontvangen: true });
  const f = await db.factuur.findFirst({ where: { id: factuurId, ondernemingId: oId } });
  if (!f) return NextResponse.json({ ontvangen: true });

  if (betaling.status === "paid" && f.status !== "betaald") {
    const bedrag = parseFloat(betaling.amount.value);
    await db.factuur.update({ where: { id: f.id }, data: { status: "betaald", betaaldOp: betaling.paidAt ? new Date(betaling.paidAt) : new Date(), betaaldBedrag: bedrag, betaalLinkId: paymentId } });
    await db.melding.create({ data: { ondernemingId: oId, soort: "systeem", titel: `Factuur ${f.nummer} betaald via iDEAL`, tekst: `${bedrag.toFixed(2)} euro ontvangen via Mollie.`, link: `/app/facturen/${f.id}` } });
  } else if (["failed", "canceled", "expired"].includes(betaling.status) && f.betaalLinkId === paymentId && f.status !== "betaald") {
    await db.factuur.update({ where: { id: f.id }, data: { betaalLinkUrl: null, betaalLinkId: null } });
  }
  return NextResponse.json({ ontvangen: true });
}
