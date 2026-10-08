import Link from "next/link";
import { controleerHandtekening, verwerkAntwoord } from "@/lib/vragenmail";
import { euro } from "@/lib/btw";
import { Woordmerk } from "@/components/Merk";

export const instant = false;

/** Landingspagina van de knoppen in de vragenmail. Geen login nodig: de link is ondertekend. */
export default async function Antwoord({ searchParams }: { searchParams: Promise<{ t?: string; k?: string; s?: string }> }) {
  const { t, k, s } = await searchParams;
  const geldig = t && (k === "zakelijk" || k === "prive") && s && controleerHandtekening(t, k, s);
  const regel = geldig ? await verwerkAntwoord(t, k as "zakelijk" | "prive") : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Woordmerk />
      {regel ? (
        <>
          <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-groen-licht">
            <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="var(--groen)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="display mt-5 text-[32px] font-semibold">Geboekt als {k === "zakelijk" ? "zakelijk" : "privé"}</h1>
          <p className="mt-2 text-[16px] text-tekst-2">{regel.tegenpartij}, {euro(Math.abs(regel.bedrag))}. De bot onthoudt dit voor de volgende keer.</p>
        </>
      ) : (
        <>
          <h1 className="display mt-8 text-[32px] font-semibold">Deze link werkt niet meer</h1>
          <p className="mt-2 max-w-sm text-[16px] text-tekst-2">Misschien is de vraag al beantwoord. Je vindt alle open vragen in je overzicht.</p>
        </>
      )}
      <Link href="/app" className="knop mt-8">Naar mijn overzicht</Link>
    </main>
  );
}
