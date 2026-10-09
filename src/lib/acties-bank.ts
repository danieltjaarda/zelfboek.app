"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schrijfOnderneming } from "./db";
import { btwUitInclusief, rond } from "./btw";
import { parseBankbestand, importeerRegels, beoordeelOpenstaand as beoordeelOpen } from "./bank/importeer";
import { startAutorisatie } from "./bank/enablebanking";
import { syncAlleBanken, syncEenBron } from "./bank/sync";
import { bewaarKoppeling, verwijderKoppeling as verwijderK, type KoppelingSoort } from "./koppelingen";
import { importeerPaypalCsv } from "./kanalen/paypal";
import { importeerMoneybird } from "./import/moneybird";
import { importeerEboekhouden } from "./import/eboekhouden";
import { importeerJorttCsv } from "./import/jortt";
import { importeerExcel } from "./import/excel";
import { maakHash } from "./bank/csv";

export type Resultaat = { ok: true; melding: string } | { ok: false; fout: string };

const fout = (e: unknown): Resultaat => ({ ok: false, fout: e instanceof Error ? e.message : String(e) });
const ververs = () => { revalidatePath("/app"); revalidatePath("/app/bank"); revalidatePath("/app/koppelingen"); revalidatePath("/app/importeren"); };

/** CSV, MT940 of CAMT.053 van de bank inlezen (autodetectie op inhoud) en direct door de AI laten boeken. */
export async function importeerBestand(formData: FormData): Promise<Resultaat> {
  const bestand = formData.get("bestand");
  if (!(bestand instanceof File) || bestand.size === 0) return { ok: false, fout: "Geen bestand gekozen." };
  if (bestand.size > 25 * 1024 * 1024) return { ok: false, fout: "Bestand groter dan 25 MB." };
  try {
    const o = await schrijfOnderneming();
    const tekst = Buffer.from(await bestand.arrayBuffer()).toString("utf8");
    const p = parseBankbestand(tekst, bestand.name);
    if (p.regels.length === 0) return { ok: false, fout: "Geen bankregels herkend. Ondersteund: CSV van ING, Rabobank, ABN AMRO, bunq, Knab, SNS/ASN/RegioBank, Triodos, Revolut, N26, en MT940 of CAMT.053." };
    const uit = await importeerRegels(o.id, p.regels, { bron: /CAMT/.test(p.bank) || /<Document/.test(tekst.slice(0, 500)) ? "camt" : /^:20:|:61:/.test(tekst.slice(0, 300)) ? "mt940" : "csv", bank: p.bank, eigenIban: p.eigenIban });
    ververs();
    const ai = uit.aiFout ? ` AI-boeken mislukt: ${uit.aiFout}` : ` ${uit.beoordeeld} regels door de AI geboekt.`;
    return { ok: true, melding: `${p.bank}: ${uit.nieuw} nieuwe regels (${uit.dubbel} dubbel overgeslagen).${ai}` };
  } catch (e) { return fout(e); }
}

export async function beoordeelOpenstaand(): Promise<Resultaat> {
  try {
    const o = await schrijfOnderneming();
    const r = await beoordeelOpen(o.id);
    ververs();
    if (r.fout) return { ok: false, fout: `${r.beoordeeld} geboekt, daarna fout: ${r.fout}` };
    return { ok: true, melding: r.beoordeeld === 0 ? "Alles is al beoordeeld." : `${r.beoordeeld} regels door de AI geboekt.` };
  } catch (e) { return fout(e); }
}

export async function beoordeelOpenstaandFormulier(): Promise<void> { await beoordeelOpenstaand(); }

