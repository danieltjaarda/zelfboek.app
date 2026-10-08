import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

async function ondernemingVan(stripe: Stripe, klantId: string | null, meta?: Record<string, string>) {
  if (meta?.ondernemingId) return db.onderneming.findUnique({ where: { id: meta.ondernemingId } });
  if (!klantId) return null;
  return db.onderneming.findFirst({ where: { stripeKlantId: klantId } });
}

export async function POST(req: Request) {
  const sleutel = process.env.STRIPE_SECRET_KEY;
  const geheim = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sleutel || !geheim) return NextResponse.json({ fout: "Stripe niet ingesteld" }, { status: 500 });

  const stripe = new Stripe(sleutel);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", geheim);
  } catch {
    return NextResponse.json({ fout: "Ongeldige handtekening" }, { status: 400 });
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const o = await ondernemingVan(stripe, typeof sub.customer === "string" ? sub.customer : sub.customer.id, sub.metadata);
    if (o) {
      const abonnement = event.type === "customer.subscription.deleted" || sub.status === "canceled" || sub.status === "unpaid" ? "gestopt"
        : sub.status === "past_due" ? "achterstallig"
        : ["active", "trialing"].includes(sub.status) ? "actief" : o.abonnement;
      await db.onderneming.update({ where: { id: o.id }, data: { abonnement, stripeAbonnementId: event.type === "customer.subscription.deleted" ? null : sub.id } });
    }
  } else if (event.type === "invoice.payment_failed") {
    const inv = event.data.object as Stripe.Invoice;
    const o = await ondernemingVan(stripe, typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null);
    if (o && o.abonnement === "actief") {
      await db.onderneming.update({ where: { id: o.id }, data: { abonnement: "achterstallig" } });
      await db.melding.create({ data: { ondernemingId: o.id, soort: "systeem", titel: "Betaling van je abonnement is mislukt", tekst: "Werk je betaalgegevens bij via Instellingen, Abonnement. Anders stopt het abonnement na enkele pogingen.", link: "/app/instellingen?tab=abonnement" } });
    }
  } else if (event.type === "invoice.paid") {
    const inv = event.data.object as Stripe.Invoice;
    const o = await ondernemingVan(stripe, typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null);
    if (o && o.abonnement !== "actief") await db.onderneming.update({ where: { id: o.id }, data: { abonnement: "actief" } });
  }
  return NextResponse.json({ ontvangen: true });
}
