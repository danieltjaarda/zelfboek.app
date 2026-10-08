import { redirect } from "next/navigation";
import { huidigeOnderneming, huidigeSessie } from "@/lib/auth";
import { Welkom } from "@/components/Welkom";

export const instant = false;

/** Eerste keer ingelogd: korte animatie waarin de administratie wordt klaargezet, daarna door naar het overzicht. */
export default async function WelkomPagina() {
  if (!(await huidigeSessie())) redirect("/login");
  const o = await huidigeOnderneming();
  return <Welkom naam={o.naam} />;
}
