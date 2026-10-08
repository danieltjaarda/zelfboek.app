import { MERK } from "@/lib/merk";
import type { Aangifte } from "@/lib/btw";

const x = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * XBRL-instance voor de btw-aangifte (Nederlandse Taxonomie, rapport bd-rpt-ob-aangifte).
 * Concepten uit de bd-i (Belastingdienst) namespace, afgerond op hele euro's zoals de aangifte vereist.
 * Dit bestand kun je via een Digipoort-aansluiting (eigen PKIoverheid-certificaat of een hub-leverancier) indienen.
 * De NT-versie (hier NT20) moet overeenkomen met het aangiftejaar; pas `nt` aan als de Belastingdienst een nieuwe taxonomie publiceert.
 */
export function sbrBtwAangifte(i: {
  aangifte: Aangifte;
  btwId: string;        // NL123456789B01
  naam: string;
  jaar: number;
  tijdvak: "maand" | "kwartaal" | "jaar";
  periode: number;
  contact?: { naam: string; telefoon?: string };
  nt?: string;
}): string {
  const nt = i.nt ?? "20";
  const a = i.aangifte;
  const h = (n: number) => Math.round(n);
  let start: Date;
  let eind: Date;
  if (i.tijdvak === "maand") { start = new Date(i.jaar, i.periode - 1, 1); eind = new Date(i.jaar, i.periode, 0); }
  else if (i.tijdvak === "jaar") { start = new Date(i.jaar, 0, 1); eind = new Date(i.jaar, 11, 31); }
  else { start = new Date(i.jaar, (i.periode - 1) * 3, 1); eind = new Date(i.jaar, i.periode * 3, 0); }
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const identifier = i.btwId.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const ctx = "c1";

  const feiten: [string, number][] = [
    ["bd-i:ValueAddedTaxSuppliesServicesGeneralTariff", h(a["1a_btw"])],
    ["bd-i:TaxedTurnoverSuppliesServicesGeneralTariff", h(a["1a_omzet"])],
    ["bd-i:ValueAddedTaxSuppliesServicesReducedTariff", h(a["1b_btw"])],
    ["bd-i:TaxedTurnoverSuppliesServicesReducedTariff", h(a["1b_omzet"])],
    ["bd-i:ValueAddedTaxSuppliesServicesOtherRates", h(a["1c_btw"])],
    ["bd-i:TaxedTurnoverSuppliesServicesOtherRates", h(a["1c_omzet"])],
    ["bd-i:TaxedTurnoverSuppliesServicesPrivateUse", 0],
    ["bd-i:ValueAddedTaxPrivateUse", 0],
    ["bd-i:SuppliesServicesNotTaxed", h(a["1e_omzet"])],
    ["bd-i:TurnoverSuppliesServicesByWhichVATTaxationIsTransferred", h(a["2a_omzet"])],
    ["bd-i:ValueAddedTaxSuppliesServicesByWhichVATTaxationIsTransferred", h(a["2a_btw"])],
    ["bd-i:SuppliesToCountriesOutsideTheEC", h(a["3a_omzet"])],
    ["bd-i:SuppliesToCountriesWithinTheEC", h(a["3b_omzet"])],
    ["bd-i:InstallationDistanceSalesWithinTheEC", 0],
    ["bd-i:TurnoverFromTaxedSuppliesFromCountriesOutsideTheEC", h(a["4a_omzet"])],
    ["bd-i:ValueAddedTaxOnSuppliesFromCountriesOutsideTheEC", h(a["4a_btw"])],
    ["bd-i:TurnoverFromTaxedSuppliesFromCountriesWithinTheEC", h(a["4b_omzet"])],
    ["bd-i:ValueAddedTaxOnSuppliesFromCountriesWithinTheEC", h(a["4b_btw"])],
    ["bd-i:ValueAddedTaxOwed", h(a["5a_verschuldigd"])],
    ["bd-i:ValueAddedTaxOnInput", h(a["5b_voorbelasting"])],
    ["bd-i:ValueAddedTaxOwedToBePaidBack", h(a["5c_te_betalen"])],
  ];

  const out: string[] = [];
  out.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  out.push(`<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:link="http://www.xbrl.org/2003/linkbase" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:iso4217="http://www.xbrl.org/2003/iso4217" xmlns:bd-i="http://www.nltaxonomie.nl/nt${nt}/bd/${i.jaar}0101/dictionary/bd-data" xmlns:bd-t="http://www.nltaxonomie.nl/nt${nt}/bd/${i.jaar}0101/dictionary/bd-tuples" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`);
  out.push(`<link:schemaRef xlink:type="simple" xlink:href="http://www.nltaxonomie.nl/nt${nt}/bd/${i.jaar}0101/entrypoints/bd-rpt-ob-aangifte-${i.jaar}.xsd"/>`);
  out.push(`<xbrli:context id="${ctx}"><xbrli:entity><xbrli:identifier scheme="www.belastingdienst.nl/omzetbelastingnummer">${x(identifier)}</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:startDate>${iso(start)}</xbrli:startDate><xbrli:endDate>${iso(eind)}</xbrli:endDate></xbrli:period></xbrli:context>`);
  out.push(`<xbrli:unit id="EUR"><xbrli:measure>iso4217:EUR</xbrli:measure></xbrli:unit>`);
  out.push(`<bd-i:ContactInitials contextRef="${ctx}">${x((i.contact?.naam ?? i.naam).slice(0, 1).toUpperCase())}</bd-i:ContactInitials>`);
  out.push(`<bd-i:ContactSurname contextRef="${ctx}">${x((i.contact?.naam ?? i.naam).split(" ").slice(-1)[0])}</bd-i:ContactSurname>`);
  out.push(`<bd-i:ContactType contextRef="${ctx}">BPL</bd-i:ContactType>`);
  if (i.contact?.telefoon) out.push(`<bd-i:ContactTelephoneNumber contextRef="${ctx}">${x(i.contact.telefoon)}</bd-i:ContactTelephoneNumber>`);
  out.push(`<bd-i:DateTimeCreation contextRef="${ctx}">${new Date().toISOString().replace(/\.\d+Z$/, "").replace("T", "").replace(/[-:]/g, "").slice(0, 12)}</bd-i:DateTimeCreation>`);
  out.push(`<bd-i:MessageReferenceSupplierVAT contextRef="${ctx}">${x(`BB-${identifier}-${i.jaar}-${i.periode}`)}</bd-i:MessageReferenceSupplierVAT>`);
  out.push(`<bd-i:SoftwarePackageName contextRef="${ctx}">${MERK}</bd-i:SoftwarePackageName>`);
  out.push(`<bd-i:SoftwarePackageVersion contextRef="${ctx}">1.0</bd-i:SoftwarePackageVersion>`);
  out.push(`<bd-i:SoftwareVendorAccountNumber contextRef="${ctx}">SWO00000</bd-i:SoftwareVendorAccountNumber>`);
  for (const [concept, waarde] of feiten) {
    out.push(`<${concept} contextRef="${ctx}" unitRef="EUR" decimals="INF">${waarde}</${concept}>`);
  }
  out.push(`</xbrli:xbrl>`);
  return out.join("\n");
}
