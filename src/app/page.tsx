import Link from "next/link";
import Image from "next/image";
import { MERK, PRIJS } from "@/lib/merk";
import { Logo, Woordmerk, type LogoId } from "@/components/Merk";
import { Voettekst } from "@/components/Voettekst";

export const instant = false;

const banken: LogoId[] = ["ing", "rabobank", "abnamro", "bunq", "knab", "sns", "asn", "regiobank", "triodos", "revolut", "n26"];
const kanalen: LogoId[] = ["mollie", "stripe", "shopify", "bol", "woocommerce", "paypal"];
const pakketten: LogoId[] = ["moneybird", "eboekhouden", "jortt"];

/**
 * Het bonnetje: wat de bot vannacht deed, uitgedraaid als kassabon.
 * Dit is het ene beeld van de pagina. De rest is kasboekpapier.
 */
function Bonnetje() {
  const regels: [string, string, string?][] = [
    ["ING gelezen", "14 regels"],
    ["Geboekt met btw-code", "13"],
    ["Bon Coolblue gekoppeld", "249,00"],
    ["Mollie-uitbetalingen", "3"],
    ["Herinnering factuur 2026-0031", "1"],
    ["Btw 4e kwartaal bijgewerkt", "707,67"],
    ["Zakelijk of privé: Café Het Hoekje", "42,50", "vraag"],
  ];
  return (
    <div className="bon" role="figure" aria-label="Bonnetje van wat de bot vannacht deed">
      <div className="bon-kop">
        <p className="display text-[20px] font-semibold">{MERK}</p>
        <p className="text-[13px] text-tekst-2">Nachtdienst, 7 oktober, 02:00 tot 02:03</p>
      </div>
      <ul className="bon-regels">
        {regels.map(([l, r, s], i) => (
          <li key={l} className="bon-regel" style={{ animationDelay: `${0.4 + i * 0.35}s` }}>
            <span className={s === "vraag" ? "font-medium text-mosterd-tekst" : ""}>{l}</span>
            <span className="bon-leader" aria-hidden />
            <span className="tabular">{r}</span>
          </li>
        ))}
      </ul>
      <div className="bon-totaal bon-regel" style={{ animationDelay: "3s" }}>
        <span>Jouw werk vandaag</span>
        <span className="bon-leader" aria-hidden />
        <span className="tabular">1 tik</span>
      </div>
      <div className="bon-regel mt-4 flex flex-wrap gap-2" style={{ animationDelay: "3.3s" }}>
        <span className="knop knop-klein bg-mosterd text-inkt">Zakelijk, lunch met klant</span>
        <span className="knop-licht knop-klein">Privé</span>
      </div>
      <p className="bon-regel mt-4 text-center text-[12px] text-tekst-3" style={{ animationDelay: "3.6s" }}>Bedankt. Tot vannacht.</p>
    </div>
  );
}

