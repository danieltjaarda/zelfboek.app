import Link from "next/link";
import { Woordmerk } from "@/components/Merk";

export default function NietGevonden() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <Woordmerk />
      <h1 className="display mt-8 text-[36px] font-semibold">Deze pagina bestaat niet</h1>
      <p className="mt-2 max-w-sm text-[16px] text-tekst-2">Misschien is de link verouderd. Ga terug naar je overzicht of naar de startpagina.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/app" className="knop">Naar mijn overzicht</Link>
        <Link href="/" className="knop-licht">Startpagina</Link>
      </div>
    </main>
  );
}
