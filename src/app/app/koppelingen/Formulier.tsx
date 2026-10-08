"use client";

import { useActionState } from "react";
import { Melding, knop, veld } from "@/components/ui";
import type { Resultaat } from "@/lib/acties-bank";

export type Veld = { naam: string; label: string; type?: "text" | "password" | "textarea"; hint?: string };

/** Formulier dat een server-actie met Resultaat aanroept en de melding toont. */
export function ResultaatFormulier({
  actie, velden, verborgen, knopTekst, bezigTekst = "Bezig", children, licht,
}: {
  actie: (fd: FormData) => Promise<Resultaat>;
  velden?: Veld[];
  verborgen?: Record<string, string>;
  knopTekst: string;
  bezigTekst?: string;
  children?: React.ReactNode;
  licht?: boolean;
}) {
  const [staat, verstuur, bezig] = useActionState(async (_v: Resultaat | null, fd: FormData) => actie(fd), null);
  return (
    <form action={verstuur} className="space-y-3">
      {Object.entries(verborgen ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {velden?.map((v) => (
        <div key={v.naam}>
          <label className="lbl" htmlFor={`veld-${v.naam}`}>{v.label}</label>
          {v.type === "textarea" ? (
            <textarea id={`veld-${v.naam}`} name={v.naam} rows={4} className={`${veld} font-mono text-[13px]`} />
          ) : (
            <input id={`veld-${v.naam}`} name={v.naam} type={v.type ?? "text"} autoComplete="off" className={veld} />
          )}
          {v.hint && <p className="mt-1 text-[13px] text-tekst-3">{v.hint}</p>}
        </div>
      ))}
      {children}
      <button type="submit" disabled={bezig} className={licht ? "knop-licht" : knop}>{bezig ? bezigTekst : knopTekst}</button>
      <Melding r={staat} />
    </form>
  );
}
