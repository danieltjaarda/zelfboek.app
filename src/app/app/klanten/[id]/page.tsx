import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db, huidigeOnderneming } from "@/lib/db";
import { datumNl, euro, rond } from "@/lib/btw";
import { statusPil, statusTekst, OPEN_STATUS } from "@/lib/facturen/status";
import { klantOpslaan, klantVerwijderen, urenNaarFactuur } from "@/lib/acties-facturen";
import { Cijferband, Kaart, Kop, Melding, Pil, Tegel, knop, veld } from "@/components/ui";
import { ActieKnop } from "../../facturen/[id]/Acties";

export const instant = false;

export default async function KlantDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fout?: string }> }) {
  await connection();
  const { id } = await params;
  const { fout } = await searchParams;
  const o = await huidigeOnderneming();
  const k = await db.klant.findFirst({ where: { id, ondernemingId: o.id }, include: { facturen: { orderBy: { datum: "desc" } }, offertes: { orderBy: { datum: "desc" }, take: 10 } } });
  if (!k) notFound();
  const openUren = await db.urenregel.aggregate({ where: { ondernemingId: o.id, klantId: k.id, gefactureerd: false, soort: "declarabel" }, _sum: { uren: true }, _count: true });
  const open = rond(k.facturen.filter((f) => OPEN_STATUS.includes(f.status)).reduce((s, f) => s + f.totaal - f.betaaldBedrag, 0));
  const omzet = rond(k.facturen.filter((f) => f.status === "betaald").reduce((s, f) => s + f.subtotaal, 0));
  const nu = new Date();

  async function opslaan(fd: FormData) {
    "use server";
    await klantOpslaan(fd);
  }

  return (
    <>
      <Kop titel={k.naam} sub={[k.contactpersoon, k.email, [k.postcode, k.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", ") || undefined}>
        <Link href={`/app/facturen/nieuw?klant=${k.id}`} className={knop}>Nieuwe factuur</Link>
      </Kop>
      {fout && <div className="mb-4"><Melding r={{ ok: false, fout }} /></div>}

      <Cijferband>
        <Tegel label="Omzet, alle jaren" waarde={omzet} hint="betaald, zonder btw" />
        <Tegel label="Nog te ontvangen" waarde={open} accent={open > 0 ? "geel" : undefined} />
        <Tegel label="Facturen" waarde={String(k.facturen.length)} />
      </Cijferband>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          {(openUren._sum.uren ?? 0) > 0 && (
            <div className="kaart flex flex-wrap items-center justify-between gap-3 border-groen/30 bg-groen-licht px-5 py-4">
              <p className="text-sm text-groen-tekst">{openUren._sum.uren} uur in {openUren._count} regels staat nog niet op een factuur.</p>
              <ActieKnop actie={urenNaarFactuur} id={k.id} label="Zet de uren op een factuur" extra={{ klantId: k.id, uurtarief: "0" }} />
            </div>
          )}
          <Kaart titel="Facturen">
            {k.facturen.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-tekst-2">Nog geen facturen voor deze klant.</p>
            ) : (
              <table className="tabel">
                <thead><tr><th>Factuur</th><th>Datum</th><th className="num">Totaal</th><th>Status</th></tr></thead>
                <tbody>
                  {k.facturen.map((f) => {
                    const teLaat = OPEN_STATUS.includes(f.status) && f.vervaldatum < nu;
                    return (
                      <tr key={f.id}>
                        <td><Link href={`/app/facturen/${f.id}`} className="font-medium hover:underline">{f.nummer}</Link></td>
                        <td className="text-tekst-2">{datumNl(f.datum)}</td>
                        <td className="num">{euro(f.totaal)}</td>
                        <td><Pil kleur={teLaat && f.status === "verzonden" ? "rood" : statusPil[f.status] ?? "grijs"}>{teLaat && f.status === "verzonden" ? "Te laat" : statusTekst[f.status] ?? f.status}</Pil></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Kaart>
          {k.offertes.length > 0 && (
            <Kaart titel="Offertes">
              <table className="tabel">
                <tbody>
                  {k.offertes.map((x) => (
                    <tr key={x.id}>
                      <td><Link href={`/app/offertes/${x.id}`} className="font-medium hover:underline">{x.nummer}</Link></td>
                      <td className="num">{euro(x.totaal)}</td>
                      <td><Pil kleur={statusPil[x.status] ?? "grijs"}>{x.status === "verzonden" ? "Wacht op klant" : statusTekst[x.status] ?? x.status}</Pil></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Kaart>
          )}
        </div>

        <Kaart titel="Gegevens" className="self-start">
          <form action={opslaan} className="space-y-3 px-5 py-4">
            <input type="hidden" name="id" value={k.id} />
            <div><label className="lbl" htmlFor="naam">Naam</label><input id="naam" name="naam" defaultValue={k.naam} required className={veld} /></div>
            <div><label className="lbl" htmlFor="contactpersoon">Contactpersoon</label><input id="contactpersoon" name="contactpersoon" defaultValue={k.contactpersoon ?? ""} className={veld} /></div>
            <div><label className="lbl" htmlFor="email">E-mailadres</label><input id="email" name="email" type="email" defaultValue={k.email ?? ""} className={veld} /></div>
            <div><label className="lbl" htmlFor="telefoon">Telefoon</label><input id="telefoon" name="telefoon" defaultValue={k.telefoon ?? ""} className={veld} /></div>
            <div><label className="lbl" htmlFor="adres">Adres</label><input id="adres" name="adres" defaultValue={k.adres ?? ""} className={veld} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl" htmlFor="postcode">Postcode</label><input id="postcode" name="postcode" defaultValue={k.postcode ?? ""} className={veld} /></div>
              <div><label className="lbl" htmlFor="plaats">Plaats</label><input id="plaats" name="plaats" defaultValue={k.plaats ?? ""} className={veld} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl" htmlFor="land">Land</label><input id="land" name="land" defaultValue={k.land} className={veld} /></div>
              <div><label className="lbl" htmlFor="btwNummer">Btw-nummer</label><input id="btwNummer" name="btwNummer" defaultValue={k.btwNummer ?? ""} className={veld} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl" htmlFor="kvk">KvK-nummer</label><input id="kvk" name="kvk" defaultValue={k.kvk ?? ""} className={veld} /></div>
              <div><label className="lbl" htmlFor="betaaltermijn">Betaaltermijn (dagen)</label><input id="betaaltermijn" name="betaaltermijn" type="number" defaultValue={k.betaaltermijn ?? ""} placeholder={String(o.betaaltermijn)} className={veld} /></div>
            </div>
            <input type="hidden" name="isOndernemer_form" value="1" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isOndernemer" value="ja" defaultChecked={k.isOndernemer} /> Is ondernemer (nodig om btw te verleggen)</label>
            <div><label className="lbl" htmlFor="notities">Notities</label><textarea id="notities" name="notities" defaultValue={k.notities ?? ""} rows={2} className={veld} /></div>
            <button className={knop}>Opslaan</button>
          </form>
          <div className="border-t border-lijn px-5 py-3">
            <form action={klantVerwijderen}><input type="hidden" name="id" value={k.id} /><button className="knop-tekst text-rood-tekst">Klant verwijderen</button></form>
          </div>
        </Kaart>
      </div>
    </>
  );
}
