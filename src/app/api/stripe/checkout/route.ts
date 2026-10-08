import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db, huidigeOnderneming } from "@/lib/db";
import { huidigeSessie } from "@/lib/auth";

export async function POST(req: Request) {
  const basis = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!(await huidigeSessie())) return NextResponse.redirect(`${basis}/login`, 303);
  const sleutel = process.env.STRIPE_SECRET_KEY;
  const prijs = process.env.STRIPE_PRICE_ID;
  if (!sleutel || !prijs) return NextResponse.redirect(`${basis}/app/instellingen?tab=abonnement&stripe=niet-ingesteld`, 303);

  const stripe = new Stripe(sleutel);
  const o = await huidigeOnderneming();
  const portaal = new URL(req.url).searchParams.get("portaal") === "1";

  let klantId = o.stripeKlantId;
  if (!klantId) {
    const klant = await stripe.customers.create({ name: o.naam, email: o.email ?? undefined, metadata: { ondernemingId: o.id } });
    klantId = klant.id;
    await db.onderneming.update({ where: { id: o.id }, data: { stripeKlantId: klantId } });
  }

  if (portaal) {
    const sessie = await stripe.billingPortal.sessions.create({ customer: klantId, return_url: `${basis}/app/instellingen?tab=abonnement` });
    return NextResponse.redirect(sessie.url, 303);
  }

  const proefDagen = o.proefTot ? Math.max(0, Math.ceil((o.proefTot.getTime() - Date.now()) / 864e5)) : 0;
  const sessie = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: klantId,
    line_items: [{ price: prijs, quantity: 1 }],
    subscription_data: { ...(proefDagen > 0 ? { trial_period_days: proefDagen } : {}), metadata: { ondernemingId: o.id } },
    success_url: `${basis}/app/instellingen?tab=abonnement&stripe=gelukt`,
    cancel_url: `${basis}/app/instellingen?tab=abonnement&stripe=geannuleerd`,
    locale: "nl",
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: false },
  });
  return NextResponse.redirect(sessie.url!, 303);
}
