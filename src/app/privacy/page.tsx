import Link from "next/link";
import { MERK } from "@/lib/merk";
import { Woordmerk } from "@/components/Merk";
import { Voettekst } from "@/components/Voettekst";

export const instant = false;

export default function Privacy() {
  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><Link href="/"><Woordmerk /></Link><Link href="/login" className="knop knop-klein">Inloggen</Link></header>
      <article className="mx-auto max-w-2xl px-6 py-12 text-[16px] leading-relaxed text-tekst-2 [&_h1]:text-tekst [&_h2]:mt-8 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-tekst [&_p]:mt-3">
        <h1 className="display text-[36px] font-semibold">Privacy</h1>
        <p>{MERK} verwerkt je bankgegevens, bonnen, facturen en klantgegevens om je boekhouding te doen. Niet voor iets anders.</p>
        <h2>Wat we opslaan</h2>
        <p>Bankmutaties, bonnen, facturen, klanten, uren, kilometers en je bedrijfsgegevens. Sleutels van koppelingen worden versleuteld opgeslagen. Je bankkoppeling is alleen-lezen en loopt via een partij met een PSD2-vergunning.</p>
        <h2>Waar het staat</h2>
        <p>Op servers in de Europese Unie. Voor het boeken sturen we de omschrijving en het bedrag van een regel, of de inhoud van een bon, naar ons AI-model. Die gegevens worden niet gebruikt om het model te trainen.</p>
        <h2>Hoe lang</h2>
        <p>Zolang je een account hebt, plus de wettelijke bewaartermijn van zeven jaar voor je administratie. Stop je, dan exporteer je alles en verwijderen we je account op verzoek.</p>
        <h2 id="verwerker">Verwerkersovereenkomst</h2>
        <p>Als je {MERK} gebruikt, verwerken wij gegevens namens jou. De verwerkersovereenkomst is onderdeel van de voorwaarden en op verzoek als los document beschikbaar.</p>
        <h2>Vragen</h2>
        <p>Mail naar hallo@zelfboek.nl.</p>
      </article>
      <Voettekst />
    </main>
  );
}