/* Kleine, echte schermen per moment van de dag. */
function MockBank() {
  const rijen = [["Vercel Inc", "-24,20", "Software, btw verlegd"], ["NS Reizigers", "-34,80", "Reiskosten, 9%"], ["Klant BV", "+1.210,00", "Omzet, 21%"]];
  return (
    <div className="mini">
      {rijen.map(([n, b, c]) => (
        <div key={n} className="mini-rij">
          <span className="w-28 truncate font-medium">{n}</span>
          <span className="tabular w-20 text-right">{b}</span>
          <span className="flex-1 truncate text-tekst-2">{c}</span>
          <span className="text-groen-tekst">geboekt</span>
        </div>
      ))}
    </div>
  );
}
function MockBon() {
  return (
    <div className="mini">
      <div className="mini-rij"><span className="flex-1">Foto van de bon, Coolblue</span><span className="tabular">249,00</span></div>
      <div className="mini-rij"><span className="flex-1">Bankregel Coolblue B.V., 16-09, ING</span><span className="tabular">-249,00</span></div>
      <div className="mini-rij"><span className="flex-1 text-tekst-2">Gekoppeld. Categorie apparatuur, btw 21% teruggevraagd.</span></div>
    </div>
  );
}
function MockFactuur() {
  const stappen = [["Dag 0", "Factuur verstuurd met iDEAL-link"], ["Dag 7", "Vriendelijke herinnering"], ["Dag 21", "Tweede herinnering"], ["Dag 35", "Aanmaning met wettelijke kosten"]];
  return (
    <div className="mini">
      {stappen.map(([d, t]) => (
        <div key={d} className="mini-rij"><span className="w-14 text-tekst-3">{d}</span><span>{t}</span></div>
      ))}
    </div>
  );
}
function MockBtw() {
  const r = [["1a", "Omzet hoog tarief", "735"], ["4b", "Diensten uit de EU", "50"], ["5b", "Voorbelasting", "78"]];
  return (
    <div className="mini">
      {r.map(([c, n, b]) => (
        <div key={c} className="mini-rij"><span className="w-7 text-tekst-3">{c}</span><span className="flex-1">{n}</span><span className="tabular">{b}</span></div>
      ))}
      <div className="mini-rij font-semibold"><span className="w-7 text-tekst-3">5c</span><span className="flex-1">Te betalen</span><span className="tabular">707,67</span></div>
    </div>
  );
}
function MockBot() {
  return (
    <div className="space-y-2 text-[14px]">
      <p className="ml-auto w-fit rounded-xl bg-inkt px-3 py-2 text-white">Wat was mijn grootste kostenpost in september?</p>
      <p className="w-fit max-w-[85%] rounded-xl bg-white px-3 py-2 ring-1 ring-lijn">Software: € 240,34, vooral Adobe en Vercel. Daarna reiskosten, € 104,40.</p>
    </div>
  );
}

/** Een etmaal met Zelfboek. De tijden zijn echt een volgorde, daarom staan ze erbij. */
const dag: { tijd: string; wie: "bot" | "jij"; kop: string; tekst: string; mock?: React.ReactNode }[] = [
  { tijd: "02:00", wie: "bot", kop: "Je bankregels worden geboekt", tekst: "De bot leest je nieuwe regels, kiest categorie en btw-code en schrijft in één zin waarom. Twijfelt hij, dan bewaart hij de vraag voor jou.", mock: <MockBank /> },
  { tijd: "02:01", wie: "bot", kop: "Bonnen worden aan bankregels gehangen", tekst: "Die foto die je gisteren maakte: leverancier, bedrag en btw zijn uitgelezen en de bon zit aan de juiste bankregel.", mock: <MockBon /> },
  { tijd: "02:02", wie: "bot", kop: "Te late facturen krijgen een herinnering", tekst: "Factuur 2026-0031 is zeven dagen over tijd. De herinnering is weg, vriendelijk, met de iDEAL-link erbij.", mock: <MockFactuur /> },
  { tijd: "07:30", wie: "jij", kop: "Jij opent de app bij de koffie", tekst: "Bovenaan staat of je iets moet doen. Vandaag één vraag: zakelijk of privé. Eén tik, klaar. De bot onthoudt het voor de volgende keer." },
  { tijd: "12:15", wie: "jij", kop: "Je stuurt een factuur", tekst: "Klant kiezen, regels invullen, versturen. Nummering, btw verleggen bij EU-klanten en de e-factuur gaan vanzelf. De rest van de opvolging ook." },
  { tijd: "16:40", wie: "jij", kop: "Je stelt een vraag", tekst: "De bot kijkt in je eigen cijfers en antwoordt direct. Iets aanpassen doet hij alleen na jouw ja.", mock: <MockBot /> },
  { tijd: "31 jan", wie: "bot", kop: "Je btw-aangifte staat klaar", tekst: "Alle rubrieken, inclusief verlegde btw uit de EU en je ICP-opgaaf. Je neemt vier getallen over bij de Belastingdienst. Twee minuten.", mock: <MockBtw /> },
];

