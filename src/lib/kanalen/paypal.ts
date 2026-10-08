import Papa from "papaparse";
import { bewaarKanaalRegels, haalJson, kanaalConfig, voerKanaalUit, type KanaalRegel, type KanaalUitkomst } from "./basis";
import { datum, getal } from "@/lib/bank/csv";

/**
 * PayPal: ontvangen betalingen als omzet, PayPal-kosten als betaalprovider (PayPal Europe, Luxemburg: eu_dienst).
 * Via de REST API (config { clientId, clientSecret }) of via het CSV-activiteitenrapport (importeerPaypalCsv).
 */
async function token(clientId: string, clientSecret: string) {
  const r = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error("PayPal: client-id of secret ongeldig.");
  return ((await r.json()) as { access_token: string }).access_token;
}

type PpTx = { transaction_info: { transaction_id: string; transaction_initiation_date: string; transaction_amount: { value: string }; fee_amount?: { value: string }; transaction_event_code: string; transaction_status: string; transaction_subject?: string; transaction_note?: string }; payer_info?: { payer_name?: { alternate_full_name?: string }; email_address?: string } };

export async function haalTransacties(ondernemingId: string, vanaf: Date): Promise<KanaalUitkomst> {
  return voerKanaalUit(ondernemingId, "paypal", async () => {
    const cfg = await kanaalConfig<{ clientId: string; clientSecret: string }>(ondernemingId, "paypal", ["clientId", "clientSecret"], "PayPal");
    const t = await token(cfg.clientId, cfg.clientSecret);
    const regels: KanaalRegel[] = [];
    // De API staat maximaal 31 dagen per verzoek toe
    let start = new Date(vanaf);
    const nu = new Date();
    while (start < nu) {
      const eind = new Date(Math.min(start.getTime() + 30 * 864e5, nu.getTime()));
      for (let page = 1; page < 50; page++) {
        const r = await haalJson<{ transaction_details: PpTx[]; total_pages: number }>(
          `https://api-m.paypal.com/v1/reporting/transactions?start_date=${start.toISOString()}&end_date=${eind.toISOString()}&fields=transaction_info,payer_info&page_size=500&page=${page}`,
          { headers: { Authorization: `Bearer ${t}` } }, "PayPal",
        );
        for (const x of r.transaction_details) regels.push(...naarRegels(x));
        if (page >= (r.total_pages ?? 1)) break;
      }
      start = new Date(eind.getTime() + 1000);
    }
    return bewaarKanaalRegels(ondernemingId, "paypal", regels);
  });
}

function naarRegels(x: PpTx): KanaalRegel[] {
  const i = x.transaction_info;
  if (i.transaction_status !== "S") return [];
  const bedrag = parseFloat(i.transaction_amount.value);
  const fee = Math.abs(parseFloat(i.fee_amount?.value ?? "0"));
  if (!bedrag || /^T03|^T04|^T05|^T06|^T07/.test(i.transaction_event_code)) return []; // overboekingen naar bank en interne verplaatsingen overslaan
  const naam = x.payer_info?.payer_name?.alternate_full_name || x.payer_info?.email_address || "PayPal";
  const d = new Date(i.transaction_initiation_date);
  const oms = i.transaction_subject || i.transaction_note || `PayPal ${i.transaction_id}`;
  const uit: KanaalRegel[] = [{ datum: d, bedrag, tegenpartij: naam, omschrijving: oms, externId: i.transaction_id, categorie: bedrag > 0 ? "omzet" : "klant_terugbetaling", btwCode: "21" }];
  if (fee > 0) uit.push({ datum: d, bedrag: -fee, tegenpartij: "PayPal (Europe)", omschrijving: `PayPal-kosten ${i.transaction_id}`, externId: `${i.transaction_id}-fee`, categorie: "betaalprovider", btwCode: "eu_dienst" });
  return uit;
}

/** CSV-activiteitenrapport van PayPal (Rapporten → Activiteiten downloaden, alle kolommen). */
export async function importeerPaypalCsv(ondernemingId: string, tekst: string): Promise<KanaalUitkomst> {
  const { data } = Papa.parse<Record<string, string>>(tekst.replace(/^﻿/, ""), { header: true, skipEmptyLines: true });
  const regels: KanaalRegel[] = [];
  for (const r of data) {
    const k = (re: RegExp) => { const key = Object.keys(r).find((x) => re.test(x.trim())); return key ? (r[key] ?? "").trim() : ""; };
    const status = k(/^Status$/i);
    if (status && !/^(Completed|Voltooid)$/i.test(status)) continue;
    const bruto = getal(k(/^(Gross|Bruto)$/i));
    const fee = Math.abs(getal(k(/^(Fee|Kosten)$/i)));
    const id = k(/^(Transaction ID|Transactiereferentie)$/i);
    const type = k(/^(Type)$/i);
    if (!bruto || !id || /overboeking|withdrawal|bank|opname/i.test(type)) continue;
    const d = datum(k(/^(Date|Datum)$/i));
    const naam = k(/^(Name|Naam)$/i) || k(/^(From Email Address|E-mailadres afzender)$/i) || "PayPal";
    const oms = k(/^(Item Title|Artikelnaam|Subject|Onderwerp)$/i) || `${type} ${id}`;
    regels.push({ datum: d, bedrag: bruto, tegenpartij: naam, omschrijving: oms, externId: id, categorie: bruto > 0 ? "omzet" : "klant_terugbetaling", btwCode: "21" });
    if (fee > 0) regels.push({ datum: d, bedrag: -fee, tegenpartij: "PayPal (Europe)", omschrijving: `PayPal-kosten ${id}`, externId: `${id}-fee`, categorie: "betaalprovider", btwCode: "eu_dienst" });
  }
  if (regels.length === 0) return { nieuw: 0, fouten: ["Geen PayPal-regels herkend. Gebruik het activiteitenrapport (CSV, alle kolommen)."] };
  return { nieuw: await bewaarKanaalRegels(ondernemingId, "paypal", regels), fouten: [] };
}
