import { MERK } from "@/lib/merk";

/** Beeldmerk: een open boek dat zichzelf afvinkt. */
export function Beeldmerk({ size = 28, donker = false }: { size?: number; donker?: boolean }) {
  const kleur = donker ? "#ffffff" : "var(--inkt)";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="2" y="4" width="28" height="24" rx="6" fill={kleur} />
      <path d="M9 16.5l4.5 4.5L23 11.5" fill="none" stroke="var(--mosterd)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Woordmerk({ donker = false, size = 20 }: { donker?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Beeldmerk size={size + 8} donker={donker} />
      <span className="display font-semibold tracking-tight" style={{ fontSize: size, color: donker ? "#fff" : "var(--inkt)" }}>{MERK}</span>
    </span>
  );
}

/** Logo van een bank, kanaal of pakket. Bestand uit public/logos. */
const LOGOS: Record<string, { bestand: string; naam: string }> = {
  ing: { bestand: "ing.png", naam: "ING" },
  rabobank: { bestand: "rabobank.png", naam: "Rabobank" },
  abnamro: { bestand: "abnamro.svg", naam: "ABN AMRO" },
  bunq: { bestand: "bunq.svg", naam: "bunq" },
  knab: { bestand: "knab.svg", naam: "Knab" },
  sns: { bestand: "sns.png", naam: "SNS" },
  asn: { bestand: "asn.png", naam: "ASN Bank" },
  regiobank: { bestand: "regiobank.png", naam: "RegioBank" },
  triodos: { bestand: "triodos.png", naam: "Triodos" },
  revolut: { bestand: "revolut.svg", naam: "Revolut" },
  n26: { bestand: "n26.svg", naam: "N26" },
  mollie: { bestand: "mollie.png", naam: "Mollie" },
  stripe: { bestand: "stripe.svg", naam: "Stripe" },
  shopify: { bestand: "shopify.svg", naam: "Shopify" },
  bol: { bestand: "bol.svg", naam: "bol.com" },
  woocommerce: { bestand: "woocommerce.svg", naam: "WooCommerce" },
  paypal: { bestand: "paypal.svg", naam: "PayPal" },
  moneybird: { bestand: "moneybird.png", naam: "Moneybird" },
  eboekhouden: { bestand: "eboekhouden.png", naam: "e-Boekhouden" },
  jortt: { bestand: "jortt.png", naam: "Jortt" },
  ideal: { bestand: "ideal.svg", naam: "iDEAL" },
  peppol: { bestand: "peppol.png", naam: "Peppol" },
  belastingdienst: { bestand: "belastingdienst.png", naam: "Belastingdienst" },
};

export function Logo({ id, hoogte = 22, metNaam = true, className = "" }: { id: keyof typeof LOGOS; hoogte?: number; metNaam?: boolean; className?: string }) {
  const l = LOGOS[id];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} title={l.naam}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/logos/${l.bestand}`} alt={metNaam ? "" : l.naam} height={hoogte} style={{ height: hoogte, width: "auto", maxWidth: hoogte * 3.2, borderRadius: l.bestand.endsWith(".png") ? 5 : 0 }} loading="lazy" />
      {metNaam && <span className="text-[14px] font-medium">{l.naam}</span>}
    </span>
  );
}

export type LogoId = keyof typeof LOGOS;
