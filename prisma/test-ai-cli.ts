// Lokale test: AI via de Claude Code-CLI (zonder ANTHROPIC_API_KEY). Maakt een bon-PDF en laat die uitlezen.
import PDFDocument from "pdfkit";
import { beoordeelTransacties, leesBon } from "../src/lib/ai";

async function bonPdf(): Promise<Buffer> {
  return new Promise((resolve) => {
    const pdf = new PDFDocument({ size: "A5" });
    const delen: Buffer[] = [];
    pdf.on("data", (d) => delen.push(d));
    pdf.on("end", () => resolve(Buffer.concat(delen)));
    pdf.fontSize(16).text("Coolblue B.V.").fontSize(10).text("Weena 664, Rotterdam").text("Btw-nr NL852044301B01").moveDown();
    pdf.text("Factuur F2026-10-0042").text("Datum: 03-10-2026").moveDown();
    pdf.text("1x Logitech MX Keys toetsenbord   99,17").text("1x Monitorarm Ergotron         123,97").moveDown();
    pdf.text("Subtotaal excl. btw   223,14").text("Btw 21%                46,86").fontSize(12).text("Totaal              270,00");
    pdf.end();
  });
}

async function main() {
  const t0 = Date.now();
  const b = await beoordeelTransacties(
    [
      { id: "a", datum: "2026-10-03", bedrag: -270, tegenpartij: "Coolblue", omschrijving: "Bestelling 123456" },
      { id: "b", datum: "2026-10-02", bedrag: 1210, tegenpartij: "Bakkerij De Korst", omschrijving: "Factuur 2026-0007" },
      { id: "c", datum: "2026-10-01", bedrag: -14.99, tegenpartij: "Netflix", omschrijving: "Abonnement" },
    ],
    { naam: "Studio Noord", branche: "ontwerpstudio" },
  );
  console.log("beoordeling", JSON.stringify(b, null, 1), `(${Math.round((Date.now() - t0) / 1000)}s)`);
  const t1 = Date.now();
  const u = await leesBon(await bonPdf(), "application/pdf");
  console.log("bon", JSON.stringify(u, null, 1), `(${Math.round((Date.now() - t1) / 1000)}s)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
