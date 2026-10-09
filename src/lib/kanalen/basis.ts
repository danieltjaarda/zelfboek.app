import { db } from "@/lib/db";
import { leesKoppeling, koppelingStatus, type KoppelingSoort } from "@/lib/koppelingen";
import { btwUitInclusief } from "@/lib/btw";
import { maakHash } from "@/lib/bank/csv";

export type KanaalRegel = {
  datum: Date;
  bedrag: number;            // positief = uitbetaling/omzet, negatief = kosten
  tegenpartij: string;
  omschrijving: string;
  externId: string;
  categorie: "omzet" | "betaalprovider" | "klant_terugbetaling" | "overige_opbrengst";
  btwCode: "21" | "9" | "0" | "geen" | "eu_dienst" | "vrijgesteld";
};

export type KanaalUitkomst = { nieuw: number; fouten: string[] };

export async function kanaalConfig<T extends Record<string, string>>(ondernemingId: string, soort: KoppelingSoort, verplicht: (keyof T)[], hulp: string): Promise<T> {
  const k = await leesKoppeling<T>(ondernemingId, soort);
  if (!k) throw new Error(`${hulp} is niet gekoppeld. Voeg de sleutel toe bij Koppelingen.`);
  for (const v of verplicht) if (!k[v]) throw new Error(`${hulp}: veld "${String(v)}" ontbreekt in de koppeling.`);
  return k;
}

/**
 * Kanaalregels opslaan als Transactie (bron = kanaal). Omzet-uitbetalingen staan al vast op categorie,
 * dus de AI hoeft ze niet te beoordelen: zakelijk true, bevestigd true.
 */
export async function bewaarKanaalRegels(ondernemingId: string, bron: KoppelingSoort, regels: KanaalRegel[]): Promise<number> {
  let nieuw = 0;
  for (const r of regels) {
    const hash = maakHash(r.datum, r.bedrag, r.tegenpartij, r.omschrijving, `${bron}:${r.externId}`);
    const btwBedrag = r.btwCode === "21" || r.btwCode === "9" ? btwUitInclusief(Math.abs(r.bedrag), r.btwCode) : 0;
    const res = await db.transactie
      .createMany({
        data: [{
          ondernemingId, datum: r.datum, bedrag: r.bedrag, tegenpartij: r.tegenpartij, omschrijving: r.omschrijving, hash,
          bron, externId: r.externId, categorie: r.categorie, btwCode: r.btwCode, btwBedrag,
          zakelijk: true, zekerheid: 1, bevestigd: true, uitleg: `Automatisch uit ${bron}`,
        }],
      })
      .catch((e: unknown) => { if ((e as { code?: string })?.code === "P2002") return { count: 0 }; throw e; });
    nieuw += res.count;
  }
  return nieuw;
}

export async function voerKanaalUit(ondernemingId: string, soort: KoppelingSoort, werk: () => Promise<number>): Promise<KanaalUitkomst> {
  try {
    const nieuw = await werk();
    await koppelingStatus(ondernemingId, soort, "actief");
    return { nieuw, fouten: [] };
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    await koppelingStatus(ondernemingId, soort, "fout", m).catch(() => undefined);
    return { nieuw: 0, fouten: [m] };
  }
}

export async function haalJson<T>(url: string, init?: RequestInit, dienst = "API"): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    if (r.status === 401 || r.status === 403) throw new Error(`${dienst}: sleutel ongeldig of onvoldoende rechten (${r.status}).`);
    throw new Error(`${dienst} ${r.status}: ${t.slice(0, 160) || r.statusText}`);
  }
  return (await r.json()) as T;
}

export const isoDag = (d: Date) => d.toISOString().slice(0, 10);
