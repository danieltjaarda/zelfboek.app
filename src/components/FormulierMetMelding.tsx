"use client";

import { useActionState } from "react";
import { Melding, knop } from "./ui";

type Resultaat = { ok: true; melding: string } | { ok: false; fout: string };

/** Formulier rond een server action die een Resultaat teruggeeft; toont de melding eronder. */
export function FormulierMetMelding({ actie, knopTekst, children, className, gevaarlijk }: {
  actie: (fd: FormData) => Promise<Resultaat>;
  knopTekst: string;
  children?: React.ReactNode;
  className?: string;
  gevaarlijk?: boolean;
}) {
  const [staat, verstuur, bezig] = useActionState(async (_v: Resultaat | null, fd: FormData) => actie(fd), null);
  return (
    <form action={verstuur} className={className ?? "space-y-4"}>
      {children}
      <button disabled={bezig} className={gevaarlijk ? "knop-rood" : knop}>{bezig ? "Bezig" : knopTekst}</button>
      <Melding r={staat} />
    </form>
  );
}
