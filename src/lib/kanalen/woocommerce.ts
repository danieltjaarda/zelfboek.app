import { bewaarKanaalRegels, haalJson, kanaalConfig, voerKanaalUit, type KanaalRegel, type KanaalUitkomst } from "./basis";

/**
 * WooCommerce REST API v3: afgeronde bestellingen als omzet (per bestelling, betaalmethode in de omschrijving).
 * Config: { url: "https://winkel.nl", consumerKey: "ck_...", consumerSecret: "cs_..." }.
 * Let op: betaal je klanten via Mollie of Stripe, koppel dan dat kanaal en niet WooCommerce (anders dubbel).
 */
type Order = { id: number; status: string; date_paid_gmt?: string | null; date_completed_gmt?: string | null; date_created_gmt: string; total: string; total_tax: string; payment_method_title?: string; billing?: { first_name?: string; last_name?: string; company?: string; country?: string } };

export async function haalTransacties(ondernemingId: string, vanaf: Date): Promise<KanaalUitkomst> {
  return voerKanaalUit(ondernemingId, "woocommerce", async () => {
    const cfg = await kanaalConfig<{ url: string; consumerKey: string; consumerSecret: string }>(ondernemingId, "woocommerce", ["url", "consumerKey", "consumerSecret"], "WooCommerce");
    const basis = cfg.url.replace(/\/$/, "");
    const auth = `Basic ${Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString("base64")}`;
    const regels: KanaalRegel[] = [];
    for (let page = 1; page < 50; page++) {
      const orders = await haalJson<Order[]>(
        `${basis}/wp-json/wc/v3/orders?status=completed,processing&after=${vanaf.toISOString()}&per_page=100&page=${page}`,
        { headers: { Authorization: auth } }, "WooCommerce",
      );
      for (const o of orders) {
        const totaal = parseFloat(o.total);
        if (!totaal) continue;
        const btw = parseFloat(o.total_tax || "0");
        const klant = o.billing?.company || [o.billing?.first_name, o.billing?.last_name].filter(Boolean).join(" ") || "Klant";
        const buitenNl = o.billing?.country && o.billing.country !== "NL";
        regels.push({
          datum: new Date(o.date_paid_gmt ?? o.date_completed_gmt ?? o.date_created_gmt),
          bedrag: totaal,
          tegenpartij: klant,
          omschrijving: `Bestelling #${o.id} via ${o.payment_method_title ?? "webshop"}`,
          externId: String(o.id),
          categorie: "omzet",
          btwCode: btw === 0 ? (buitenNl ? "0" : "geen") : Math.abs(btw / (totaal - btw) - 0.09) < 0.005 ? "9" : "21",
        });
      }
      if (orders.length < 100) break;
    }
    return bewaarKanaalRegels(ondernemingId, "woocommerce", regels);
  });
}