const vragen: [string, string][] = [
  ["Moet ik nog iets doen?", "Bijna niets. Je koppelt je bank, fotografeert bonnen en maakt facturen. De bot doet de rest en stelt soms een vraag die je met één tik beantwoordt."],
  ["Wie dient mijn aangifte in?", "Jij, in twee minuten. De bot zet alle rubrieken klaar; je neemt ze over in Mijn Belastingdienst Zakelijk. Zo blijf jij de baas over je aangifte."],
  ["Wat als de bot het fout heeft?", "Elke boeking heeft een uitleg en is met één klik te wijzigen. Bij twijfel boekt hij niet, maar vraagt hij. En hij onthoudt je antwoord."],
  ["Ik heb al een pakket. Kan ik overstappen?", "Ja. Je importeert klanten, facturen en boekingen uit Moneybird, e-Boekhouden, Jortt of Excel. Je historie komt mee."],
  ["Voor wie is het?", "Eenmanszaken en vof’s zonder personeel. Geen bv’s, geen loonadministratie."],
  ["Kan ik stoppen?", "Elke maand. Je data neem je mee als Excel of auditfile."],
  ["Waar staan mijn gegevens?", "Op servers in de EU, versleuteld. De bankkoppeling is alleen-lezen: niemand kan geld overmaken, ook de bot niet."],
];

