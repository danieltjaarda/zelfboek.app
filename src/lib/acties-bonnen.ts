"use server";

import { revalidatePath } from "next/cache";
import { readFile, unlink } from "fs/promises";
import { db, schrijfOnderneming } from "./db";
import { leesBon, type BonUitlezing } from "./ai";
import { btwUitInclusief } from "./btw";

export type Resultaat = { ok: true; melding: string } | { ok: false; fout: string };

const TOEGESTAAN = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"];

function foutTekst(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/api key|apiKey|ANTHROPIC_API_KEY|authentication|401/i.test(m)) return "Geen geldige ANTHROPIC_API_KEY ingesteld.";
  return m;
}

/** Zoekt een bankregel bij een uitgelezen bon: zelfde bedrag ±0,01 binnen 14 dagen, anders op leveranciersnaam binnen 14 dagen. */
async function zoekBankregel(ondernemingId: string, u: { datum: Date | null; totaal: number | null; leverancier: string | null }) {
  if (!u.datum || !u.totaal) return null;
  const van = new Date(u.datum.getTime() - 14 * 864e5);
  const tot = new Date(u.datum.getTime() + 14 * 864e5);
  const basis = { ondernemingId, bonId: null, datum: { gte: van, lte: tot } };
  const opBedrag = await db.transactie.findFirst({ where: { ...basis, bedrag: { gte: -u.totaal - 0.01, lte: -u.totaal + 0.01 } } });
  if (opBedrag) return opBedrag;
  const woord = (u.leverancier ?? "").split(/\s+/).find((w) => w.length >= 4);
  if (!woord) return null;
  return db.transactie.findFirst({ where: { ...basis, bedrag: { lt: 0 }, tegenpartij: { contains: woord, mode: "insensitive" } } });
}

async function koppel(bonId: string, transactieId: string, u: { btwBedrag: number | null; btwCode: string | null; categorie: string | null; leverancier: string | null }) {
  await db.transactie.update({
    where: { id: transactieId },
    data: { bonId, btwBedrag: u.btwBedrag ?? undefined, btwCode: u.btwCode ?? undefined, categorie: u.categorie ?? undefined, zakelijk: true, bevestigd: true, zekerheid: 1, uitleg: `Bon gekoppeld: ${u.leverancier ?? "onbekend"}` },
  });
  await db.bon.update({ where: { id: bonId }, data: { status: "gekoppeld" } });
}

async function verwerkUitlezing(bonId: string, ondernemingId: string, u: BonUitlezing) {
  const datum = u.datum ? new Date(u.datum) : null;
  const geldigeDatum = datum && !isNaN(datum.getTime()) ? datum : null;
  await db.bon.update({
    where: { id: bonId },
    data: {
      leverancier: u.leverancier, leverancierBtw: u.leverancierBtw || null, factuurnummer: u.factuurnummer || null,
      datum: geldigeDatum, totaal: u.totaal, btwBedrag: u.btwBedrag, btwCode: u.btwCode, categorie: u.categorie,
      valuta: u.valuta || "EUR", zekerheid: u.zekerheid, uitleg: u.uitleg, regelsJson: JSON.stringify(u.regels), status: "uitgelezen",
    },
  });
  const match = await zoekBankregel(ondernemingId, { datum: geldigeDatum, totaal: u.totaal, leverancier: u.leverancier });
  if (match) await koppel(bonId, match.id, u);
  return !!match;
}

/** Eén of meer bonnen uploaden, uitlezen en koppelen. */
export async function uploadBonnen(formData: FormData): Promise<Resultaat> {
  const bestanden = formData.getAll("bestand").filter((b): b is File => b instanceof File && b.size > 0);
  if (bestanden.length === 0) return { ok: false, fout: "Geen bestand gekozen." };
  const o = await schrijfOnderneming();
  const meldingen: string[] = [];
  let fouten = 0;
  for (const bestand of bestanden) {
    if (bestand.size > 20 * 1024 * 1024) { meldingen.push(`${bestand.name}: groter dan 20 MB`); fouten++; continue; }
    if (!TOEGESTAAN.includes(bestand.type)) { meldingen.push(`${bestand.name}: alleen PDF, JPG, PNG, WEBP of GIF`); fouten++; continue; }
    const buffer = Buffer.from(await bestand.arrayBuffer());
    // Het bestand gaat de database in: op Vercel is er geen schijf die blijft bestaan.
    const bon = await db.bon.create({ data: { ondernemingId: o.id, bestandsnaam: bestand.name, mimeType: bestand.type, bestandsPad: "", inhoud: new Uint8Array(buffer) } });
    try {
      const u = await leesBon(buffer, bestand.type);
      const gekoppeld = await verwerkUitlezing(bon.id, o.id, u);
      meldingen.push(`${u.leverancier} ${u.totaal.toFixed(2)} ${u.valuta || "EUR"}: ${gekoppeld ? "gekoppeld aan bankregel" : "uitgelezen, nog geen bankregel"}`);
    } catch (e) {
      fouten++;
      await db.bon.update({ where: { id: bon.id }, data: { status: "fout", uitleg: foutTekst(e) } });
      meldingen.push(`${bestand.name}: ${foutTekst(e)}`);
    }
  }
  revalidatePath("/app");
  const tekst = meldingen.join(" · ");
  return fouten === bestanden.length ? { ok: false, fout: tekst } : { ok: true, melding: tekst };
}

