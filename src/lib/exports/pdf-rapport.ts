import { MERK } from "@/lib/merk";
import PDFDocument from "pdfkit";
import { datumNl, euro, type Aangifte } from "@/lib/btw";
import type { Jaarrekening } from "@/lib/fiscaal/jaarrekening";

function maakDoc() {
  const doc = new PDFDocument({ size: "A4", margin: 50, info: { Producer: MERK } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const klaar = new Promise<Buffer>((res) => doc.on("end", () => res(Buffer.concat(chunks))));
  return { doc, klaar };
}

function kop(doc: PDFKit.PDFDocument, naam: string, titel: string, sub: string) {
  doc.fontSize(10).fillColor("#78716c").text(naam);
  doc.moveDown(0.3).fontSize(20).fillColor("#1c1917").text(titel);
  doc.fontSize(10).fillColor("#78716c").text(sub).moveDown(1);
  doc.fillColor("#1c1917");
}

function tabel(doc: PDFKit.PDFDocument, rijen: [string, string][], opties?: { vet?: Set<number> }) {
  const links = doc.x;
  const breed = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  rijen.forEach(([a, b], i) => {
    if (doc.y > doc.page.height - 80) doc.addPage();
    const vet = opties?.vet?.has(i);
    doc.font(vet ? "Helvetica-Bold" : "Helvetica").fontSize(10);
    const y = doc.y;
    doc.text(a, links, y, { width: breed - 110 });
    doc.text(b, links + breed - 100, y, { width: 100, align: "right" });
    doc.moveDown(0.2);
    if (vet) doc.moveTo(links, doc.y).lineTo(links + breed, doc.y).strokeColor("#e7e5e4").stroke();
  });
  doc.font("Helvetica");
}

export async function jaarrekeningPdf(o: { naam: string; kvk?: string | null }, jr: Jaarrekening): Promise<Buffer> {
  const { doc, klaar } = maakDoc();
  kop(doc, o.naam, `Jaarrekening ${jr.jaar}`, `Eenmanszaak${o.kvk ? ` · KvK ${o.kvk}` : ""} · samengesteld door ${MERK} op ${datumNl(new Date())}`);

  doc.fontSize(14).text("Winst-en-verliesrekening").moveDown(0.5);
  const wv: [string, string][] = [];
  wv.push(["Omzet", ""]);
  for (const r of jr.wv.omzetRegels) wv.push([`   ${r.label}`, euro(r.bruto)]);
  wv.push(["Totaal omzet", euro(jr.wv.omzet)]);
  wv.push(["Kosten", ""]);
  for (const r of jr.wv.kostenRegels) wv.push([`   ${r.label}`, euro(r.bruto)]);
  wv.push(["Totaal kosten", euro(jr.wv.kosten)]);
  wv.push(["Resultaat", euro(jr.wv.winst)]);
  tabel(doc, wv, { vet: new Set([jr.wv.omzetRegels.length + 1, wv.length - 2, wv.length - 1]) });

  doc.moveDown(1.5).fontSize(14).text(`Balans per 31 december ${jr.jaar}`).moveDown(0.5);
  const bal: [string, string][] = [["Activa", ""]];
  for (const p of jr.activa) bal.push([`   ${p.label}`, euro(p.bedrag)]);
  bal.push(["Totaal activa", euro(jr.totaalActiva)]);
  bal.push(["Passiva", ""]);
  for (const p of jr.passiva) bal.push([`   ${p.label}`, euro(p.bedrag)]);
  bal.push(["Totaal passiva", euro(jr.totaalPassiva)]);
  tabel(doc, bal, { vet: new Set([jr.activa.length + 1, bal.length - 1]) });

  doc.moveDown(1.5).fontSize(14).text("Kengetallen").moveDown(0.5);
  tabel(doc, jr.kengetallen.map((k) => [k.label, k.waarde] as [string, string]));

  doc.moveDown(2).fontSize(8).fillColor("#78716c").text(
    "Deze jaarrekening is automatisch samengesteld uit de bankmutaties, facturen, bonnen en memoriaalboekingen in " + MERK + ". " +
    "Er is geen accountantscontrole of samenstellingsverklaring op van toepassing. De beginbalans is niet opgenomen als die niet is ingevoerd.",
  );
  doc.end();
  return klaar;
}

export async function btwOverzichtPdf(o: { naam: string; btwId?: string | null; btwNummer?: string | null }, i: { jaar: number; tijdvak: string; periode: number; aangifte: Aangifte; deadline: Date }): Promise<Buffer> {
  const { doc, klaar } = maakDoc();
  const label = i.tijdvak === "maand" ? `maand ${i.periode}` : i.tijdvak === "jaar" ? "jaar" : `${i.periode}e kwartaal`;
  kop(doc, o.naam, `Btw-aangifte ${label} ${i.jaar}`, `Btw-id ${o.btwId ?? o.btwNummer ?? "–"} · indienen en betalen vóór ${datumNl(i.deadline)}`);
  const a = i.aangifte;
  const r: [string, string][] = [
    ["1a Leveringen/diensten hoog tarief", `${euro(a["1a_omzet"])}  /  btw ${euro(a["1a_btw"])}`],
    ["1b Leveringen/diensten laag tarief", `${euro(a["1b_omzet"])}  /  btw ${euro(a["1b_btw"])}`],
    ["1c Overige tarieven", `${euro(a["1c_omzet"])}  /  btw ${euro(a["1c_btw"])}`],
    ["1e 0% of niet bij u belast", euro(a["1e_omzet"])],
    ["2a Verlegd naar u (binnenland)", `${euro(a["2a_omzet"])}  /  btw ${euro(a["2a_btw"])}`],
    ["3a Leveringen naar buiten de EU", euro(a["3a_omzet"])],
    ["3b Leveringen naar/diensten in de EU", euro(a["3b_omzet"])],
    ["4a Van buiten de EU", `${euro(a["4a_omzet"])}  /  btw ${euro(a["4a_btw"])}`],
    ["4b Van binnen de EU", `${euro(a["4b_omzet"])}  /  btw ${euro(a["4b_btw"])}`],
    ["5a Verschuldigde omzetbelasting", euro(a["5a_verschuldigd"])],
    ["5b Voorbelasting", euro(a["5b_voorbelasting"])],
    [a["5c_te_betalen"] >= 0 ? "5c Te betalen" : "5c Terug te vragen", euro(Math.abs(a["5c_te_betalen"]))],
  ];
  tabel(doc, r, { vet: new Set([9, 11]) });
  doc.moveDown(2).fontSize(8).fillColor("#78716c").text("Neem de bedragen afgerond op hele euro's over in Mijn Belastingdienst Zakelijk, of dien het SBR-bestand in via Digipoort.");
  doc.end();
  return klaar;
}
