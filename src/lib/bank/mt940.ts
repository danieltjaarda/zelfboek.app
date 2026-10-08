import { type BankRegel, type ParseResultaat, maakRegel } from "./csv";

/**
 * SWIFT MT940 parser (ING, Rabobank, ABN AMRO, Triodos, bunq).
 * Leest :25: (eigen rekening), :61: (boeking) en :86: (omschrijving, met /NAME/, /REMI/, /IBAN/ of de oudere ING/Rabo-varianten).
 */
export function parseMt940(tekst: string): ParseResultaat {
  const regels: BankRegel[] = [];
  const schoon = tekst.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  // Meerdere berichten mogelijk (gescheiden door "-" of "{" ... "}")
  const velden = splitsVelden(schoon);
  let eigenIban: string | undefined;
  let bank = "MT940";
  let huidig: { datum: Date; bedrag: number; ref: string } | null = null;
  let volgnr = 0;

  const afronden = (oms86: string) => {
    if (!huidig) return;
    const info = parse86(oms86);
    const regel = maakRegel(huidig.datum, huidig.bedrag, info.naam, info.omschrijving || huidig.ref, info.iban, eigenIban, `${huidig.ref}|${volgnr++}`);
    if (regel) regels.push(regel);
    huidig = null;
  };

  for (const { tag, inhoud } of velden) {
    if (tag === "25") {
      const m = inhoud.replace(/\s/g, "").replace(/EUR$/, "").match(/[A-Z]{2}\d{2}[A-Z0-9]{10,30}/);
      if (m) eigenIban = m[0];
      if (/INGB/.test(inhoud)) bank = "ING";
      else if (/RABO/.test(inhoud)) bank = "Rabobank";
      else if (/ABNA/.test(inhoud)) bank = "ABN AMRO";
      else if (/TRIO/.test(inhoud)) bank = "Triodos";
      else if (/BUNQ/.test(inhoud)) bank = "bunq";
    } else if (tag === "61") {
      if (huidig) afronden("");
      const m = inhoud.match(/^(\d{6})(\d{4})?(R?[CD])([A-Z]?)([\d,]+)(N|S|F)?([A-Z0-9]{3})?([\s\S]*)$/);
      if (!m) continue;
      const [, yymmdd, , dc, , bedragStr, , , rest] = m;
      const d = new Date(2000 + +yymmdd.slice(0, 2), +yymmdd.slice(2, 4) - 1, +yymmdd.slice(4, 6));
      let bedrag = parseFloat(bedragStr.replace(",", "."));
      if (dc === "D" || dc === "RC") bedrag = -bedrag;
      huidig = { datum: d, bedrag, ref: (rest ?? "").split("\n")[0].replace(/\/\/.*$/, "").trim() };
    } else if (tag === "86") {
      if (huidig) afronden(inhoud);
    }
  }
  if (huidig) afronden("");
  return { bank, eigenIban, regels };
}

function splitsVelden(tekst: string): { tag: string; inhoud: string }[] {
  const uit: { tag: string; inhoud: string }[] = [];
  const re = /^:(\d{2}[A-Z]?):/gm;
  let m: RegExpExecArray | null;
  const posities: { tag: string; start: number; eind: number }[] = [];
  while ((m = re.exec(tekst))) posities.push({ tag: m[1].replace(/[A-Z]$/, ""), start: m.index, eind: m.index + m[0].length });
  for (let i = 0; i < posities.length; i++) {
    const volgende = posities[i + 1]?.start ?? tekst.length;
    let inhoud = tekst.slice(posities[i].eind, volgende).trim();
    // Einde bericht ("-" op eigen regel) weghalen
    inhoud = inhoud.replace(/\n-\s*$/g, "").replace(/\n\{[\s\S]*$/, "");
    uit.push({ tag: posities[i].tag, inhoud });
  }
  return uit;
}

/** :86: in de SEPA-variant (/NAME/.../REMI/...), de Rabobank-variant en vrij tekst. */
export function parse86(s: string): { naam: string; iban?: string; omschrijving: string } {
  const plat = s.replace(/\n/g, " ").trim();
  if (/\/(NAME|REMI|IBAN|CNTP|EREF|TRTP)\//.test(plat)) {
    const vind = (code: string) => plat.match(new RegExp(`/${code}/(.*?)(?=/[A-Z]{3,5}/|$)`))?.[1]?.trim() ?? "";
    let naam = vind("NAME");
    let iban = vind("IBAN");
    const cntp = vind("CNTP");
    if (cntp) {
      // Rabobank: /CNTP/IBAN/BIC/NAAM/PLAATS/
      const delen = cntp.split("/");
      iban ||= delen[0] ?? "";
      naam ||= delen[2] ?? "";
    }
    const remi = vind("REMI") || vind("USTD") || vind("STRD");
    const ustrd = remi.replace(/^\/USTD\/\//, "").replace(/^USTD\/\//, "").replace(/\/+$/, "").trim();
    return { naam, iban: iban || undefined, omschrijving: ustrd || vind("EREF") || plat };
  }
  // Oudere ING: "0123456789 NAAM OMSCHRIJVING" of "GT NAAM"; Rabobank oud: "IBAN NAAM..."
  const m = plat.match(/^(?:\d{10}|[A-Z]{2}\d{2}[A-Z0-9]{10,30})\s+(.{1,35}?)\s{2,}(.*)$/);
  if (m) return { naam: m[1].trim(), omschrijving: m[2].trim() };
  const woorden = plat.split(/\s+/);
  return { naam: woorden.slice(0, 4).join(" ").slice(0, 60), omschrijving: plat };
}
