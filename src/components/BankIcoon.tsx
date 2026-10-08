/** App-icoon van een bank, herkend aan de bankcode in de IBAN of aan de naam. Bestanden in public/logos/apps. */
const BANKEN: Record<string, { naam: string; code: string }> = {
  ing: { naam: "ING", code: "INGB" },
  revolut: { naam: "Revolut", code: "REVO" },
  abnamro: { naam: "ABN AMRO", code: "ABNA" },
  rabobank: { naam: "Rabobank", code: "RABO" },
  bunq: { naam: "bunq", code: "BUNQ" },
  knab: { naam: "Knab", code: "KNAB" },
  triodos: { naam: "Triodos", code: "TRIO" },
  sns: { naam: "SNS", code: "SNSB" },
  asn: { naam: "ASN", code: "ASNB" },
  regiobank: { naam: "RegioBank", code: "RBRB" },
  n26: { naam: "N26", code: "NTSB" },
};

export function bankId(bank?: string | null, iban?: string | null): keyof typeof BANKEN | null {
  const code = (iban ?? "").replace(/\s/g, "").slice(4, 8).toUpperCase();
  for (const [id, b] of Object.entries(BANKEN)) if (code && b.code === code) return id;
  const naam = (bank ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!naam) return null;
  for (const [id, b] of Object.entries(BANKEN)) if (naam === id || naam === b.naam.toLowerCase().replace(/[^a-z0-9]/g, "")) return id;
  return null;
}

export function BankIcoon({ bank, iban, size = 36, className = "" }: { bank?: string | null; iban?: string | null; size?: number; className?: string }) {
  const id = bankId(bank, iban);
  const stijl = { width: size, height: size, borderRadius: Math.round(size * 0.22) };
  if (!id) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center border border-lijn bg-papier text-tekst-3 ${className}`} style={stijl} aria-hidden>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l9-6 9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20h18" /></svg>
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/logos/apps/${id}.png`} alt={BANKEN[id].naam} width={size} height={size} className={`shrink-0 ${className}`} style={stijl} loading="lazy" />;
}

/** Grijs documentvakje voor een factuur in dezelfde maat als een bankicoon. */
export function DocumentIcoon({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center border border-lijn bg-papier text-tekst-2" style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }} aria-hidden>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /><path d="M9 12h6M9 16h6" /></svg>
    </span>
  );
}
