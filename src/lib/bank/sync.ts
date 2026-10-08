import { db } from "@/lib/db";
import { syncPsd2 } from "./enablebanking";
import * as mollie from "@/lib/kanalen/mollie";
import * as stripe from "@/lib/kanalen/stripe";
import * as shopify from "@/lib/kanalen/shopify";
import * as bol from "@/lib/kanalen/bol";
import * as woocommerce from "@/lib/kanalen/woocommerce";
import * as paypal from "@/lib/kanalen/paypal";
import type { KanaalUitkomst } from "@/lib/kanalen/basis";

export const KANALEN = { mollie, stripe, shopify, bol, woocommerce, paypal } as const;
export type Kanaal = keyof typeof KANALEN;

/**
 * Alle gekoppelde bronnen van een onderneming ophalen: PSD2-bank plus verkoopkanalen.
 * Vast contract voor de cron (module D): { nieuw, fouten }.
 */
export async function syncAlleBanken(ondernemingId: string): Promise<{ nieuw: number; fouten: string[] }> {
  const koppelingen = await db.koppeling.findMany({ where: { ondernemingId, status: { not: "uitgeschakeld" } } });
  let nieuw = 0;
  const fouten: string[] = [];

  if (koppelingen.some((k) => k.soort === "enablebanking")) {
    const r = await syncPsd2(ondernemingId);
    nieuw += r.nieuw;
    fouten.push(...r.fouten.map((f) => `Bank: ${f}`));
  }
  for (const k of koppelingen) {
    if (!(k.soort in KANALEN)) continue;
    const vanaf = k.laatsteSync ? new Date(k.laatsteSync.getTime() - 3 * 864e5) : new Date(Date.now() - 365 * 864e5);
    const r: KanaalUitkomst = await KANALEN[k.soort as Kanaal].haalTransacties(ondernemingId, vanaf);
    nieuw += r.nieuw;
    fouten.push(...r.fouten.map((f) => `${k.soort}: ${f}`));
  }
  return { nieuw, fouten };
}

export async function syncEenBron(ondernemingId: string, soort: string): Promise<{ nieuw: number; fouten: string[] }> {
  if (soort === "enablebanking") return syncPsd2(ondernemingId);
  if (soort in KANALEN) return KANALEN[soort as Kanaal].haalTransacties(ondernemingId, new Date(Date.now() - 365 * 864e5));
  return { nieuw: 0, fouten: [`Onbekende bron: ${soort}`] };
}
