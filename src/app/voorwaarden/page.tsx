import Link from "next/link";
import { MERK, PRIJS } from "@/lib/merk";
import { Woordmerk } from "@/components/Merk";
import { Voettekst } from "@/components/Voettekst";

export const instant = false;

export default function Voorwaarden() {
  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><Link href="/"><Woordmerk /></Link><Link href="/login" className="knop knop-klein">Inloggen</Link></header>
      <article className="mx-auto max-w-2xl px-6 py-12 text-[16px] leading-relaxed text-tekst-2 [&_h1]:text-tekst [&_h2]:mt-8 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-tekst [&_p]:mt-3">
        <h1 className="display text-[36px] font-semibold">Voorwaarden</h1>
        <h2>Wat {MERK} is</h2>
        <p>Software die je boekhouding bijhoudt met behulp van AI. {MERK} is geen boekhouder, geen accountant en geen belastingadviseur. Jij blijft verantwoordelijk voor je administratie en je aangiften.</p>
        <h2>Abonnement</h2>
        <p>De eerste 30 dagen zijn gratis. Daarna € {PRIJS} per maand, exclusief btw, maandelijks opzegbaar via Instellingen. Je betaalt vooraf per maand.</p>
        <h2>Jouw verplichtingen</h2>
        <p>Je controleert de boekingen waar de bot om vraagt, bewaart je bonnen en dient je aangiften zelf en op tijd in. Wij zetten alles klaar, maar wij dienen niet in.</p>
        <h2>Aansprakelijkheid</h2>
        <p>We doen ons best om alles juist te boeken en geven bij elke boeking uitleg en een zekerheidsscore. Voor boetes of rente door onjuiste of te late aangiften zijn wij niet aansprakelijk, tenzij sprake is van opzet of grove nalatigheid van onze kant. Onze aansprakelijkheid is beperkt tot het bedrag dat je in de laatste twaalf maanden hebt betaald.</p>
        <h2>Je data</h2>
        <p>Je data is van jou. Je kunt op elk moment alles exporteren als Excel of auditfile. Stop je, dan bewaren we je gegevens nog dertig dagen en verwijderen we ze daarna op verzoek.</p>
        <h2>Wijzigingen</h2>
        <p>Veranderen we iets aan de voorwaarden of de prijs, dan hoor je dat minstens dertig dagen van tevoren per e-mail.</p>
      </article>
      <Voettekst />
    </main>
  );
}
