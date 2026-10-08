import Link from "next/link";
import { db, huidigeOnderneming } from "@/lib/db";
import { datumNl, euro } from "@/lib/btw";
import { hernoemRekening } from "@/lib/acties-bank";
import { Kop, Leeg, knopLicht, veld } from "@/components/ui";

export const instant = false;

const bronLabel: Record<string, string> = { csv: "CSV-upload", mt940: "MT940-upload", camt: "CAMT-upload", psd2: "Automatisch (bankkoppeling)", kanaal: "Verkoopkanaal" };

export default async function Rekeningen() {
  const o = await huidigeOnderneming();
  const rekeningen = await db.bankrekening.findMany({
    where: { ondernemingId: o.id },
    orderBy: { naam: "asc" },
    include: { _count: { select: { transacties: true } } },
  });
  const nu = new Date();

  return (
    <>
      <Kop titel="Bankrekeningen" sub="Elke rekening die je hebt geüpload of gekoppeld.">
        <Link href="/app/koppelingen" className={knopLicht}>Bank koppelen</Link>
      </Kop>
      {rekeningen.length === 0 ? (
        <Leeg tekst="Nog geen rekeningen. Koppel je bank of upload een bankbestand." actie={<Link href="/app/bank" className="knop knop-klein">Naar Bank</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rekeningen.map((r) => (
            <section key={r.id} className="kaart p-5">
              <form action={hernoemRekening} className="flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="naam" defaultValue={r.naam} aria-label="Naam van de rekening" className={veld} />
                <button className={knopLicht}>Opslaan</button>
              </form>
              <p className="mt-3 text-sm text-tekst-2">{r.iban}</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
                <dt className="text-tekst-2">Bank</dt><dd>{r.bank ?? "–"}</dd>
                <dt className="text-tekst-2">Bron</dt><dd>{bronLabel[r.bron] ?? r.bron}</dd>
                <dt className="text-tekst-2">Saldo</dt><dd className="tabular">{r.saldo != null ? euro(r.saldo) : "onbekend"}</dd>
                <dt className="text-tekst-2">Regels</dt><dd className="tabular">{r._count.transacties}</dd>
                <dt className="text-tekst-2">Laatst bijgewerkt</dt><dd>{r.laatsteSync ? datumNl(r.laatsteSync) : "nooit"}</dd>
                {r.psd2Verloopt && (
                  <><dt className="text-tekst-2">Toestemming bank</dt><dd className={r.psd2Verloopt < nu ? "text-rood-tekst" : ""}>{r.psd2Verloopt < nu ? "verlopen, koppel opnieuw" : `geldig tot ${datumNl(r.psd2Verloopt)}`}</dd></>
                )}
              </dl>
              <Link href={`/app/bank?rekening=${r.id}`} className="mt-4 inline-block text-sm text-primair-tekst underline">Bekijk de regels</Link>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
