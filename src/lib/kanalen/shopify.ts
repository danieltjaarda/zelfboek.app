import { bewaarKanaalRegels, haalJson, kanaalConfig, voerKanaalUit, isoDag, type KanaalRegel, type KanaalUitkomst } from "./basis";

/**
 * Shopify Payments: uitbetalingen (payouts) als omzet, de bijbehorende kosten als betaalprovider.
 * Config: { shop: "mijnwinkel.myshopify.com", accessToken: "shpat_..." } (Admin API, scope read_shopify_payments_payouts).
 */
const VERSIE = "2025-07";

export async function haalTransacties(ondernemingId: string, vanaf: Date): Promise<KanaalUitkomst> {
  return voerKanaalUit(ondernemingId, "shopify", async () => {
    const cfg = await kanaalConfig<{ shop: string; accessToken: string }>(ondernemingId, "shopify", ["shop", "accessToken"], "Shopify");
    const shop = cfg.shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const headers = { "X-Shopify-Access-Token": cfg.accessToken, "Content-Type": "application/json" };
    const basis = `https://${shop}/admin/api/${VERSIE}/shopify_payments`;
    const regels: KanaalRegel[] = [];

    const payouts = await haalJson<{ payouts: { id: number; date: string; status: string; amount: string; currency: string }[] }>(
      `${basis}/payouts.json?status=paid&date_min=${isoDag(vanaf)}&limit=250`, { headers }, "Shopify",
    );
    for (const p of payouts.payouts) {
      const d = new Date(p.date);
      const bal = await haalJson<{ transactions: { id: number; type: string; amount: string; fee: string; net: string }[] }>(
        `${basis}/balance/transactions.json?payout_id=${p.id}&limit=250`, { headers }, "Shopify",
      );
      let bruto = 0;
      let kosten = 0;
      for (const t of bal.transactions) {
        if (t.type === "payout") continue;
        bruto += parseFloat(t.amount);
        kosten += parseFloat(t.fee);
      }
      if (bruto === 0) bruto = parseFloat(p.amount);
      regels.push({ datum: d, bedrag: bruto, tegenpartij: "Shopify Payments", omschrijving: `Uitbetaling ${p.id}`, externId: String(p.id), categorie: "omzet", btwCode: "21" });
      if (kosten > 0) regels.push({ datum: d, bedrag: -kosten, tegenpartij: "Shopify International", omschrijving: `Kosten uitbetaling ${p.id}`, externId: `${p.id}-fee`, categorie: "betaalprovider", btwCode: "eu_dienst" });
    }
    return bewaarKanaalRegels(ondernemingId, "shopify", regels);
  });
}
