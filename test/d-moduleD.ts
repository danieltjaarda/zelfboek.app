import { db } from "../src/lib/db";
import { voerToolUit, huidigTijdvak } from "../src/lib/assistent/tools";
import { maakMelding, controleerDeadlines } from "../src/lib/meldingen";
import { weergaveBerichten } from "../src/lib/assistent/chat";

async function main() {
  const o = await db.onderneming.create({ data: { naam: "Test D BV", btwTijdvak: "kwartaal", proefTot: new Date(Date.now() + 7 * 864e5) } });
  try {
    const k = await db.klant.create({ data: { ondernemingId: o.id, naam: "Klant X" } });
    await db.transactie.createMany({ data: [
      { ondernemingId: o.id, datum: new Date("2026-09-10"), bedrag: 1210, tegenpartij: "Klant X", omschrijving: "Factuur 1", hash: "h1" + o.id, categorie: "omzet", btwCode: "21", btwBedrag: 210, zakelijk: true, bevestigd: true },
      { ondernemingId: o.id, datum: new Date("2026-09-12"), bedrag: -121, tegenpartij: "Coolblue", omschrijving: "Muis", hash: "h2" + o.id, categorie: "kantoorkosten", btwCode: "21", btwBedrag: 21, zakelijk: true, bevestigd: false, zekerheid: 0.5 },
      { ondernemingId: o.id, datum: new Date("2026-09-15"), bedrag: -50, tegenpartij: "AH", omschrijving: "Boodschappen", hash: "h3" + o.id, categorie: "prive", btwCode: "geen", btwBedrag: 0, zakelijk: false, bevestigd: true },
    ] });
    await db.factuur.create({ data: { ondernemingId: o.id, klantId: k.id, nummer: "2026-0001", vervaldatum: new Date(Date.now() - 10 * 864e5), regels: "[]", subtotaal: 100, btw: 21, totaal: 121, status: "verzonden" } });
    await db.urenregel.create({ data: { ondernemingId: o.id, datum: new Date(), uren: 8, omschrijving: "werk" } });

    const ctx = { ondernemingId: o.id };
    const z = JSON.parse(await voerToolUit("zoek_transacties", { zoekterm: "", van: "", tot: "", categorie: "", alleen_twijfel: true, min_bedrag: 0 }, ctx));
    if (z.length !== 1 || z[0].tegenpartij !== "Coolblue") throw new Error("zoek_transacties twijfel fout");
    const ok = JSON.parse(await voerToolUit("omzet_kosten_per_periode", { van: "2026-09-01", tot: "2026-09-30" }, ctx));
    if (ok.totaal.omzet !== 1000 || ok.totaal.kosten !== 100) throw new Error("omzet/kosten fout: " + JSON.stringify(ok.totaal));
    const of = JSON.parse(await voerToolUit("openstaande_facturen", {}, ctx));
    if (of.length !== 1 || of[0].dagenTeLaat < 9) throw new Error("open facturen fout");
    const btw = JSON.parse(await voerToolUit("btw_stand", { jaar: 2026, periode: 3 }, ctx));
    if (btw.rubrieken["1a_btw"] !== 210 || btw.rubrieken["5b_voorbelasting"] !== 21 || btw.definitief !== false) throw new Error("btw_stand fout: " + JSON.stringify(btw));
    const w = JSON.parse(await voerToolUit("wijzig_boeking", { transactie_id: z[0].id, categorie: "software", btw_code: "21", zakelijk: true }, ctx));
    if (!w.ok) throw new Error("wijzig fout");
    const t = await db.transactie.findUnique({ where: { id: z[0].id } });
    if (t?.categorie !== "software" || !t.bevestigd) throw new Error("wijzig niet doorgevoerd");
    const u = JSON.parse(await voerToolUit("uren_stand", {}, ctx));
    if (u.uren !== 8 || u.criterium !== 1225) throw new Error("uren fout");
    const taak = JSON.parse(await voerToolUit("maak_taak", { titel: "Test", deadline: "2026-12-01" }, ctx));
    if (!taak.ok) throw new Error("taak fout");
    const ander = await db.onderneming.create({ data: { naam: "Ander" } });
    const leeg = JSON.parse(await voerToolUit("zoek_transacties", { zoekterm: "", van: "", tot: "", categorie: "", alleen_twijfel: false, min_bedrag: 0 }, { ondernemingId: ander.id }));
    if (leeg.length !== 0) throw new Error("tenant-lek!");
    await db.onderneming.delete({ where: { id: ander.id } });

    const m1 = await maakMelding(o.id, "systeem", "Dubbel", "x");
    const m2 = await maakMelding(o.id, "systeem", "Dubbel", "x");
    if (!m1.nieuw || m2.nieuw) throw new Error("melding niet idempotent");
    const n = await controleerDeadlines(o.id);
    const meldingen = await db.melding.findMany({ where: { ondernemingId: o.id } });
    const titels = meldingen.map((m) => m.titel);
    if (!titels.some((x) => x.includes("proefperiode")) || !titels.some((x) => x.includes("vervaldatum"))) throw new Error("deadlines fout: " + titels.join("|"));
    console.log("tijdvak:", huidigTijdvak("kwartaal"), "nieuwe meldingen:", n, titels);
    const wb = weergaveBerichten(JSON.stringify([{ role: "user", content: "hoi" }, { role: "assistant", content: [{ type: "text", text: "hallo" }, { type: "tool_use", id: "1", name: "x", input: {} }] }, { role: "user", content: [{ type: "tool_result", tool_use_id: "1", content: "{}" }] }]));
    if (wb.length !== 2) throw new Error("weergave fout");
    console.log("MODULE D TESTS OK");
  } finally {
    await db.transactie.updateMany({ where: { ondernemingId: o.id }, data: { bonId: null, factuurId: null } });
    await db.onderneming.delete({ where: { id: o.id } });
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
