"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Woordmerk } from "@/components/Merk";
import { Icoon, type IcoonNaam } from "@/components/Iconen";

const STAPPEN: { icoon: IcoonNaam; titel: string; tekst: string }[] = [
  { icoon: "instel", titel: "Personaliseren", tekst: "Je onderneming, nummering en voorkeuren instellen" },
  { icoon: "bank", titel: "Gegevens ophalen", tekst: "Bankkoppelingen en verkoopkanalen klaarzetten" },
  { icoon: "btw", titel: "Btw-regels laden", tekst: "Tarieven, rubrieken en deadlines van dit jaar" },
  { icoon: "bot", titel: "De bot inwerken", tekst: "Hij leert je categorieën en gewoontes kennen" },
  { icoon: "overzicht", titel: "Overzicht opbouwen", tekst: "Je dashboard, eerste stappen en voorbeelden" },
];
const TEMPO = 1000;

/** Stappen lichten één voor één op; daarna automatisch door naar het overzicht. */
export function Welkom({ naam }: { naam: string }) {
  const router = useRouter();
  const [klaar, setKlaar] = useState(0);
  const alles = klaar >= STAPPEN.length;

  useEffect(() => { router.prefetch("/app"); }, [router]);
  useEffect(() => {
    const t = setTimeout(() => (alles ? router.push("/app") : setKlaar((k) => k + 1)), alles ? 1300 : TEMPO);
    return () => clearTimeout(t);
  }, [klaar, alles, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Woordmerk size={18} />
      <section className="kaart mt-8 w-full max-w-md p-7" aria-live="polite">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">{alles ? "Klaar. Je overzicht staat voor je." : "We maken je administratie klaar"}</h1>
        <p className="mt-1 text-sm text-tekst-2">{naam === "Mijn onderneming" ? "Een paar seconden, daarna kun je meteen aan de slag." : `${naam} is zo klaar voor gebruik.`}</p>

        <ol className="mt-6 space-y-3">
          {STAPPEN.map((s, i) => {
            const af = i < klaar;
            const bezig = i === klaar;
            if (i > klaar) return <li key={s.titel} className="flex h-11 items-center gap-4 opacity-0" aria-hidden />;
            return (
              <li key={s.titel} className="welkom-stap flex items-center gap-4">
                <span className={`welkom-icoon relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${af ? "bg-groen text-white" : "welkom-bezig bg-primair-licht text-primair"}`}>
                  {af ? (
                    <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <Icoon naam={s.icoon} size={20} />
                  )}
                  {bezig && <span className="absolute inset-[-3px] animate-spin rounded-full border-2 border-primair border-t-transparent" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{s.titel}</span>
                  <span className="block text-[13px] text-tekst-2">{s.tekst}</span>
                </span>
                <span className={`text-[12px] font-semibold ${af ? "text-groen-tekst" : "text-primair-tekst"}`}>{af ? "Klaar" : "Bezig"}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-lijn" role="progressbar" aria-valuenow={klaar} aria-valuemin={0} aria-valuemax={STAPPEN.length}>
          <div className="h-full rounded-full bg-primair transition-[width] duration-700 ease-out" style={{ width: `${(klaar / STAPPEN.length) * 100}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[13px] text-tekst-3">{Math.min(klaar, STAPPEN.length)} van {STAPPEN.length}</span>
          <Link href="/app" className={alles ? "knop knop-klein" : "knop-tekst knop-klein"}>{alles ? "Naar mijn overzicht" : "Overslaan"}</Link>
        </div>
      </section>
    </main>
  );
}
