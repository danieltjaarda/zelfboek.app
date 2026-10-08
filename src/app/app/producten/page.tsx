import Link from "next/link";
import { connection } from "next/server";
import { db, huidigeOnderneming } from "@/lib/db";
import { euro } from "@/lib/btw";
import { productOpslaan, productVerwijderen } from "@/lib/acties-facturen";
import { Kaart, Kop, Leeg, knop, veld } from "@/components/ui";

export const instant = false;

export default async function Producten() {
  await connection();
  const o = await huidigeOnderneming();
  const producten = await db.product.findMany({ where: { ondernemingId: o.id }, orderBy: { naam: "asc" } });
  return (
    <>
      <Kop titel="Producten en diensten" sub="Vaste regels die je met één klik op een factuur of offerte zet.">
        <Link href="/app/facturen/nieuw" className="knop-licht">Naar nieuwe factuur</Link>
      </Kop>
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div>
          {producten.length === 0 ? (
            <Leeg tekst="Nog geen producten. Begin met wat je het vaakst factureert, bijvoorbeeld een uurtarief, een dagtarief of een onderhoudspakket." />
          ) : (
            <div className="kaart overflow-x-auto">
              <table className="tabel">
                <thead><tr><th>Naam</th><th className="num">Prijs zonder btw</th><th>Btw</th><th>Per</th><th></th></tr></thead>
                <tbody>
                  {producten.map((p) => (
                    <tr key={p.id}>
                      <td><span className="font-medium">{p.naam}</span>{p.omschrijving && <span className="block text-[14px] text-tekst-3">{p.omschrijving}</span>}</td>
                      <td className="num">{euro(p.prijs)}</td>
                      <td>{p.btw}%</td>
                      <td>{p.eenheid}</td>
                      <td className="num"><form action={productVerwijderen}><input type="hidden" name="id" value={p.id} /><button className="knop-tekst text-[14px]">Verwijderen</button></form></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Kaart titel="Nieuw product" className="self-start">
          <form action={productOpslaan} className="space-y-3 px-5 py-4">
            <div><label className="lbl" htmlFor="naam">Naam</label><input id="naam" name="naam" placeholder="Bijvoorbeeld Uurtarief" required className={veld} /></div>
            <div><label className="lbl" htmlFor="omschrijving">Omschrijving (mag leeg)</label><input id="omschrijving" name="omschrijving" className={veld} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="lbl" htmlFor="prijs">Prijs</label><input id="prijs" name="prijs" placeholder="0,00" inputMode="decimal" className={veld} /></div>
              <div><label className="lbl" htmlFor="btw">Btw</label><select id="btw" name="btw" defaultValue={21} className={veld}><option value={21}>21%</option><option value={9}>9%</option><option value={0}>0%</option></select></div>
              <div><label className="lbl" htmlFor="eenheid">Per</label><select id="eenheid" name="eenheid" defaultValue="stuk" className={veld}>{["stuk", "uur", "dag", "km", "maand"].map((e) => <option key={e}>{e}</option>)}</select></div>
            </div>
            <button className={knop}>Product opslaan</button>
          </form>
        </Kaart>
      </div>
    </>
  );
}