export async function bonOpnieuwLezen(formData: FormData): Promise<void> {
  const o = await schrijfOnderneming();
  const bon = await db.bon.findFirst({ where: { id: String(formData.get("id")), ondernemingId: o.id } });
  if (!bon) return;
  try {
    const buffer = bon.inhoud ? Buffer.from(bon.inhoud) : await readFile(bon.bestandsPad);
    const u = await leesBon(buffer, bon.mimeType);
    await verwerkUitlezing(bon.id, o.id, u);
  } catch (e) {
    await db.bon.update({ where: { id: bon.id }, data: { status: "fout", uitleg: foutTekst(e) } });
  }
  revalidatePath("/app");
}

export async function bonWijzigen(formData: FormData): Promise<void> {
  const o = await schrijfOnderneming();
  const bon = await db.bon.findFirst({ where: { id: String(formData.get("id")), ondernemingId: o.id }, include: { transactie: true } });
  if (!bon) return;
  const v = (k: string) => String(formData.get(k) ?? "").trim();
  const totaal = Number(v("totaal").replace(",", ".")) || 0;
  const btwCode = v("btwCode") || "21";
  const btwBedrag = v("btwBedrag") ? Number(v("btwBedrag").replace(",", ".")) : btwUitInclusief(totaal, btwCode);
  const datum = v("datum") ? new Date(v("datum")) : null;
  await db.bon.update({
    where: { id: bon.id },
    data: { leverancier: v("leverancier") || null, factuurnummer: v("factuurnummer") || null, datum, totaal, btwBedrag, btwCode, categorie: v("categorie") || null, status: bon.transactie ? "gekoppeld" : "handmatig", zekerheid: 1, uitleg: "Handmatig gecorrigeerd" },
  });
  if (bon.transactie) {
    await db.transactie.update({ where: { id: bon.transactie.id }, data: { btwBedrag, btwCode, categorie: v("categorie") || undefined, bevestigd: true } });
  }
  revalidatePath("/app");
}

export async function bonKoppelen(formData: FormData): Promise<Resultaat> {
  const o = await schrijfOnderneming();
  const bon = await db.bon.findFirst({ where: { id: String(formData.get("id")), ondernemingId: o.id } });
  const t = await db.transactie.findFirst({ where: { id: String(formData.get("transactieId")), ondernemingId: o.id } });
  if (!bon || !t) return { ok: false, fout: "Bon of bankregel niet gevonden." };
  if (t.bonId && t.bonId !== bon.id) return { ok: false, fout: "Aan die bankregel hangt al een bon." };
  await koppel(bon.id, t.id, bon);
  revalidatePath("/app");
  return { ok: true, melding: "Gekoppeld." };
}

export async function bonOntkoppelen(formData: FormData): Promise<void> {
  const o = await schrijfOnderneming();
  const bon = await db.bon.findFirst({ where: { id: String(formData.get("id")), ondernemingId: o.id } });
  if (!bon) return;
  await db.transactie.updateMany({ where: { bonId: bon.id }, data: { bonId: null } });
  await db.bon.update({ where: { id: bon.id }, data: { status: "uitgelezen" } });
  revalidatePath("/app");
}

export async function bonVerwijderen(formData: FormData): Promise<void> {
  const o = await schrijfOnderneming();
  const bon = await db.bon.findFirst({ where: { id: String(formData.get("id")), ondernemingId: o.id } });
  if (!bon) return;
  await db.transactie.updateMany({ where: { bonId: bon.id }, data: { bonId: null } });
  await db.bon.delete({ where: { id: bon.id } });
  if (bon.bestandsPad) await unlink(bon.bestandsPad).catch(() => undefined);
  revalidatePath("/app");
}