/** Boeking wijzigen, ook privédeel (gemengd gebruik) of volledig splitsen in een zakelijk en een privé deel. */
export async function wijzigTransactie(formData: FormData): Promise<void> {
  const o = await schrijfOnderneming();
  const id = String(formData.get("id"));
  const t = await db.transactie.findFirst({ where: { id, ondernemingId: o.id } });
  if (!t) return;
  const zakelijk = formData.get("zakelijk") === "ja";
  const categorie = String(formData.get("categorie") ?? t.categorie ?? "overig");
  const btwCode = String(formData.get("btwCode") ?? t.btwCode ?? "21");
  const priveDeel = Math.min(1, Math.max(0, Number(formData.get("priveDeel") ?? 0) / 100 || 0));
  const splitsBedrag = Number(String(formData.get("splitsBedrag") ?? "").replace(",", ".")) || 0;

  if (splitsBedrag > 0 && splitsBedrag < Math.abs(t.bedrag)) {
    // Splitsen: deze regel wordt het zakelijke deel, een nieuwe regel het privédeel.
    const teken = t.bedrag < 0 ? -1 : 1;
    const zakelijkBedrag = rond(Math.abs(t.bedrag) - splitsBedrag) * teken;
    const priveBedrag = rond(splitsBedrag) * teken;
    await db.transactie.update({
      where: { id }, data: { bedrag: zakelijkBedrag, zakelijk: true, categorie, btwCode, btwBedrag: btwUitInclusief(Math.abs(zakelijkBedrag), btwCode), priveDeel: 0, bevestigd: true, zekerheid: 1, uitleg: "Handmatig gesplitst (zakelijk deel)" },
    });
    await db.transactie.create({
      data: { ondernemingId: o.id, bankrekeningId: t.bankrekeningId, datum: t.datum, bedrag: priveBedrag, tegenpartij: t.tegenpartij, tegenIban: t.tegenIban, omschrijving: `${t.omschrijving} (privédeel)`, hash: maakHash(t.datum, priveBedrag, t.tegenpartij, t.omschrijving, `split:${t.id}`), bron: t.bron, categorie: "prive", btwCode: "geen", btwBedrag: 0, zakelijk: false, bevestigd: true, zekerheid: 1, uitleg: "Handmatig gesplitst (privédeel)" },
    });
  } else {
    await db.transactie.update({
      where: { id },
      data: { zakelijk, categorie, btwCode, priveDeel: zakelijk ? priveDeel : 0, btwBedrag: zakelijk ? btwUitInclusief(Math.abs(t.bedrag), btwCode) : 0, bevestigd: true, zekerheid: 1, uitleg: "Handmatig bevestigd" },
    });
  }
  ververs();
}

export async function bevestigAlles(): Promise<void> {
  const o = await schrijfOnderneming();
  await db.transactie.updateMany({ where: { ondernemingId: o.id, zakelijk: { not: null }, bevestigd: false }, data: { bevestigd: true } });
  ververs();
}

export async function verwijderTransactie(formData: FormData): Promise<void> {
  const o = await schrijfOnderneming();
  await db.transactie.deleteMany({ where: { id: String(formData.get("id")), ondernemingId: o.id, bron: { in: ["csv", "mt940", "camt", "import"] } } });
  ververs();
}

export async function hernoemRekening(formData: FormData): Promise<void> {
  const o = await schrijfOnderneming();
  await db.bankrekening.updateMany({ where: { id: String(formData.get("id")), ondernemingId: o.id }, data: { naam: String(formData.get("naam") ?? "").trim() || "Rekening" } });
  revalidatePath("/app/bank/rekeningen");
}

// ─────────────── Koppelingen ───────────────

const SOORTEN: KoppelingSoort[] = ["enablebanking", "mollie", "stripe", "shopify", "bol", "woocommerce", "paypal", "moneybird", "eboekhouden", "jortt"];

/** Sleutels van een koppeling opslaan (versleuteld). Velden komen uit het formulier, alle niet-lege waarden. */
export async function koppelingOpslaan(formData: FormData): Promise<Resultaat> {
  try {
    const o = await schrijfOnderneming();
    const soort = String(formData.get("soort")) as KoppelingSoort;
    if (!SOORTEN.includes(soort)) return { ok: false, fout: "Onbekende koppeling." };
    const config: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      if (k === "soort" || typeof v !== "string") continue;
      const w = v.trim();
      if (w) config[k] = k === "privateKey" ? w.replace(/\\n/g, "\n") : w;
    }
    if (Object.keys(config).length === 0) return { ok: false, fout: "Vul minstens één veld in." };
    await bewaarKoppeling(o.id, soort, config);
    ververs();
    return { ok: true, melding: "Koppeling opgeslagen. Klik op 'Nu synchroniseren' om te testen." };
  } catch (e) { return fout(e); }
}

export async function koppelingVerwijderen(formData: FormData): Promise<void> {
  const o = await schrijfOnderneming();
  const soort = String(formData.get("soort")) as KoppelingSoort;
  await verwijderK(o.id, soort);
  if (soort === "enablebanking") await db.bankrekening.updateMany({ where: { ondernemingId: o.id, bron: "psd2" }, data: { psd2SessieId: null, psd2AccountId: null, psd2Verloopt: null } });
  ververs();
}