export default function Landing() {
  return (
    <main className="flex-1">
      <header className="sticky top-0 z-20 bg-inkt/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Woordmerk donker />
          <nav className="flex items-center gap-6 text-[15px] text-white/70">
            <a href="#dag" className="hidden hover:text-white md:inline">Hoe het werkt</a>
            <a href="#werkt-met" className="hidden hover:text-white md:inline">Werkt met</a>
            <a href="#prijs" className="hidden hover:text-white md:inline">Prijs</a>
            <Link href="/login" className="hover:text-white">Inloggen</Link>
            <Link href="/login" className="knop knop-klein hidden bg-mosterd text-inkt hover:bg-[#f0c74a] sm:inline-flex">Gratis proberen</Link>
          </nav>
        </div>
      </header>

      {/* Held: de nacht. Het bonnetje is het enige licht. */}
      <section className="nacht text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-14 md:grid-cols-[1.2fr_.8fr] md:pb-28 md:pt-24">
          <div>
            <h1 className="display text-[44px] font-semibold leading-[1] tracking-[-0.02em] md:text-[66px]">
              Je boekhouding doet zichzelf.<br />
              <span className="text-mosterd">’s Nachts.</span>
            </h1>
            <p className="mt-7 max-w-md text-[19px] leading-[1.5] text-white/70">
              Koppel je bank. Vannacht boekt de bot je regels, hangt je bonnen eraan, stuurt herinneringen en zet je btw-aangifte klaar. Jij tikt af en toe een antwoord.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link href="/login" className="knop bg-mosterd px-7 py-4 text-[16px] text-inkt hover:bg-[#f0c74a]">Start gratis, 30 dagen</Link>
              <span className="text-[15px] leading-snug text-white/60">Geen creditcard. Daarna € {PRIJS} per maand,<br className="hidden sm:block" /> maandelijks opzegbaar.</span>
            </div>
          </div>
          <Bonnetje />
        </div>
      </section>

      {/* Werkt met: gelijke vakjes, woordmerken zonder naam erachter */}
      <section id="werkt-met" className="bg-papier">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-[17px] text-tekst-2">Werkt met elke Nederlandse bank, je verkoopkanalen en het pakket waar je vandaan komt.</p>
          <div className="merken mt-6">
            {[...banken, ...kanalen, ...pakketten].map((b) => <div key={b} className="merk"><Logo id={b} hoogte={22} /></div>)}
          </div>
          <p className="mt-4 text-[14px] text-tekst-3">Alle koppelingen alleen-lezen: niemand kan geld overmaken, ook de bot niet.</p>
        </div>
      </section>

      {/* Een etmaal */}
      <section id="dag" className="kasboek border-t border-lijn">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="kasboek-marge">
            <h2 className="display max-w-2xl text-[38px] font-semibold leading-[1.05] md:text-[48px]">Een etmaal met {MERK}.</h2>
            <p className="mt-3 max-w-md text-[17px] text-tekst-2">De bot werkt als jij slaapt. Overdag doe je wat je al deed, alleen korter.</p>
          </div>
          <ol className="mt-14">
            {dag.map((m) => (
              <li key={m.tijd} className="dag-moment">
                <span className={`dag-tijd ${m.wie === "bot" ? "text-groen" : "text-inkt"}`}>{m.tijd}</span>
                <div className="dag-inhoud">
                  <p className="text-[13px] text-tekst-3">{m.wie === "bot" ? "De bot" : "Jij"}</p>
                  <h3 className="display mt-0.5 text-[24px] font-semibold leading-tight">{m.kop}</h3>
                  <p className="mt-2 max-w-lg text-[16px] leading-relaxed text-tekst-2">{m.tekst}</p>
                  {m.mock && <div className="mt-4 max-w-lg">{m.mock}</div>}
                </div>
              </li>
            ))}
          </ol>
          <div className="raam mt-16">
            <div className="raam-balk"><i /><i /><i /><span>app.zelfboek.nl/app</span></div>
            <Image src="/schermen/dashboard.png" alt={`Het overzicht in ${MERK} om 07:30: alles is geboekt, zes kleine vragen, omzet en kosten van het jaar`} width={1440} height={900} className="block w-full" />
          </div>
        </div>
      </section>

      {/* Prijs: één som, zoals onderaan een bon */}
      <section id="prijs" className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="display text-[38px] font-semibold leading-[1.05] md:text-[48px]">Eén prijs. Alles erin.</h2>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-tekst-2">Een boekhouder kost een zzp’er 600 tot 2.500 euro per jaar en kijkt één keer per kwartaal. {MERK} kost {PRIJS * 12} euro per jaar en kijkt elke nacht.</p>
            <dl className="som mt-10 max-w-md">
              {[["Boekhouder, per jaar", "€ 600 tot 2.500"], [`${MERK}, per jaar`, `€ ${PRIJS * 12}`]].map(([a, b]) => (
                <div key={a} className="som-rij"><dt>{a}</dt><dd className="tabular">{b}</dd></div>
              ))}
              <div className="som-rij som-totaal"><dt>Per maand, zonder btw</dt><dd className="cijfer text-[40px]">€ {PRIJS}</dd></div>
            </dl>
          </div>
          <div className="md:pt-3">
            <ul className="space-y-3 text-[16px]">
              {["Onbeperkt bankregels, bonnen en facturen", "Bankkoppeling en alle verkoopkanalen", "Btw-aangifte, ICP, IB-indicatie en jaarrekening", "Herinneringen, iDEAL-links en e-facturen via Peppol", "Een bot die je vragen over je cijfers beantwoordt", "Overstappen met je hele historie", "Dertig dagen gratis, daarna maandelijks opzegbaar"].map((x) => (
                <li key={x} className="flex gap-3 border-b border-lijn pb-3"><span className="mt-[3px] h-4 w-4 shrink-0 rounded-full bg-groen-licht text-center text-[11px] leading-4 text-groen-tekst">✓</span>{x}</li>
              ))}
            </ul>
            <Link href="/login" className="knop knop-groen mt-8 px-7 py-4 text-[16px]">Start gratis, 30 dagen</Link>
          </div>
        </div>
      </section>

      {/* Vragen */}
      <section id="vragen" className="border-t border-lijn bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="display text-[34px] font-semibold leading-tight">Vragen die we vaak krijgen</h2>
          <div className="mt-8 border-t border-lijn-2">
            {vragen.map(([v, a]) => (
              <details key={v} className="vraag">
                <summary>{v}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Slot */}
      <section className="bg-inkt text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <h2 className="display max-w-2xl text-[40px] font-semibold leading-[1.05] md:text-[56px]">Morgenochtend is je boekhouding al gedaan.</h2>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href="/login" className="knop bg-mosterd px-8 py-4 text-[16px] text-inkt hover:bg-[#f0c74a]">Start gratis, 30 dagen</Link>
            <span className="text-[15px] text-white/60">Account in dertig seconden, alleen een e-mailadres.</span>
          </div>
        </div>
      </section>

      <Voettekst />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-lijn bg-white/95 p-3 backdrop-blur sm:hidden">
        <Link href="/login" className="knop knop-groen w-full justify-center py-3.5 text-[15px]">Start gratis, 30 dagen</Link>
      </div>
    </main>
  );
}
