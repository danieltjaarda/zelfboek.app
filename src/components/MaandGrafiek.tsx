import { euro } from "@/lib/btw";

export type Maandcijfer = { maand: string; label: string; omzet: number; kosten: number };

/** Omzet en kosten per maand, grouped bars, inline SVG. Twee vaste kleuren uit de gevalideerde palette (blauw, oranje). */
export function MaandGrafiek({ data }: { data: Maandcijfer[] }) {
  const B = 640, H = 220, padL = 56, padR = 12, padT = 12, padB = 28;
  const max = Math.max(1, ...data.flatMap((d) => [d.omzet, d.kosten]));
  const stapRaw = max / 4;
  const macht = Math.pow(10, Math.floor(Math.log10(stapRaw)));
  const stap = [1, 2, 2.5, 5, 10].map((m) => m * macht).find((s) => s >= stapRaw) ?? macht;
  const top = Math.ceil(max / stap) * stap;
  const breedteGroep = (B - padL - padR) / data.length;
  const barB = Math.max(4, Math.min(18, (breedteGroep - 10) / 2 - 1));
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top);
  const lijnen = Array.from({ length: Math.round(top / stap) + 1 }, (_, i) => i * stap);
  const kort = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

  return (
    <figure>
      <div className="mb-2 flex gap-4 text-[14px] text-stone-600">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#2a78d6" }} />Omzet</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#eb6834" }} />Kosten</span>
      </div>
      <svg viewBox={`0 0 ${B} ${H}`} className="w-full" role="img" aria-label="Omzet en kosten per maand, laatste 12 maanden">
        {lijnen.map((v) => (
          <g key={v}>
            <line x1={padL} x2={B - padR} y1={y(v)} y2={y(v)} stroke="#e7e5e4" strokeWidth={1} />
            <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill="#78716c">{kort(v)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x0 = padL + i * breedteGroep + (breedteGroep - 2 * barB - 2) / 2;
          const bar = (x: number, v: number, kleur: string, naam: string) => {
            const h = Math.max(0, y(0) - y(v));
            return (
              <g>
                <title>{`${d.label}: ${naam} ${euro(v)}`}</title>
                {h > 0 && <rect x={x} y={y(v)} width={barB} height={h} fill={kleur} rx={h > 4 ? 3 : 0} />}
                {h > 4 && <rect x={x} y={y(0) - 3} width={barB} height={3} fill={kleur} />}
              </g>
            );
          };
          return (
            <g key={d.maand}>
              {bar(x0, d.omzet, "#2a78d6", "omzet")}
              {bar(x0 + barB + 2, d.kosten, "#eb6834", "kosten")}
              <text x={padL + i * breedteGroep + breedteGroep / 2} y={H - 10} textAnchor="middle" fontSize={10} fill="#78716c">{d.label}</text>
            </g>
          );
        })}
        <line x1={padL} x2={B - padR} y1={y(0)} y2={y(0)} stroke="#a8a29e" strokeWidth={1} />
      </svg>
      <details className="mt-2 text-[14px] text-stone-500">
        <summary className="cursor-pointer">Als tabel</summary>
        <table className="mt-1 w-full"><tbody>{data.map((d) => <tr key={d.maand}><td>{d.label}</td><td className="text-right tabular-nums">{euro(d.omzet)}</td><td className="text-right tabular-nums">{euro(d.kosten)}</td></tr>)}</tbody></table>
      </details>
    </figure>
  );
}