/** PSD2: doorsturen naar de bank voor toestemming. */
export async function startPsd2(formData: FormData): Promise<void> {
  const o = await schrijfOnderneming();
  const bank = String(formData.get("bank") ?? "").trim();
  if (!bank) redirect("/app/koppelingen?fout=" + encodeURIComponent("Kies een bank."));
  const basis = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let url: string;
  try {
    url = await startAutorisatie(o.id, bank, `${basis}/api/koppelingen/enablebanking/callback`);
  } catch (e) {
    redirect("/app/koppelingen?fout=" + encodeURIComponent(e instanceof Error ? e.message : String(e)));
  }
  redirect(url);
}

export async function syncNu(formData: FormData): Promise<Resultaat> {
  try {
    const o = await schrijfOnderneming();
    const soort = String(formData.get("soort") ?? "alles");
    const r = soort === "alles" ? await syncAlleBanken(o.id) : await syncEenBron(o.id, soort);
    ververs();
    if (r.fouten.length) return { ok: false, fout: `${r.nieuw} nieuwe regels. Fouten: ${r.fouten.join(" | ")}` };
    return { ok: true, melding: `${r.nieuw} nieuwe regels opgehaald.` };
  } catch (e) { return fout(e); }
}

export async function syncNuFormulier(formData: FormData): Promise<void> {
  const r = await syncNu(formData);
  redirect(`/app/koppelingen?${r.ok ? "m" : "fout"}=${encodeURIComponent(r.ok ? r.melding : r.fout)}`);
}

// ─────────────── Overstappen ───────────────

export async function importeerVanPakket(formData: FormData): Promise<Resultaat> {
  try {
    const o = await schrijfOnderneming();
    const pakket = String(formData.get("pakket"));
    const bestand = formData.get("bestand");
    const tekst = async () => (bestand instanceof File && bestand.size > 0 ? Buffer.from(await bestand.arrayBuffer()).toString("utf8") : "");
    let melding = "";
    if (pakket === "moneybird") {
      const r = await importeerMoneybird(o.id);
      if (r.fouten.length) return { ok: false, fout: r.fouten.join(" | ") };
      melding = `Moneybird: ${r.klanten} klanten, ${r.facturen} facturen, ${r.transacties} bankregels, ${r.inkoop} inkoopfacturen.`;
    } else if (pakket === "eboekhouden") {
      const r = await importeerEboekhouden(o.id);
      if (r.fouten.length) return { ok: false, fout: r.fouten.join(" | ") };
      melding = `e-Boekhouden: ${r.klanten} relaties, ${r.transacties} bankregels, ${r.boekingen} boekingen.`;
    } else if (pakket === "jortt") {
      const t = await tekst();
      if (!t) return { ok: false, fout: "Kies een CSV-export van Jortt." };
      const r = await importeerJorttCsv(o.id, t);
      if (r.fouten.length) return { ok: false, fout: r.fouten.join(" | ") };
      melding = `Jortt: ${r.klanten} klanten, ${r.regels} boekingen.`;
    } else if (pakket === "excel") {
      if (!(bestand instanceof File) || bestand.size === 0) return { ok: false, fout: "Kies een .xlsx-bestand." };
      const r = await importeerExcel(o.id, Buffer.from(await bestand.arrayBuffer()));
      if (r.fouten.length) return { ok: false, fout: r.fouten.join(" | ") };
      melding = `Excel: ${r.regels} regels ingelezen, ${r.overgeslagen} overgeslagen.`;
    } else if (pakket === "paypal") {
      const t = await tekst();
      if (!t) return { ok: false, fout: "Kies het CSV-activiteitenrapport van PayPal." };
      const r = await importeerPaypalCsv(o.id, t);
      if (r.fouten.length) return { ok: false, fout: r.fouten.join(" | ") };
      melding = `PayPal: ${r.nieuw} regels ingelezen.`;
    } else return { ok: false, fout: "Onbekend pakket." };

    const ai = await beoordeelOpen(o.id);
    ververs();
    return { ok: true, melding: `${melding} ${ai.beoordeeld} regels door de AI geboekt.${ai.fout ? ` (${ai.fout})` : ""}` };
  } catch (e) { return fout(e); }
}
