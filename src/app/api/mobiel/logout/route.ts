import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { route, sessieUitRequest } from "@/lib/mobiel";

export const POST = route(async (req: Request) => {
  const s = await sessieUitRequest(req);
  await db.sessie.delete({ where: { id: s.id } }).catch(() => undefined);
  return NextResponse.json({ ok: true });
});
