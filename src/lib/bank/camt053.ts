import { XMLParser } from "fast-xml-parser";
import { type BankRegel, type ParseResultaat, maakRegel, datum } from "./csv";

type Any = Record<string, unknown>;
const lijst = <T,>(x: T | T[] | undefined | null): T[] => (x == null ? [] : Array.isArray(x) ? x : [x]);
const tekst = (x: unknown): string => {
  if (x == null) return "";
  if (typeof x === "object") {
    const o = x as Any;
    if ("#text" in o) return String(o["#text"]);
    return lijst(Object.values(o)[0]).map(tekst).join(" ");
  }
  return String(x);
};

/** CAMT.053 (dagafschrift) en CAMT.052 XML van ING, Rabobank, ABN AMRO, Knab en bunq. */
export function parseCamt053(xml: string): ParseResultaat {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", removeNSPrefix: true, textNodeName: "#text" });
  const doc = parser.parse(xml.replace(/^﻿/, "")) as Any;
  const document = (doc.Document ?? doc) as Any;
  const root = (document.BkToCstmrStmt ?? document.BkToCstmrAcctRpt ?? document) as Any;
  const stmts = lijst<Any>((root.Stmt ?? root.Rpt) as Any | Any[]);
  const regels: BankRegel[] = [];
  let eigenIban: string | undefined;
  let bank = "CAMT";
  let volgnr = 0;

  for (const stmt of stmts) {
    const acct = (stmt.Acct ?? {}) as Any;
    const id = (acct.Id ?? {}) as Any;
    eigenIban ??= tekst(id.IBAN) || undefined;
    const bic = tekst(((acct.Svcr ?? {}) as Any)["FinInstnId"] ? (((acct.Svcr as Any).FinInstnId as Any).BIC ?? (((acct.Svcr as Any).FinInstnId as Any).BICFI)) : "");
    if (/INGB/.test(bic)) bank = "ING"; else if (/RABO/.test(bic)) bank = "Rabobank"; else if (/ABNA/.test(bic)) bank = "ABN AMRO"; else if (/KNAB/.test(bic)) bank = "Knab"; else if (/BUNQ/.test(bic)) bank = "bunq";

    for (const ntry of lijst<Any>(stmt.Ntry as Any | Any[])) {
      const amt = ntry.Amt as Any | string;
      let bedrag = parseFloat(typeof amt === "object" ? tekst(amt) : String(amt));
      if (tekst(ntry.CdtDbtInd) === "DBIT") bedrag = -bedrag;
      const dag = ((ntry.BookgDt ?? ntry.ValDt ?? {}) as Any);
      const d = datum(tekst(dag.Dt) || tekst(dag.DtTm).slice(0, 10));
      const ref = tekst(ntry.AcctSvcrRef) || tekst(ntry.NtryRef);

      const details = lijst<Any>(((ntry.NtryDtls ?? {}) as Any).TxDtls as Any | Any[]);
      if (details.length === 0) {
        const r = maakRegel(d, bedrag, tekst(((ntry.AddtlNtryInf ?? "") as string)).slice(0, 60), tekst(ntry.AddtlNtryInf), undefined, eigenIban, `${ref}|${volgnr++}`);
        if (r) regels.push(r);
        continue;
      }
      for (const tx of details) {
        const txAmt = (tx.Amt ?? ((tx.AmtDtls as Any)?.TxAmt as Any)?.Amt) as Any | undefined;
        let txBedrag = txAmt != null ? parseFloat(tekst(txAmt)) : Math.abs(bedrag);
        const ind = tekst(tx.CdtDbtInd) || tekst(ntry.CdtDbtInd);
        if (ind === "DBIT") txBedrag = -Math.abs(txBedrag);
        const partijen = (tx.RltdPties ?? {}) as Any;
        const is_credit = txBedrag > 0;
        const tegenPartij = (is_credit ? partijen.Dbtr : partijen.Cdtr) as Any | undefined;
        const tegenAcct = (is_credit ? partijen.DbtrAcct : partijen.CdtrAcct) as Any | undefined;
        const pty = (tegenPartij?.Pty ?? tegenPartij) as Any | undefined;
        const naam = tekst(pty?.Nm) || tekst(((tx.RltdAgts ?? {}) as Any)[is_credit ? "DbtrAgt" : "CdtrAgt"]);
        const iban = tekst(((tegenAcct?.Id ?? {}) as Any).IBAN) || undefined;
        const rmt = (tx.RmtInf ?? {}) as Any;
        const oms = lijst(rmt.Ustrd).map(tekst).join(" ") || tekst(((lijst<Any>(rmt.Strd as Any | Any[])[0] ?? {}).CdtrRefInf as Any)?.Ref) || tekst(ntry.AddtlNtryInf) || tekst(((tx.Refs ?? {}) as Any).EndToEndId);
        const txRef = tekst(((tx.Refs ?? {}) as Any).AcctSvcrRef) || ref;
        const r = maakRegel(d, txBedrag, naam, oms, iban, eigenIban, `${txRef}|${volgnr++}`);
        if (r) regels.push(r);
      }
    }
  }
  return { bank, eigenIban, regels };
}
