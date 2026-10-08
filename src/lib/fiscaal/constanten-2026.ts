/**
 * Fiscale constanten belastingjaar 2026 voor een eenmanszaak (IB-ondernemer, jonger dan AOW-leeftijd).
 * Gecontroleerd op 08-10-2026 via:
 * - Zelfstandigenaftrek € 1.200, startersaftrek € 2.123, MKB-winstvrijstelling 12,7%:
 *   rabobank.nl (zelfstandigenaftrek-en-startersaftrek-zo-zit-dat), mkbservicedesk.nl (startersaftrek), knab.nl (mkb-winstvrijstelling)
 * - Box 1 schijven en tarieven, heffingskortingen: kvk.nl/geldzaken/belastingtarieven-2026, bridgefund.nl/belastingschijven-box-1
 * - KIA-tabel: belastingdienst.nl (kleinschaligheidsinvesteringsaftrek 2026), Wet IB 2001 art. 3.41
 * - Zvw 4,85%, maximum bijdrage-inkomen € 79.409: taxence.nl, rendement.nl
 * Deze bedragen zijn een indicatie; de aanslag van de Belastingdienst is leidend.
 */
export const JAAR = 2026;

export const ZELFSTANDIGENAFTREK = 1200;
export const STARTERSAFTREK = 2123;
export const MKB_WINSTVRIJSTELLING = 0.127;
export const URENCRITERIUM = 1225;

/** Ondernemersaftrek en MKB-vrijstelling zijn in 2026 nog maar aftrekbaar tegen het tarief van de eerste schijf (37,56% effectief max). */
export const AFTREKBEPERKING_TARIEF = 0.3756;

export const BOX1_SCHIJVEN: { tot: number | null; tarief: number }[] = [
  { tot: 38883, tarief: 0.357 },
  { tot: 79137, tarief: 0.3756 },
  { tot: null, tarief: 0.495 },
];

export const ALGEMENE_HEFFINGSKORTING = {
  maximum: 3115,
  afbouwVanaf: 29736,
  afbouwPercentage: 0.06398,
};

/** Arbeidskorting 2026: opbouw in trappen, daarna afbouw. */
export const ARBEIDSKORTING = {
  trappen: [
    { tot: 11965, vast: 0, pct: 0.08324 },
    { tot: 25845, vast: 996, pct: 0.31009 },
    { tot: 45592, vast: 5300, pct: 0.0195 },
  ],
  maximum: 5712,
  afbouwVanaf: 45593,
  afbouwPercentage: 0.0651,
  nulVanaf: 132921,
};

export const ZVW = {
  percentage: 0.0485,
  maximumInkomen: 79409,
};

/** KIA 2026 (Belastingdienst). Bedrijfsmiddelen tellen mee vanaf € 450 ex btw. */
export const KIA = {
  minimumPerMiddel: 450,
  drempel: 2900,
  pctTot: 71683,
  pct: 0.28,
  vastBedrag: 20072,
  vastTot: 132746,
  afbouwPct: 0.0756,
  nulVanaf: 398236,
};

export const KOR_GRENS = 20000;
export const KM_VERGOEDING = 0.23;
export const INVESTERINGSGRENS = 450;

/** Wettelijke rente voor handelstransacties (H2 2026, indicatie) en WIK-staffel incassokosten. */
export const WETTELIJKE_HANDELSRENTE = 0.1025;
