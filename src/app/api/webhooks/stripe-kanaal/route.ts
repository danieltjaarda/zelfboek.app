import { MERK } from "@/lib/merk";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { leesKoppeling } from "@/lib/koppelingen";
import { haalTransacties } from "@/lib/kanalen/stripe";

/**
 * Stripe-webhook voor het verkoopkanaal (niet het abonnement van Zelfboek zelf).
 * Bij payout.paid halen we de uitbetaling direct op. Handtekening: STRIPE_KANAAL_WEBHOOK_SECRET
 * of het veld webhookSecret in de Stripe-koppeling. URL: /api/webhooks/stripe-kanaal?o=<ondernemingId>
 */
export async function POST(req: Request) {
  const ondernemingId = new URL(req.url).searchParams.get("o");
  if (!ondernemingId) return NextResponse.json({ fout: "Parameter o ontbreekt" }, { status: 400 });
  const cfg = await leesKoppeling<{ secretKey: string; webhookSecret?: string }>(ondernemingId, "stripe");
  if (!cfg?.secretKey) return NextResponse.json({ fout: "Geen Stripe-koppeling" }, { status: 404 });
  const geheim = cfg.webhookSecret || process.env.STRIPE_KANAAL_WEBHOOK_SECRET;
  const body = await req.text();

  let event: Stripe.Event;
  if (geheim) {
    try {
      event = new Stripe(cfg.secretKey).webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", geheim);
    } catch {
      return NextResponse.json({ fout: "Ongeldige handtekening" }, { status: 400 });
    }
  } else {
    // Zonder geheim vertrouwen we het event niet: we halen zelf op bij Stripe, de payload wordt alleen als trigger gebruikt.
    try { event = JSON.parse(body) as Stripe.Event; } catch { return NextResponse.json({ fout: "Geen JSON" }, { status: 400 }); }
  }

  if (event.type === "payout.paid" || event.type === "payout.updated") {
    const r = await haalTransacties(ondernemingId, new Date(Date.now() - 14 * 864e5));
    if (r.nieuw > 0) {
      await db.melding.create({ data: { ondernemingId, soort: "sync", titel: "Stripe-uitbetaling geboekt", tekst: `${r.nieuw} nieuwe regels uit Stripe.`, link: "/app/bank" } });
    }
    return NextResponse.json({ ontvangen: true, nieuw: r.nieuw, fouten: r.fouten });
  }
  return NextResponse.json({ ontvangen: true });
}
