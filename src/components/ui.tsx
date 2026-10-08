import { euro } from "@/lib/btw";

/** Paginakop: titel links, acties rechts. Subregel alleen als die iets toevoegt. */
export function Kop({ titel, sub, children }: { titel: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight">{titel}</h1>
        {sub && <p className="mt-1 text-sm text-tekst-2">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/** Een cijfer met label. Gebruik ze in een rij met `Cijferband`, niet als losse kaartjes. */
export function Tegel({ label, waarde, hint, accent }: { label: string; waarde: number | string; hint?: string; accent?: "groen" | "rood" | "geel" }) {
  const kleur = accent === "groen" ? "text-groen-tekst" : accent === "rood" ? "text-rood-tekst" : accent === "geel" ? "text-mosterd-tekst" : "text-tekst";
  return (
    <div className="min-w-0 px-5 py-4">
      <p className="text-[14px] text-tekst-2">{label}</p>
      <p className={`cijfer mt-1 text-[24px] font-semibold leading-tight ${kleur}`}>{typeof waarde === "number" ? euro(waarde) : waarde}</p>
      {hint && <p className="mt-0.5 text-[14px] text-tekst-3">{hint}</p>}
    </div>
  );
}

/** Rij van Tegels gescheiden door dunne lijnen. */
export function Cijferband({ children }: { children: React.ReactNode }) {
  return (
    <div className="kaart grid grid-cols-2 divide-y divide-lijn sm:grid-cols-3 sm:divide-x sm:divide-y-0 [&>*]:border-lijn">
      {children}
    </div>
  );
}

export function Kaart({ titel, actie, children, className = "" }: { titel?: string; actie?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`kaart ${className}`}>
      {(titel || actie) && (
        <header className="flex items-center justify-between gap-3 border-b border-lijn px-5 py-3.5">
          {titel && <h2 className="text-[15px] font-semibold">{titel}</h2>}
          {actie}
        </header>
      )}
      {children}
    </section>
  );
}

export function Pil({ kleur, children }: { kleur: "groen" | "geel" | "rood" | "grijs"; children: React.ReactNode }) {
  return <span className={`pil pil-${kleur}`}>{children}</span>;
}

export function Melding({ r }: { r?: { ok: boolean; melding?: string; fout?: string } | null }) {
  if (!r) return null;
  return (
    <p className={`rounded-lg px-4 py-3 text-sm ${r.ok ? "bg-groen-licht text-groen-tekst" : "bg-rood-licht text-rood-tekst"}`}>
      {r.ok ? r.melding : r.fout}
    </p>
  );
}

/** Lege staat: zeg wat de volgende stap is. */
export function Leeg({ tekst, actie }: { tekst: string; actie?: React.ReactNode }) {
  return (
    <div className="kaart flex flex-col items-center gap-3 border-dashed px-6 py-12 text-center">
      <p className="max-w-sm text-sm text-tekst-2">{tekst}</p>
      {actie}
    </div>
  );
}

export const knop = "knop";
export const knopGroen = "knop knop-groen";
export const knopLicht = "knop-licht";
export const knopTekst = "knop-tekst";
export const veld = "veld";
