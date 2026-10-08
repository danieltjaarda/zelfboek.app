import Link from "next/link";
import Image from "next/image";
import { MERK, PRIJS } from "@/lib/merk";
import { Logo, Woordmerk, type LogoId } from "@/components/Merk";
import { Voettekst } from "@/components/Voettekst";

export const instant = false;

const banken: LogoId[] = ["ing", "rabobank", "abnamro", "bunq", "knab", "sns", "asn", "regiobank", "triodos", "revolut", "n26"];
const kanalen: LogoId[] = ["mollie", "stripe", "shopify", "bol", "woocommerce", "paypal"];
const pakketten: LogoId[] = ["moneybird", "eboekhouden", "jortt"];

function Vink({ kleur = "var(--groen)", size = 18 }: { kleur?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" className="shrink-0" aria-hidden>
      <circle cx="9" cy="9" r="9" fill={kleur} fillOpacity=".14" />
      <path d="M5 9.5l2.6 2.6L13 6.5" fill="none" stroke={kleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Slot() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><rect x="3" y="7" width="10" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M5 7V5a3 3 0 016 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

/** Het nachtlog: wat de bot vannacht deed, regel voor regel. Eén animatie, loopt door. */
function Nachtlog() {
  const regels: { t: string; tekst: string; soort: "ok" | "vraag" }[] = [
    { t: "02:00", tekst: "ING gelezen: 14 nieuwe regels", soort: "ok" },
    { t: "02:00", tekst: "13 regels geboekt, met btw-code en uitleg", soort: "ok" },
    { t: "02:01", tekst: "Bon Coolblue € 249,00 aan bankregel gehangen", soort: "ok" },
    { t: "02:01", tekst: "Mollie: 3 uitbetalingen als omzet geboekt", soort: "ok" },
    { t: "02:02", tekst: "Factuur 2026-0031 is 7 dagen te laat: herinnering gestuurd", soort: "ok" },
    { t: "02:02", tekst: "Btw 4e kwartaal bijgewerkt: € 707,67 te betalen", soort: "ok" },
    { t: "02:03", tekst: "Café Het Hoekje € 42,50: zakelijk of privé?", soort: "vraag" },
  ];
  return (
    <div className="rounded-2xl bg-inkt p-6 text-white shadow-[0_40px_80px_-40px_rgba(19,32,26,.7)] md:p-7">
      <div className="flex items-center justify-between text-[14px] text-white/55">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#6fd3a0]" />Vannacht, terwijl jij sliep</span>
        <span className="tabular">7 oktober</span>
      </div>
      <div className="mt-2 h-[2px] overflow-hidden rounded bg-white/10"><div className="nachtlog-balk h-full bg-groen" /></div>
      <ul className="mt-4 space-y-2.5 text-[14px]">
        {regels.map((r, i) => (
          <li key={i} className="nachtlog-regel flex items-start gap-3" style={{ animationDelay: `${i * 1.1}s` }}>
            <span className="tabular mt-[2px] w-11 shrink-0 text-[14px] text-white/40">{r.t}</span>
            {r.soort === "ok" ? (
              <svg width="18" height="18" viewBox="0 0 18 18" className="mt-[1px] shrink-0" aria-hidden>
                <circle cx="9" cy="9" r="8" fill="none" stroke="#6fd3a0" strokeOpacity=".5" />
                <path d="M5 9.5l2.6 2.6L13 6.5" fill="none" stroke="#6fd3a0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="nachtlog-vink" style={{ animationDelay: `${i * 1.1}s` }} />
              </svg>
            ) : (
              <span className="mt-[3px] h-3 w-3 shrink-0 rounded-full bg-mosterd" />
            )}
            <span className={r.soort === "vraag" ? "font-medium text-mosterd" : "text-white/85"}>{r.tekst}</span>
          </li>
        ))}
      </ul>
      <div className="nachtlog-regel mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-white/[.07] p-3 text-[14px]" style={{ animationDelay: "7.7s" }}>
        <span className="mr-auto">Jouw antwoord, met één tik:</span>
        <span className="knop knop-klein bg-mosterd text-inkt">Zakelijk, lunch met klant</span>
        <span className="knop-licht knop-klein border-white/20 bg-transparent text-white">Privé</span>
      </div>
    </div>
  );
}

/* Mini-weergaven van echte schermen bij elke functie. */
function MockBank() {
  const rijen = [["Vercel Inc", "-24,20", "Software, btw verlegd", "ok"], ["NS Reizigers", "-34,80", "Reiskosten, 9%", "ok"], ["Klant BV", "+1.210,00", "Omzet, 21%", "ok"], ["Café Het Hoekje", "-42,50", "Zakelijk of privé?", "vraag"]];
  return (
    <div className="kaart overflow-hidden text-[14px]">
      {rijen.map(([n, b, c, s]) => (
        <div key={n} className="flex items-center gap-3 border-b border-lijn px-3 py-2 last:border-0">
          <span className="w-28 truncate font-medium">{n}</span>
          <span className="tabular w-16 text-right">{b}</span>
          <span className="flex-1 truncate text-tekst-2">{c}</span>
          <span className={`pil ${s === "ok" ? "pil-groen" : "pil-geel"}`}>{s === "ok" ? "geboekt" : "vraag"}</span>
        </div>
      ))}
    </div>
  );
}
function MockBon() {
  return (
    <div className="flex items-center gap-3">
      <div className="kaart w-28 shrink-0 p-3 text-[14px]">
        <p className="font-semibold">Coolblue</p>
        <p className="text-tekst-3">15-09-2026</p>
        <p className="mt-2 border-t border-lijn pt-2">Monitor 27"</p>
        <p className="mt-1 flex justify-between"><span>btw 21%</span><span>43,21</span></p>
        <p className="flex justify-between font-semibold"><span>Totaal</span><span>249,00</span></p>
      </div>
      <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden><path d="M2 12h30m-6-6l6 6-6 6" fill="none" stroke="var(--groen)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <div className="kaart flex-1 p-3 text-[14px]">
        <p className="flex justify-between"><span className="font-medium">Coolblue B.V.</span><span className="tabular">-249,00</span></p>
        <p className="text-tekst-2">16-09-2026, ING</p>
        <p className="mt-2 flex gap-1.5"><span className="pil pil-groen">bon gekoppeld</span><span className="pil pil-grijs">apparatuur</span></p>
      </div>
    </div>
  );
}
function MockFactuur() {
  const stappen = [["Dag 0", "Factuur verstuurd met iDEAL-link", true], ["Dag 7", "Vriendelijke herinnering", true], ["Dag 21", "Tweede herinnering", true], ["Dag 35", "Aanmaning met wettelijke kosten", false]] as const;
  return (
    <ol className="kaart divide-y divide-lijn text-[14px]">
      {stappen.map(([d, t, klaar]) => (
        <li key={d} className="flex items-center gap-3 px-3 py-2">
          <span className={`h-2.5 w-2.5 rounded-full ${klaar ? "bg-groen" : "border border-lijn-2"}`} />
          <span className="w-12 text-tekst-3">{d}</span>
          <span className={klaar ? "" : "text-tekst-3"}>{t}</span>
        </li>
      ))}
    </ol>
  );
}
function MockBtw() {
  const r = [["1a", "Omzet hoog tarief", "3.500", "735"], ["4b", "Diensten uit de EU", "240", "50"], ["5b", "Voorbelasting", "", "78"]];
  return (
    <div className="kaart overflow-hidden text-[14px]">
      {r.map(([c, n, a, b]) => (
        <div key={c} className="flex gap-3 border-b border-lijn px-3 py-2"><span className="w-6 text-tekst-3">{c}</span><span className="flex-1">{n}</span><span className="tabular w-12 text-right text-tekst-2">{a}</span><span className="tabular w-12 text-right">{b}</span></div>
      ))}
      <div className="flex gap-3 bg-inkt px-3 py-2 text-white"><span className="w-6 text-white/50">5c</span><span className="flex-1 font-medium">Te betalen</span><span className="cijfer w-24 text-right text-[14px]">€ 707,67</span></div>
    </div>
  );
}
function MockIb() {
  return (
    <div className="kaart p-4">
      <p className="text-[14px] text-tekst-2">Zet elke maand apart voor je inkomstenbelasting</p>
      <p className="cijfer mt-1 text-[30px] font-semibold text-groen-tekst">€ 798</p>
      <div className="mt-3 space-y-1 text-[14px]">
        {[["Winst tot nu", "€ 40.961"], ["Zelfstandigenaftrek", "- € 1.200"], ["MKB-vrijstelling 12,7%", "- € 5.050"], ["Te betalen, indicatie", "€ 9.570"]].map(([a, b]) => (
          <p key={a} className="flex justify-between"><span className="text-tekst-2">{a}</span><span className="tabular">{b}</span></p>
        ))}
      </div>
    </div>
  );
}
function MockBot() {
  return (
    <div className="space-y-2 text-[14px]">
      <p className="ml-auto w-fit rounded-xl bg-inkt px-3 py-2 text-white">Wat was mijn grootste kostenpost in september?</p>
      <div className="kaart w-fit max-w-[85%] px-3 py-2"><p>Software: € 240,34, vooral Adobe en Vercel. Daarna reiskosten met € 104,40. Wil je dat ik Adobe als jaarabonnement markeer?</p></div>
      <p className="ml-auto w-fit rounded-xl bg-inkt px-3 py-2 text-white">Ja</p>
    </div>
  );
}

const features: { kop: string; tekst: string; mock: React.ReactNode }[] = [
  { kop: "Elke bankregel geboekt voordat je wakker bent", tekst: "Koppel je bank. De bot leest elke nacht je nieuwe regels, kiest categorie en btw-code en schrijft in één zin waarom. Twijfelt hij, dan vraagt hij het jou.", mock: <MockBank /> },
  { kop: "Bonnen: foto maken is genoeg", tekst: "Fotografeer de bon of sleep de PDF erin. De bot leest leverancier, datum, bedrag en btw, en hangt de bon aan de juiste bankregel. Ook buitenlandse btw.", mock: <MockBon /> },
  { kop: "Facturen die zichzelf opvolgen", tekst: "Factuur in een minuut, met iDEAL-link en e-factuur. De bot ziet de betaling binnenkomen, of stuurt zelf de herinneringen. Jij hoeft er niet achteraan.", mock: <MockFactuur /> },
  { kop: "Btw-aangifte: vier getallen overnemen", tekst: "Elk kwartaal staan alle rubrieken klaar, inclusief verlegde btw uit de EU en je ICP-opgaaf. Overnemen bij de Belastingdienst duurt twee minuten.", mock: <MockBtw /> },
  { kop: "Nooit meer schrikken van de inkomstenbelasting", tekst: "Je ziet het hele jaar wat je moet reserveren, met zelfstandigenaftrek, MKB-vrijstelling, investeringsaftrek en je urencriterium erbij gerekend.", mock: <MockIb /> },
  { kop: "Vraag het gewoon", tekst: "Hoeveel heb ik aan software uitgegeven? Welke klant betaalt altijd te laat? De bot kijkt in je eigen cijfers en antwoordt direct. Aanpassen doet hij alleen na jouw ja.", mock: <MockBot /> },
];

const vragen: [string, string][] = [
  ["Moet ik nog iets doen?", "Bijna niets. Je koppelt je bank, fotografeert bonnen en maakt facturen. De bot doet de rest en stelt soms een vraag die je met één tik beantwoordt."],
  ["Wie dient mijn aangifte in?", "Jij, in twee minuten. De bot zet alle rubrieken klaar; je neemt ze over in Mijn Belastingdienst Zakelijk. Zo blijf jij de baas over je aangifte."],
  ["Wat als de bot het fout heeft?", "Elke boeking heeft een uitleg en is met één klik te wijzigen. Bij twijfel boekt hij niet, maar vraagt hij. En hij onthoudt je antwoord."],
  ["Ik heb al een pakket. Kan ik overstappen?", "Ja. Je importeert klanten, facturen en boekingen uit Moneybird, e-Boekhouden, Jortt of Excel. Je historie komt mee."],
  ["Voor wie is het?", "Eenmanszaken en vof's zonder personeel. Geen bv's, geen loonadministratie."],
  ["Kan ik stoppen?", "Elke maand. Je data neem je mee als Excel of auditfile."],
  ["Waar staan mijn gegevens?", "Op servers in de EU, versleuteld. De bankkoppeling is alleen-lezen: niemand kan geld overmaken, ook de bot niet."],
];

export default function Landing() {
  return (
    <main className="flex-1">
      <header className="sticky top-0 z-20 border-b border-lijn/60 bg-papier/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Woordmerk />
          <nav className="flex items-center gap-6 text-[14px] text-tekst-2">
            <a href="#functies" className="hidden hover:text-tekst md:inline">Wat hij doet</a>
            <a href="#werkt-met" className="hidden hover:text-tekst md:inline">Werkt met</a>
            <a href="#prijs" className="hidden hover:text-tekst md:inline">Prijs</a>
            <Link href="/login" className="hidden hover:text-tekst sm:inline">Inloggen</Link>
            <Link href="/login" className="knop knop-groen knop-klein">Gratis proberen</Link>
          </nav>
        </div>
      </header>

      {/* Held */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-14 pt-12 md:grid-cols-[1.05fr_1fr] md:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-lijn bg-white px-3 py-1 text-[14px] text-tekst-2">
            <span className="h-2 w-2 rounded-full bg-groen" />Boekhouding voor zzp'ers, volledig door AI
          </p>
          <h1 className="display mt-5 text-[46px] font-semibold leading-[1.02] md:text-[64px]">Je boekhouding doet zichzelf.</h1>
          <p className="mt-5 max-w-md text-[18px] leading-relaxed text-tekst-2">
            Koppel je bank. Vanaf vannacht boekt de bot alles, koppelt je bonnen, stuurt je herinneringen en zet je btw-aangifte klaar.
          </p>
          <ul className="mt-6 space-y-2 text-[15px]">
            {["Geen boekhouder meer nodig: bespaar € 600 tot 2.500 per jaar", "Btw-aangifte in 2 minuten, elk kwartaal", "Twijfelt de bot, dan stelt hij één vraag. Jij tikt het antwoord"].map((x) => (
              <li key={x} className="flex items-start gap-3"><span className="mt-[2px]"><Vink /></span>{x}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/login" className="knop knop-groen px-7 py-4 text-[16px]">Start gratis, 30 dagen</Link>
            <div className="text-[14px] leading-snug text-tekst-2">Geen creditcard nodig.<br />Daarna € {PRIJS} per maand, maandelijks opzegbaar.</div>
          </div>
          <div className="trust mt-8 border-t border-lijn pt-5">
            <span><Logo id="ideal" hoogte={16} metNaam={false} />iDEAL-betaallinks</span>
            <span><Slot />Bankkoppeling alleen-lezen (PSD2)</span>
            <span><Logo id="peppol" hoogte={16} metNaam={false} />Peppol e-facturen</span>
            <span><Slot />Servers in de EU</span>
          </div>
        </div>
        <Nachtlog />
      </section>

      {/* Logowand */}
      <section id="werkt-met" className="border-y border-lijn bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="display text-[30px] font-semibold leading-tight">Werkt met je bank, je verkoopkanalen en je oude pakket</h2>
          <p className="mt-2 text-[16px] text-tekst-2">Elke Nederlandse bank. Alle koppelingen alleen-lezen.</p>
          <div className="mt-8 space-y-4">
            {[["Banken", banken], ["Verkoopkanalen", kanalen], ["Overstappen van", pakketten]].map(([kop, lijst]) => (
              <div key={kop as string} className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
                <p className="text-[15px] font-medium text-tekst-2">{kop as string}</p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {(lijst as LogoId[]).map((b) => <div key={b} className="logo-tegel"><Logo id={b} hoogte={24} /></div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Echt scherm */}
      <section className="mx-auto max-w-6xl px-6 pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display text-[36px] font-semibold leading-[1.1]">Zo ziet je ochtend eruit</h2>
          <p className="mt-3 text-[16px] text-tekst-2">Eén scherm. Bovenaan staat of je iets moet doen. Meestal niet.</p>
        </div>
        <div className="raam mt-10">
          <div className="raam-balk"><i /><i /><i /><span>app.zelfboek.nl/app</span></div>
          <Image src="/schermen/dashboard.png" alt={`Het overzicht in ${MERK}: alles is geboekt, zes kleine vragen, omzet en kosten van het jaar`} width={1440} height={900} className="block w-full" priority />
        </div>
      </section>

      {/* Functies */}
      <section id="functies" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="display max-w-2xl text-[36px] font-semibold leading-[1.1]">Alles wat een boekhouder deed. Elke nacht, zonder dat je erom vraagt.</h2>
        <div className="mt-14 space-y-16">
          {features.map((f, i) => (
            <div key={f.kop} className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <h3 className="display text-[26px] font-semibold leading-tight">{f.kop}</h3>
                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-tekst-2">{f.tekst}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 ring-1 ring-lijn md:p-7">{f.mock}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Hoe het werkt */}
      <section className="bg-inkt text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-center">
            <div>
              <h2 className="display text-[36px] font-semibold leading-tight">Klaar in vijf minuten. Daarna nooit meer.</h2>
              <Link href="/login" className="knop mt-8 bg-mosterd px-7 py-4 text-[16px] text-inkt hover:bg-[#f0c74a]">Start gratis, 30 dagen</Link>
            </div>
            <ol className="space-y-5">
              {[["Koppel je bank", "Kies je bank, log in bij je bank, geef toestemming. Alleen-lezen, via een partij met vergunning."], ["Doe wat je al deed", "Facturen sturen, bonnen bewaren. Alleen nu: foto maken in plaats van schoenendoos."], ["Tik af en toe een antwoord", "Zakelijk of privé? Eén tik. De bot onthoudt het voor de volgende keer."]].map(([k, t], i) => (
                <li key={k} className="flex gap-5 border-t border-white/15 pt-5">
                  <span className="cijfer text-[32px] font-semibold leading-none text-mosterd">{i + 1}</span>
                  <div><h3 className="text-[19px] font-semibold">{k}</h3><p className="mt-1 text-[15px] text-white/65">{t}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Prijs */}
      <section id="prijs" className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <h2 className="display text-[36px] font-semibold leading-tight">Eén prijs. Niets erbij.</h2>
          <p className="mt-4 max-w-md text-[16px] text-tekst-2">Een boekhouder kost een zzp'er 600 tot 2.500 euro per jaar en kijkt één keer per kwartaal. {MERK} kost {PRIJS * 12} euro per jaar en kijkt elke nacht.</p>
          <table className="tabel mt-8 max-w-md">
            <thead><tr><th></th><th>Boekhouder</th><th>{MERK}</th></tr></thead>
            <tbody>
              {[["Bankregels", "per kwartaal", "elke nacht"], ["Bonnen", "schoenendoos", "foto, direct gekoppeld"], ["Herinneringen", "doe je zelf", "automatisch"], ["Vragen", "mailen, dagen wachten", "direct antwoord"], ["Inzicht", "achteraf", "elke dag"], ["Per jaar", "€ 600 tot 2.500", `€ ${PRIJS * 12}`]].map(([a, b, c]) => (
                <tr key={a}><td className="text-tekst-2">{a}</td><td>{b}</td><td className="font-medium text-groen-tekst">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="kaart p-8 ring-2 ring-groen">
          <p className="text-[14px] font-medium text-groen-tekst">Alles inbegrepen</p>
          <p className="display mt-1 text-[56px] font-semibold leading-none">€ {PRIJS}<span className="ml-3 text-[16px] font-normal text-tekst-2">per maand, zonder btw</span></p>
          <ul className="mt-6 space-y-2.5 text-[15px]">
            {["Onbeperkt bankregels, bonnen en facturen", "Bankkoppeling en alle verkoopkanalen", "Btw-aangifte, ICP, IB-indicatie en jaarrekening", "Herinneringen, iDEAL-links en e-facturen", "Een bot die je vragen over je cijfers beantwoordt", "Overstappen met je hele historie"].map((x) => (
              <li key={x} className="flex gap-3"><Vink />{x}</li>
            ))}
          </ul>
          <Link href="/login" className="knop knop-groen mt-8 w-full justify-center py-4 text-[16px]">Start gratis, 30 dagen</Link>
          <p className="mt-4 text-center text-[14px] text-tekst-2">Geen creditcard nodig. Maandelijks opzegbaar.</p>
          <div className="trust mt-5 justify-center border-t border-lijn pt-4">
            <span><Logo id="ideal" hoogte={14} metNaam={false} />iDEAL</span>
            <span><Slot />PSD2 alleen-lezen</span>
            <span><Slot />EU-servers</span>
          </div>
        </div>
      </section>

      {/* Vragen */}
      <section id="vragen" className="border-t border-lijn bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="display text-[30px] font-semibold">Vragen die we vaak krijgen</h2>
          <dl className="mt-6 divide-y divide-lijn">
            {vragen.map(([v, a]) => (
              <div key={v} className="py-4"><dt className="font-semibold">{v}</dt><dd className="mt-1 text-[15px] text-tekst-2">{a}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      {/* Slot */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="display mx-auto max-w-xl text-[40px] font-semibold leading-tight">Morgenochtend is je boekhouding al gedaan.</h2>
        <Link href="/login" className="knop knop-groen mt-8 px-8 py-4 text-[16px]">Start gratis, 30 dagen</Link>
        <p className="mt-3 text-[14px] text-tekst-2">Geen creditcard nodig.</p>
      </section>

      <Voettekst />

      {/* Vaste knop op mobiel */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-lijn bg-white/95 p-3 backdrop-blur md:hidden">
        <Link href="/login" className="knop knop-groen w-full justify-center py-3.5 text-[15px]">Start gratis, 30 dagen</Link>
      </div>
    </main>
  );
}
