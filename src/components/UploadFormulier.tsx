"use client";

import { useActionState } from "react";
import { Melding, knop } from "./ui";
import { Bestandskiezer } from "./Bestandskiezer";
import type { Resultaat } from "@/lib/acties-bank";

type Props = {
  actie: (formData: FormData) => Promise<Resultaat>;
  accept: string;
  label: string;
  knopTekst: string;
  bezigTekst: string;
};

export function UploadFormulier({ actie, accept, label, knopTekst, bezigTekst }: Props) {
  const [staat, verstuur, bezig] = useActionState(
    async (_vorige: Resultaat | null, formData: FormData) => actie(formData),
    null,
  );
  return (
    <form action={verstuur} className="kaart space-y-3 p-5">
      <label className="lbl">{label}</label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><Bestandskiezer accept={accept} required /></div>
        <button type="submit" disabled={bezig} className={knop}>
          {bezig ? bezigTekst : knopTekst}
        </button>
      </div>
      <Melding r={staat} />
    </form>
  );
}
