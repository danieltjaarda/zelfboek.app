"use client";

import { useActionState } from "react";
import { Melding, knop, knopLicht } from "@/components/ui";

type Resultaat = { ok: true; melding: string; id?: string } | { ok: false; fout: string };

/** Knop die een server action met Resultaat uitvoert en de melding toont. */
export function ActieKnop({ actie, id, label, extra, primair, stil }: { actie: (fd: FormData) => Promise<Resultaat>; id: string; label: string; extra?: Record<string, string>; primair?: boolean; stil?: boolean }) {
  const [staat, verstuur, bezig] = useActionState(async (_v: Resultaat | null, fd: FormData) => actie(fd), null);
  return (
    <form action={verstuur} className="inline-flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button disabled={bezig} className={primair ? knop : stil ? "knop-tekst" : knopLicht}>{bezig ? "Bezig..." : label}</button>
      <Melding r={staat} />
    </form>
  );
}
