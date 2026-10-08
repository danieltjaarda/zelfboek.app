import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { Factuur, Klant, Onderneming } from "@prisma/client";
import { db } from "@/lib/db";
import { isoDatum } from "@/lib/btw";
import { berekenTotalen, parseRegels } from "./bereken";

const esc = (s: string | null | undefined) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const geld = (n: number) => n.toFixed(2);

function btwCategorie(tarief: number, verlegd: boolean, kor: boolean) {
  if (verlegd) return { id: "AE", reden: "VATEX-EU-AE", tekst: "Reverse charge" };
  if (kor) return { id: "E", reden: "VATEX-EU-O", tekst: "Exempt" };
  if (tarief === 0) return { id: "Z", reden: undefined, tekst: undefined };
  return { id: "S", reden: undefined, tekst: undefined };
}

function partij(tag: string, p: { naam: string; adres?: string | null; postcode?: string | null; plaats?: string | null; land?: string | null; kvk?: string | null; btw?: string | null; email?: string | null; contact?: string | null }) {
  const land = (p.land ?? "NL").toUpperCase();
  return `
  <cac:${tag}>
    <cac:Party>
      ${p.btw ? `<cbc:EndpointID schemeID="0106">${esc(p.kvk ?? p.btw)}</cbc:EndpointID>` : ""}
      ${p.kvk ? `<cac:PartyIdentification><cbc:ID schemeID="0106">${esc(p.kvk)}</cbc:ID></cac:PartyIdentification>` : ""}
      <cac:PartyName><cbc:Name>${esc(p.naam)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        ${p.adres ? `<cbc:StreetName>${esc(p.adres)}</cbc:StreetName>` : ""}
        ${p.plaats ? `<cbc:CityName>${esc(p.plaats)}</cbc:CityName>` : ""}
        ${p.postcode ? `<cbc:PostalZone>${esc(p.postcode)}</cbc:PostalZone>` : ""}
        <cac:Country><cbc:IdentificationCode>${esc(land)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${p.btw ? `<cac:PartyTaxScheme><cbc:CompanyID>${esc(p.btw)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(p.naam)}</cbc:RegistrationName>
        ${p.kvk ? `<cbc:CompanyID schemeID="0106">${esc(p.kvk)}</cbc:CompanyID>` : ""}
      </cac:PartyLegalEntity>
      ${p.contact || p.email ? `<cac:Contact>${p.contact ? `<cbc:Name>${esc(p.contact)}</cbc:Name>` : ""}${p.email ? `<cbc:ElectronicMail>${esc(p.email)}</cbc:ElectronicMail>` : ""}</cac:Contact>` : ""}
    </cac:Party>
  </cac:${tag}>`;
}

/** UBL 2.1 Invoice (Peppol BIS Billing 3.0 / NLCIUS). */
export function maakUbl(f: Factuur, klant: Klant, o: Onderneming): string {
  const regels = parseRegels(f.regels);
  const kor = o.korDeelnemer;
  const tot = berekenTotalen(regels, f.btwVerlegd ? { land: "DE", btwNummer: "x" } : klant, o);
  const credit = f.soort === "credit";
  const root = credit ? "CreditNote" : "Invoice";
  const ns = credit ? "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" : "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
  const typeCode = credit ? "381" : "380";
  const abs = (n: number) => Math.abs(n);
  const lijnTag = credit ? "CreditNoteLine" : "InvoiceLine";
  const hoevTag = credit ? "CreditedQuantity" : "InvoicedQuantity";

  const taxSubtotals = tot.perTarief
    .map((p) => {
      const cat = btwCategorie(p.tarief, f.btwVerlegd, kor);
      return `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${f.valuta}">${geld(abs(p.grondslag))}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${f.valuta}">${geld(abs(p.btw))}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${cat.id}</cbc:ID>
        <cbc:Percent>${cat.id === "S" ? p.tarief : 0}</cbc:Percent>
        ${cat.reden ? `<cbc:TaxExemptionReasonCode>${cat.reden}</cbc:TaxExemptionReasonCode><cbc:TaxExemptionReason>${cat.tekst}</cbc:TaxExemptionReason>` : ""}
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`;
    })
    .join("");

  const lijnen = regels
    .map((r, i) => {
      const tarief = f.btwVerlegd || kor ? 0 : r.btw;
      const cat = btwCategorie(tarief, f.btwVerlegd, kor);
      const bedrag = abs(r.aantal * r.prijs);
      return `
  <cac:${lijnTag}>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:${hoevTag} unitCode="${r.eenheid === "uur" ? "HUR" : r.eenheid === "dag" ? "DAY" : r.eenheid === "km" ? "KMT" : "C62"}">${abs(r.aantal)}</cbc:${hoevTag}>
    <cbc:LineExtensionAmount currencyID="${f.valuta}">${geld(bedrag)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(r.omschrijving.slice(0, 100))}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${cat.id}</cbc:ID>
        <cbc:Percent>${cat.id === "S" ? tarief : 0}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="${f.valuta}">${geld(abs(r.prijs))}</cbc:PriceAmount></cac:Price>
  </cac:${lijnTag}>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<${root} xmlns="${ns}"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0#conformant#urn:fdc:nen.nl:nlcius:v1.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${esc(f.nummer)}</cbc:ID>
  <cbc:IssueDate>${isoDatum(f.datum)}</cbc:IssueDate>
  ${credit ? "" : `<cbc:DueDate>${isoDatum(f.vervaldatum)}</cbc:DueDate>`}
  <cbc:${credit ? "CreditNoteTypeCode" : "InvoiceTypeCode"}>${typeCode}</cbc:${credit ? "CreditNoteTypeCode" : "InvoiceTypeCode"}>
  ${f.opmerking ? `<cbc:Note>${esc(f.opmerking)}</cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode>${f.valuta}</cbc:DocumentCurrencyCode>
  ${f.referentie ? `<cbc:BuyerReference>${esc(f.referentie)}</cbc:BuyerReference>` : `<cbc:BuyerReference>${esc(klant.naam)}</cbc:BuyerReference>`}
  ${partij("AccountingSupplierParty", { naam: o.naam, adres: o.adres, postcode: o.postcode, plaats: o.plaats, land: o.land, kvk: o.kvk, btw: o.btwId ?? o.btwNummer, email: o.email })}
  ${partij("AccountingCustomerParty", { naam: klant.naam, adres: klant.adres, postcode: klant.postcode, plaats: klant.plaats, land: klant.land, kvk: klant.kvk, btw: klant.btwNummer, email: klant.email, contact: klant.contactpersoon })}
  ${credit ? "" : `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cbc:PaymentID>${esc(f.nummer)}</cbc:PaymentID>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${esc((o.iban ?? "").replace(/\s/g, ""))}</cbc:ID>
      <cbc:Name>${esc(o.naam)}</cbc:Name>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>
  <cac:PaymentTerms><cbc:Note>Betaling binnen ${Math.max(0, Math.round((f.vervaldatum.getTime() - f.datum.getTime()) / 864e5))} dagen</cbc:Note></cac:PaymentTerms>`}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${f.valuta}">${geld(abs(tot.btw))}</cbc:TaxAmount>${taxSubtotals}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${f.valuta}">${geld(abs(tot.subtotaal))}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${f.valuta}">${geld(abs(tot.subtotaal))}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${f.valuta}">${geld(abs(tot.totaal))}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${f.valuta}">${geld(abs(tot.totaal))}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lijnen}
</${root}>
`;
}

export async function factuurUbl(factuur: Factuur & { klant: Klant; onderneming: Onderneming }): Promise<string> {
  const xml = maakUbl(factuur, factuur.klant, factuur.onderneming);
  const dir = path.join(process.cwd(), "uploads", factuur.ondernemingId, "facturen");
  await mkdir(dir, { recursive: true });
  const pad = path.join(dir, `${factuur.nummer.replace(/[^\w-]/g, "_")}.xml`);
  await writeFile(pad, xml, "utf8");
  await db.factuur.update({ where: { id: factuur.id }, data: { ublPad: pad } });
  return xml;
}
