import { bewaarKanaalRegels, haalJson, kanaalConfig, voerKanaalUit, type KanaalRegel, type KanaalUitkomst } from "./basis";

/**
 * Mollie: uitbetalingen (settlements) als omzet, de ingehouden kosten als betaalprovider (btw 21).
 * Config: { apiKey: "live_..." }. Settlements vereisen een Organization access token of live-sleutel met settlements-recht.
 */
type Settlement = { id: string; reference: string; settledAt?: string; createdAt: string; amount: { value: string }; status: string; periods?: Record<string, Record<string, { costs?: { amountNet: { value: string }; amountVat?: { value: string }; amountGross: { value: string }; description: string }[]; revenue?: { amountGross: { value: string }; description: string }[] }>> };

export async function haalTransacties(ondernemingId: string, vanaf: Date): Promise<KanaalUitkomst> {
  return voerKanaalUit(ondernemingId, "mollie", async () => {
    const cfg = await kanaalConfig<{ apiKey: string }>(ondernemingId, "mollie", ["apiKey"], "Mollie");
    const headers = { Authorization: `Bearer ${cfg.apiKey}` };
    const regels: KanaalRegel[] = [];
    let url: string | null = "https://api.mollie.com/v2/settlements?limit=50";
    while (url) {
      const r: { _embedded?: { settlements: Settlement[] }; _links?: { next?: { href: string } | null } } = await haalJson(url, { headers }, "Mollie");
      for (const s of r._embedded?.settlements ?? []) {
        if (s.status !== "paidout") continue;
        const d = new Date(s.settledAt ?? s.createdAt);
        if (d < vanaf) { url = null; break; }
        let kosten = 0;
        for (const jaar of Object.values(s.periods ?? {})) for (const maand of Object.values(jaar)) for (const c of maand.costs ?? []) kosten += parseFloat(c.amountGross.value);
        const netto = parseFloat(s.amount.value);
        regels.push({ datum: d, bedrag: netto + kosten, tegenpartij: "Mollie", omschrijving: `Uitbetaling ${s.reference}`, externId: s.id, categorie: "omzet", btwCode: "21" });
        if (kosten > 0) regels.push({ datum: d, bedrag: -kosten, tegenpartij: "Mollie", omschrijving: `Transactiekosten ${s.reference}`, externId: `${s.id}-kosten`, categorie: "betaalprovider", btwCode: "21" });
      }
      url = url ? (r._links?.next?.href ?? null) : null;
    }
    return bewaarKanaalRegels(ondernemingId, "mollie", regels);
  });
}

/** Betaling ophalen (voor de webhook). */
export async function haalBetaling(apiKey: string, paymentId: string) {
  return haalJson<{ id: string; status: string; amount: { value: string }; metadata?: { factuurId?: string } | null; paidAt?: string }>(
    `https://api.mollie.com/v2/payments/${paymentId}`, { headers: { Authorization: `Bearer ${apiKey}` } }, "Mollie",
  );
}
