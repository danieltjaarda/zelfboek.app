import { bewaarKanaalRegels, haalJson, kanaalConfig, voerKanaalUit, type KanaalRegel, type KanaalUitkomst } from "./basis";

/**
 * bol.com Retailer API: uitbetalingen per factuurspecificatie (invoices) als omzet, commissie als betaalprovider (btw 21).
 * Config: { clientId, clientSecret } van het bol.com partnerplatform.
 */
async function token(clientId: string, clientSecret: string) {
  const r = await fetch("https://login.bol.com/token?grant_type=client_credentials", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, Accept: "application/json" },
  });
  if (!r.ok) throw new Error("bol.com: client-id of client-secret ongeldig.");
  return ((await r.json()) as { access_token: string }).access_token;
}

type Invoice = { invoiceId: string; invoiceTimeStamp: string; invoiceType?: string; legalEntity?: { name?: string }; invoiceTotals?: { totalAmountExclVat?: number; totalAmountInclVat?: number; totalVatAmount?: number } };

export async function haalTransacties(ondernemingId: string, vanaf: Date): Promise<KanaalUitkomst> {
  return voerKanaalUit(ondernemingId, "bol", async () => {
    const cfg = await kanaalConfig<{ clientId: string; clientSecret: string }>(ondernemingId, "bol", ["clientId", "clientSecret"], "bol.com");
    const t = await token(cfg.clientId, cfg.clientSecret);
    const headers = { Authorization: `Bearer ${t}`, Accept: "application/vnd.retailer.v10+json" };
    const periodStart = vanaf.toISOString().slice(0, 10);
    const periodEnd = new Date().toISOString().slice(0, 10);
    const r = await haalJson<{ invoiceListItems?: Invoice[] }>(
      `https://api.bol.com/retailer/invoices?period-start-date=${periodStart}&period-end-date=${periodEnd}`, { headers }, "bol.com",
    );
    const regels: KanaalRegel[] = [];
    for (const inv of r.invoiceListItems ?? []) {
      const d = new Date(inv.invoiceTimeStamp);
      // Specificatie ophalen voor omzet versus commissie
      let omzet = 0;
      let commissie = 0;
      try {
        const spec = await haalJson<{ invoiceSpecification?: { transactionType?: string; amount?: number; vatAmount?: number; totalAmountInclVat?: number }[] }>(
          `https://api.bol.com/retailer/invoices/${inv.invoiceId}/specification`, { headers }, "bol.com",
        );
        for (const s of spec.invoiceSpecification ?? []) {
          const bedrag = s.totalAmountInclVat ?? (s.amount ?? 0) + (s.vatAmount ?? 0);
          if (/COMMISSION|FEE|COST/i.test(s.transactionType ?? "")) commissie += Math.abs(bedrag);
          else omzet += bedrag;
        }
      } catch {
        omzet = inv.invoiceTotals?.totalAmountInclVat ?? 0;
      }
      if (omzet) regels.push({ datum: d, bedrag: omzet, tegenpartij: "bol.com", omschrijving: `Uitbetaling specificatie ${inv.invoiceId}`, externId: inv.invoiceId, categorie: "omzet", btwCode: "21" });
      if (commissie) regels.push({ datum: d, bedrag: -commissie, tegenpartij: "bol.com", omschrijving: `Commissie ${inv.invoiceId}`, externId: `${inv.invoiceId}-commissie`, categorie: "betaalprovider", btwCode: "21" });
    }
    return bewaarKanaalRegels(ondernemingId, "bol", regels);
  });
}
