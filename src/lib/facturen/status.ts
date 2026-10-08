/** Kleur van de statuspil: groen = klaar, geel = wacht op reactie, rood = aandacht, grijs = neutraal. */
export const statusPil: Record<string, "groen" | "geel" | "rood" | "grijs"> = {
  concept: "grijs",
  verzonden: "grijs",
  herinnerd: "geel",
  aangemaand: "rood",
  betaald: "groen",
  oninbaar: "rood",
  gecrediteerd: "grijs",
  geaccepteerd: "groen",
  afgewezen: "rood",
  verlopen: "grijs",
  gefactureerd: "groen",
  actief: "groen",
  gestopt: "grijs",
};

/** Leesbare naam van een status, in zinnen. */
export const statusTekst: Record<string, string> = {
  concept: "Concept",
  verzonden: "Open",
  herinnerd: "Herinnerd",
  aangemaand: "Aangemaand",
  betaald: "Betaald",
  oninbaar: "Oninbaar",
  gecrediteerd: "Gecrediteerd",
  geaccepteerd: "Geaccepteerd",
  afgewezen: "Afgewezen",
  verlopen: "Verlopen",
  gefactureerd: "Gefactureerd",
};

/** Oude naam, blijft bestaan voor bestaande imports. */
export const statusKleur: Record<string, string> = Object.fromEntries(
  Object.entries(statusPil).map(([k, v]) => [k, `pil pil-${v}`]),
);

export const OPEN_STATUS = ["verzonden", "herinnerd", "aangemaand"];
