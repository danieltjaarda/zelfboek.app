import { NextResponse } from "next/server";
import { huidigeSessie } from "@/lib/auth";
import { db } from "@/lib/db";
import { rondAutorisatieAf, syncPsd2 } from "@/lib/bank/enablebanking";

/** Terugkeer van de bank na PSD2-toestemming: ?code=...&state=<ondernemingId>. */
export async function GET(req: Request) {
  const basis = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const ondernemingId = url.searchParams.get("state");
  const fout = url.searchParams.get("error") ?? url.searchParams.get("error_description");
  const terug = (q: string) => NextResponse.redirect(`${basis}/app/koppelingen?${q}`, 303);

  const sessie = await huidigeSessie();
  if (!sessie) return NextResponse.redirect(`${basis}/login`, 303);
  if (fout) return terug(`fout=${encodeURIComponent(`Bank weigerde: ${fout}`)}`);
  if (!code || !ondernemingId) return terug(`fout=${encodeURIComponent("Geen autorisatiecode ontvangen van de bank.")}`);

  const lid = await db.lidmaatschap.findUnique({ where: { gebruikerId_ondernemingId: { gebruikerId: sessie.gebruikerId, ondernemingId } } });
  if (!lid) return terug(`fout=${encodeURIComponent("Geen toegang tot deze onderneming.")}`);

  try {
    const aantal = await rondAutorisatieAf(ondernemingId, code);
    const r = await syncPsd2(ondernemingId, new Date(Date.now() - 90 * 864e5));
    const extra = r.fouten.length ? ` Let op: ${r.fouten.join(" | ")}` : "";
    return terug(`m=${encodeURIComponent(`${aantal} rekening(en) gekoppeld, ${r.nieuw} regels opgehaald.${extra}`)}`);
  } catch (e) {
    return terug(`fout=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`);
  }
}
