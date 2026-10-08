import { MERK } from "@/lib/merk";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { hash, willekeurigToken, zesCijfers } from "./crypto";
import { htmlMail, verstuurMail } from "./mail";

const COOKIE = "bb_sessie";
const SESSIE_DAGEN = 30;

/** Stap 1: code per e-mail. Maakt de gebruiker aan als die nog niet bestaat. */
export async function stuurLoginCode(email: string): Promise<{ ok: boolean; melding: string }> {
  const e = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { ok: false, melding: "Ongeldig e-mailadres." };
  const gebruiker = await db.gebruiker.upsert({ where: { email: e }, update: {}, create: { email: e } });
  const code = zesCijfers();
  await db.loginCode.create({
    data: { gebruikerId: gebruiker.id, codeHash: hash(code), verlooptOp: new Date(Date.now() + 10 * 60_000) },
  });
  const r = await verstuurMail({
    aan: e,
    onderwerp: `${code} is je inlogcode voor ${MERK}`,
    tekst: `Je inlogcode is ${code}. Die is 10 minuten geldig.`,
    html: htmlMail("Je inlogcode", [`<span style="font-size:32px;letter-spacing:6px;font-weight:600">${code}</span>`, "Deze code is 10 minuten geldig."]),
  });
  const extra = r.verzonden ? "" : ` (Geen SMTP ingesteld: code staat in uploads/outbox.log${process.env.NODE_ENV !== "production" ? `, code ${code}` : ""}.)`;
  return { ok: true, melding: `Code verstuurd naar ${e}.${extra}` };
}

/** Stap 2: code controleren en sessie aanmaken. */
export async function logInMetCode(email: string, code: string): Promise<{ ok: boolean; melding: string; nieuw?: boolean }> {
  const e = email.trim().toLowerCase();
  const gebruiker = await db.gebruiker.findUnique({ where: { email: e } });
  if (!gebruiker) return { ok: false, melding: "Onbekend e-mailadres." };
  const geldig = await db.loginCode.findFirst({
    where: { gebruikerId: gebruiker.id, codeHash: hash(code.trim()), gebruiktOp: null, verlooptOp: { gt: new Date() } },
  });
  if (!geldig) return { ok: false, melding: "Code onjuist of verlopen." };
  await db.loginCode.update({ where: { id: geldig.id }, data: { gebruiktOp: new Date() } });

  const token = willekeurigToken();
  const lid = await db.lidmaatschap.findFirst({ where: { gebruikerId: gebruiker.id } });
  await db.sessie.create({
    data: {
      gebruikerId: gebruiker.id,
      tokenHash: hash(token),
      verlooptOp: new Date(Date.now() + SESSIE_DAGEN * 864e5),
      actieveOndernemingId: lid?.ondernemingId ?? null,
    },
  });
  const nieuw = !gebruiker.laatstActief; // eerste keer ingelogd: welkomstanimatie
  await db.gebruiker.update({ where: { id: gebruiker.id }, data: { laatstActief: new Date() } });
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSIE_DAGEN * 86400 });
  return { ok: true, melding: "Ingelogd.", nieuw };
}

export async function logUit() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.sessie.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(COOKIE);
}

export const huidigeSessie = cache(async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.sessie.findUnique({ where: { tokenHash: hash(token) }, include: { gebruiker: true } });
  if (!s || s.verlooptOp < new Date()) return null;
  return s;
});

/** Ingelogde gebruiker of doorsturen naar login. */
export async function vereisGebruiker() {
  const s = await huidigeSessie();
  if (!s) redirect("/login");
  return s;
}

/**
 * De actieve onderneming van de ingelogde gebruiker.
 * Heeft de gebruiker er nog geen, dan wordt er één aangemaakt (onboarding).
 */
export const huidigeOnderneming = cache(async () => {
  const s = await vereisGebruiker();
  if (s.actieveOndernemingId) {
    const lid = await db.lidmaatschap.findUnique({
      where: { gebruikerId_ondernemingId: { gebruikerId: s.gebruikerId, ondernemingId: s.actieveOndernemingId } },
      include: { onderneming: true },
    });
    if (lid) return lid.onderneming;
  }
  const eerste = await db.lidmaatschap.findFirst({ where: { gebruikerId: s.gebruikerId }, include: { onderneming: true } });
  if (eerste) {
    await db.sessie.update({ where: { id: s.id }, data: { actieveOndernemingId: eerste.ondernemingId } });
    return eerste.onderneming;
  }
  const o = await db.onderneming.create({
    data: {
      naam: s.gebruiker.naam ? `${s.gebruiker.naam}` : "Mijn onderneming",
      email: s.gebruiker.email,
      proefTot: new Date(Date.now() + 30 * 864e5),
      leden: { create: { gebruikerId: s.gebruikerId, rol: "eigenaar" } },
    },
  });
  await db.sessie.update({ where: { id: s.id }, data: { actieveOndernemingId: o.id } });
  return o;
});

export async function wisselOnderneming(ondernemingId: string) {
  const s = await vereisGebruiker();
  const lid = await db.lidmaatschap.findUnique({
    where: { gebruikerId_ondernemingId: { gebruikerId: s.gebruikerId, ondernemingId } },
  });
  if (!lid) throw new Error("Geen toegang tot deze onderneming");
  await db.sessie.update({ where: { id: s.id }, data: { actieveOndernemingId: ondernemingId } });
}

/** Abonnement actief, in proef, of verlopen? */
export function abonnementStatus(o: { abonnement: string; proefTot: Date | null }) {
  if (o.abonnement === "actief") return { toegang: true, tekst: "Actief" };
  if (o.abonnement === "proef") {
    const dagen = o.proefTot ? Math.ceil((o.proefTot.getTime() - Date.now()) / 864e5) : 0;
    return { toegang: dagen > 0, tekst: dagen > 0 ? `Proef, nog ${dagen} dagen` : "Proef verlopen" };
  }
  if (o.abonnement === "achterstallig") return { toegang: true, tekst: "Betaling mislukt" };
  return { toegang: false, tekst: "Gestopt" };
}
