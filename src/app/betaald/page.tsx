import { Woordmerk } from "@/components/Merk";

export const instant = false;

/** Landingspagina na een iDEAL-betaling via Mollie. De factuur zelf wordt via de webhook afgeboekt. */
export default async function Betaald({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Woordmerk />
      <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-groen-licht">
        <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="var(--groen)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <h1 className="display mt-5 text-[32px] font-semibold">Bedankt voor je betaling</h1>
      <p className="mt-2 max-w-sm text-[16px] text-tekst-2">
        {f ? `De betaling van factuur ${f} is ontvangen.` : "De betaling is ontvangen."} Is de betaling nog niet verwerkt, dan kan dat enkele minuten duren. Je kunt dit venster sluiten.
      </p>
    </main>
  );
}
