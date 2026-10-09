import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leesBon } from "@/lib/ai";
import { geheimKlopt } from "@/lib/crypto";

/**
 * Bonnen per e-mail: de klant stuurt een bon naar bonnen+<ondernemingId>@jouwdomein.nl.
 * Werkt met de inbound-webhooks van Resend, Postmark en Mailgun (JSON met bijlagen in base64)
 * en met multipart/form-data. Beveiliging: INBOUND_SECRET in de URL (?secret=) of de Authorization-header.
 */
export async function POST(req: Request) {
  const geheim = process.env.INBOUND_SECRET;
  const url = new URL(req.url);
  const meegegeven = url.searchParams.get("secret") ?? req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!geheimKlopt(meegegeven, geheim)) return NextResponse.json({ fout: "Niet toegestaan" }, { status: 401 });

  let aan = "";
  let afzender = "";
  const bijlagen: { naam: string; type: string; data: Buffer }[] = [];
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    aan = String(fd.get("to") ?? fd.get("recipient") ?? fd.get("To") ?? "");
    afzender = String(fd.get("from") ?? fd.get("sender") ?? "");
    for (const [, v] of fd.entries()) {
      if (v instanceof File && v.size > 0) bijlagen.push({ naam: v.name, type: v.type, data: Buffer.from(await v.arrayBuffer()) });
    }
  } else {
    const body = (await req.json()) as Record<string, unknown>;
    const d = (body.data as Record<string, unknown>) ?? body;
    const toVeld = d.to ?? d.To ?? d.ToFull ?? d.recipient;
    aan = Array.isArray(toVeld) ? String((toVeld[0] as { Email?: string; email?: string })?.Email ?? (toVeld[0] as { email?: string })?.email ?? toVeld[0]) : String(toVeld ?? "");
    afzender = String(d.from ?? d.From ?? d.sender ?? "");
    const lijst = (d.attachments ?? d.Attachments ?? []) as { filename?: string; Name?: string; content?: string; Content?: string; content_type?: string; ContentType?: string; contentType?: string }[];
    for (const a of lijst) {
      const inhoud = a.content ?? a.Content;
      if (!inhoud) continue;
      bijlagen.push({ naam: a.filename ?? a.Name ?? "bon", type: a.content_type ?? a.ContentType ?? a.contentType ?? "application/octet-stream", data: Buffer.from(inhoud, "base64") });
    }
  }

  const match = aan.match(/bonnen\+([a-z0-9]+)@/i);
  if (!match) return NextResponse.json({ fout: "Geen onderneming in het adres" }, { status: 400 });
  const o = await db.onderneming.findUnique({ where: { id: match[1] }, include: { leden: { include: { gebruiker: true } } } });
  // Onbekend adres: 200 teruggeven zodat de mailprovider niet blijft retryen en niemand ondernemings-id's kan raden.
  if (!o) return NextResponse.json({ ontvangen: 0, genegeerd: "onbekend adres" });

  // Alleen mail van een lid of van het bedrijfsadres zelf: anders kan iedereen bonnen in andermans boekhouding duwen.
  const afzAdres = afzender.match(/[^<\s"]+@[^>\s"]+/)?.[0]?.toLowerCase() ?? "";
  const bekend = afzAdres && (o.leden.some((l) => l.gebruiker.email.toLowerCase() === afzAdres) || o.email?.toLowerCase() === afzAdres);
  if (!bekend) {
    await db.melding.create({ data: { ondernemingId: o.id, soort: "systeem", titel: "Bon per e-mail genegeerd", tekst: `Afzender ${afzAdres || "onbekend"} is geen lid van deze onderneming. Stuur bonnen vanaf het e-mailadres waarmee je inlogt.`, link: "/app/bonnen" } });
    return NextResponse.json({ ontvangen: bijlagen.length, verwerkt: 0, genegeerd: "afzender onbekend" });
  }

  const toegestaan = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"];
  let verwerkt = 0;

  for (const b of bijlagen.filter((x) => toegestaan.includes(x.type))) {
    if (b.data.length > 20 * 1024 * 1024) continue;
    const bon = await db.bon.create({ data: { ondernemingId: o.id, bestandsnaam: b.naam, mimeType: b.type, bestandsPad: "", inhoud: new Uint8Array(b.data), bron: "email" } });
    try {
      const u = await leesBon(b.data, b.type);
      const datum = u.datum ? new Date(u.datum) : null;
      await db.bon.update({
        where: { id: bon.id },
        data: {
          leverancier: u.leverancier, leverancierBtw: u.leverancierBtw || null, factuurnummer: u.factuurnummer || null,
          datum: datum && !isNaN(datum.getTime()) ? datum : null, totaal: u.totaal, btwBedrag: u.btwBedrag, btwCode: u.btwCode,
          categorie: u.categorie, valuta: u.valuta || "EUR", zekerheid: u.zekerheid, uitleg: u.uitleg, regelsJson: JSON.stringify(u.regels), status: "uitgelezen",
        },
      });
      if (datum && u.totaal) {
        const kandidaten = await db.transactie.findMany({
          where: { ondernemingId: o.id, bonId: null, datum: { gte: new Date(datum.getTime() - 14 * 864e5), lte: new Date(datum.getTime() + 14 * 864e5) }, bedrag: { gte: -u.totaal - 0.01, lte: -u.totaal + 0.01 } },
          take: 2,
        });
        // Precies één bankregel met dit bedrag: koppelen, maar de ondernemer bevestigt zelf (niet automatisch "zeker").
        if (kandidaten.length === 1) {
          const kandidaat = kandidaten[0];
          await db.transactie.update({ where: { id: kandidaat.id }, data: { bonId: bon.id, btwBedrag: u.btwBedrag, btwCode: u.btwCode, categorie: u.categorie, zakelijk: true, bevestigd: false, zekerheid: Math.min(u.zekerheid ?? 0.8, 0.8), uitleg: `Bon per e-mail gekoppeld: ${u.leverancier}. Controleer en bevestig.` } });
          await db.bon.update({ where: { id: bon.id }, data: { status: "gekoppeld" } });
        }
      }
      verwerkt++;
    } catch (e) {
      await db.bon.update({ where: { id: bon.id }, data: { status: "fout", uitleg: e instanceof Error ? e.message : String(e) } });
    }
  }

  await db.melding.create({
    data: { ondernemingId: o.id, soort: "ai", titel: `${verwerkt} ${verwerkt === 1 ? "bon" : "bonnen"} per e-mail ontvangen`, tekst: `Van ${afzender || "onbekende afzender"}. ${verwerkt > 0 ? "Uitgelezen en waar mogelijk gekoppeld." : "Geen leesbare bijlage gevonden."}`, link: "/app/bonnen" },
  });
  return NextResponse.json({ ontvangen: bijlagen.length, verwerkt });
}
