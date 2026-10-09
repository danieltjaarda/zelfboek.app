import { rond } from "@/lib/btw";

export type FactuurRegel = {
  omschrijving: string;
  aantal: number;
  prijs: number; // ex btw
  btw: number; // percentage 21 | 9 | 0
  eenheid?: string;
};

export type Totalen = {
  subtotaal: number;
  btw: number;
  totaal: number;
  btwVerlegd: boolean;
  perTarief: { tarief: number; grondslag: number; btw: number }[];
};

export type KlantFiscaal = { land?: string | null; btwNummer?: string | null; isOndernemer?: boolean | null };
export type OndernemingFiscaal = { korDeelnemer?: boolean | null; land?: string | null };

export const EU = new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"]);

/** Btw verlegd: EU-ondernemer buiten NL met btw-nummer, of buiten de EU. */
export function isVerlegd(klant: KlantFiscaal | null | undefined): boolean {
  if (!klant) return false;
  const land = (klant.land ?? "NL").toUpperCase();
  if (land === "NL") return false;
  if (!EU.has(land)) return true;
  return Boolean(klant.btwNummer && klant.isOndernemer !== false);
}

export function berekenTotalen(regels: FactuurRegel[], klant?: KlantFiscaal | null, onderneming?: OndernemingFiscaal | null): Totalen {
  const verlegd = isVerlegd(klant);
  const kor = Boolean(onderneming?.korDeelnemer);
  const perTariefMap = new Map<number, { grondslag: number; btw: number }>();
  let subtotaal = 0;
  for (const r of regels) {
    const grondslag = rond((Number(r.aantal) || 0) * (Number(r.prijs) || 0));
    const tarief = verlegd || kor ? 0 : Number(r.btw) || 0;
    const btw = rond(grondslag * (tarief / 100));
    subtotaal += grondslag;
    const cur = perTariefMap.get(tarief) ?? { grondslag: 0, btw: 0 };
    cur.grondslag += grondslag;
    cur.btw += btw;
    perTariefMap.set(tarief, cur);
  }
  const perTarief = [...perTariefMap.entries()]
    .map(([tarief, v]) => ({ tarief, grondslag: rond(v.grondslag), btw: rond(v.btw) }))
    .sort((a, b) => b.tarief - a.tarief);
  const btw = rond(perTarief.reduce((s, p) => s + p.btw, 0));
  subtotaal = rond(subtotaal);
  return { subtotaal, btw, totaal: rond(subtotaal + btw), btwVerlegd: verlegd, perTarief };
}

export function parseRegels(json: string): FactuurRegel[] {
  try {
    const x = JSON.parse(json);
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
}

/** Regels uit een FormData (oms0..omsN, aantal0, prijs0, btw0, eenheid0). */
export function regelsUitFormData(fd: FormData, max = 30): FactuurRegel[] {
  const uit: FactuurRegel[] = [];
  for (let i = 0; i < max; i++) {
    const oms = String(fd.get(`oms${i}`) ?? "").trim();
    if (!oms) continue;
    uit.push({
      omschrijving: oms,
      aantal: Number(String(fd.get(`aantal${i}`) ?? "1").replace(",", ".")) || 1,
      prijs: parseBedrag(String(fd.get(`prijs${i}`) ?? "0")),
      btw: Number(fd.get(`btw${i}`) ?? 21),
      eenheid: String(fd.get(`eenheid${i}`) ?? "").trim() || undefined,
    });
  }
  return uit;
}

/** "12,50", "12.50" en "1.250,00" worden allemaal 1250 of 12.5 zoals bedoeld. */
export function parseBedrag(tekst: string): number {
  const t = tekst.trim().replace(/\s/g, "").replace(/[^0-9.,-]/g, "");
  if (!t) return 0;
  const n = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t;
  return Number(n) || 0;
}
