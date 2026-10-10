import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mobielContext, route, transactieJson } from "@/lib/mobiel";

const PER_PAGINA = 50;

/** Bankregels. ?filter=twijfel (vraagt bevestiging) | open (nog niet beoordeeld) | alle, ?pagina=1. */
export const GET = route(async (req: Request) => {
  const { onderneming: o } = await mobielContext(req);
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "alle";
  const pagina = Math.max(1, Number(url.searchParams.get("pagina") ?? 1) || 1);
  const where = {
    ondernemingId: o.id,
    ...(filter === "twijfel" ? { bevestigd: false, zakelijk: { not: null } } : filter === "open" ? { zakelijk: null } : {}),
  };
  const [regels, totaal] = await Promise.all([
    db.transactie.findMany({ where, orderBy: { datum: "desc" }, skip: (pagina - 1) * PER_PAGINA, take: PER_PAGINA }),
    db.transactie.count({ where }),
  ]);
  return NextResponse.json({ regels: regels.map(transactieJson), totaal, perPagina: PER_PAGINA });
});
