import Link from "next/link";
import Image from "next/image";
import { MERK, PRIJS } from "@/lib/merk";
import { Logo, type LogoId } from "@/components/Merk";
import { Voettekst } from "@/components/Voettekst";

export const instant = false;

const banken: LogoId[] = ["ing", "rabobank", "abnamro", "bunq", "knab", "sns", "asn", "regiobank", "triodos", "revolut", "n26"];
const kanalen: LogoId[] = ["mollie", "stripe", "shopify", "bol", "woocommerce", "paypal"];
const pakketten: LogoId[] = ["moneybird", "eboekhouden", "jortt"];

function Pijl({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} aria-hidden>
      <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Vink({ fel = false }: { fel?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className={`mt-[3px] shrink-0 ${fel ? "text-groen-fel" : "text-groen"}`} aria-hidden>
      <path d="M4 9.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Eyebrow({ children, licht = false }: { children: React.ReactNode; licht?: boolean }) {
  return (
    <p className={`eyebrow ${licht ? "text-groen-fel" : "text-groen"}`}>
      <span className="eyebrow-stip" />{children}
    </p>
  );
}

const functies: { kop: string; tekst: string }[] = [
  { kop: "Bankregels geboekt voordat je wakker bent", tekst: "Koppel je bank. Elke nacht leest de bot je nieuwe regels, kiest categorie en btw-code en schrijft in één zin waarom." },
  { kop: "Bonnen: foto maken is genoeg", tekst: "Leverancier, datum, bedrag en btw worden uitgelezen. De bon hangt vanzelf aan de juiste bankregel." },
  { kop: "Facturen die zichzelf opvolgen", tekst: "Met iDEAL-link en e-factuur. Herinneringen op dag 7, 21 en 35 gaan vanzelf. Jij hoeft er niet achteraan." },
  { kop: "Btw-aangifte in twee minuten", tekst: "Elk kwartaal staan alle rubrieken klaar, met verlegde btw uit de EU en je ICP-opgaaf. Overnemen en klaar." },
  { kop: "Nooit meer schrikken van de inkomstenbelasting", tekst: "Je ziet het hele jaar wat je moet reserveren, met zelfstandigenaftrek, MKB-vrijstelling en urencriterium erbij." },
  { kop: "Vraag het gewoon", tekst: "Hoeveel gaf ik uit aan software? Wie betaalt altijd te laat? De bot kijkt in je cijfers en antwoordt direct." },
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
    <main className="flex-1 px-3 pt-3 md:px-6 md:pt-5">
      {/* Zwevende pil-navigatie */}
      <header className="sticky top-3 z-30 md:top-5">
        <div className="pilnav">
          <Link href="/" className="display text-[20px] font-bold tracking-tight">{MERK}<span className="text-groen">.</span></Link>
          <nav className="hidden items-center gap-7 text-[15px] font-medium text-tekst-2 md:flex">
            <a href="#functies" className="hover:text-tekst">Wat hij doet</a>
            <a href="#werkt-met" className="hover:text-tekst">Werkt met</a>
            <a href="#prijs" className="hover:text-tekst">Prijs</a>
            <a href="#vragen" className="hover:text-tekst">Vragen</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden px-3 text-[15px] font-medium text-tekst-2 hover:text-tekst sm:inline">Inloggen</Link>
            <Link href="/login" className="knop knop-groen knop-klein">Gratis proberen</Link>
          </div>
        </div>
      </header>

      {/* Held: donker blok met grote ronde hoeken */}
      <section className="blok-donker mt-4 md:mt-6">
        <div className="grid items-center gap-12 px-7 pb-12 pt-14 md:grid-cols-[1fr_1.05fr] md:px-14 md:pb-16 md:pt-20">
          <div>
            <h1 className="display text-[48px] font-bold leading-[0.98] tracking-[-0.03em] md:text-[76px]">
              <span className="text-groen-fel">Boekhouding</span><br />die zichzelf<br />doet.
            </h1>
            <p className="mt-7 max-w-md text-[19px] leading-[1.5] text-white/70">
              Koppel je bank en de bot boekt elke nacht je regels, bonnen en facturen. Jij tikt af en toe een antwoord. Vaste prijs, € {PRIJS} per maand.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="knop knop-groen px-7 py-4 text-[16px]">Start gratis, 30 dagen <Pijl /></Link>
              <a href="#functies" className="knop border-white/20 bg-transparent px-7 py-4 text-[16px] text-white hover:bg-white/10">Bekijk wat hij doet</a>
            </div>
            <p className="mt-6 text-[14px] text-white/50">Geen creditcard nodig. Maandelijks opzegbaar.</p>
          </div>
          <div className="raam raam-donker">
            <div className="raam-balk"><i /><i /><i /><span>app.zelfboek.nl</span></div>
            <Image src="/schermen/dashboard.png" alt={`Het overzicht in ${MERK}: alles is geboekt, zes kleine vragen, omzet en kosten van het jaar`} width={1440} height={900} className="block w-full" priority />
          </div>
        </div>
      </section>

      {/* Drie kaarten onder de held */}
      <section className="mx-auto mt-3 grid max-w-[1320px] gap-3 md:grid-cols-3">
        {[["Bank", "Elke nacht geboekt, met btw-code en uitleg.", "vanzelf"], ["Bonnen", "Foto maken. De bot koppelt hem aan de bankregel.", "vanzelf"], ["Btw-aangifte", "Alle rubrieken klaar, elk kwartaal.", "2 minuten"]].map(([k, t, p]) => (
          <div key={k} className="blok-donker-klein">
            <h2 className="display text-[22px] font-bold">{k}.</h2>
            <p className="mt-1 text-[15px] text-white/65">{t}</p>
            <div className="mt-6 flex items-center justify-between">
              <span className="display text-[20px] font-bold text-groen-fel">{p}</span>
              <Link href="/login" className="rondknop" aria-label={`Start met ${k}`}><Pijl /></Link>
            </div>
          </div>
        ))}
      </section>

      {/* Wat hij doet */}
      <section id="functies" className="mx-auto max-w-6xl px-3 py-20 md:px-6 md:py-28">
        <Eyebrow>Wat hij doet</Eyebrow>
        <h2 className="display mt-4 max-w-3xl text-[40px] font-bold leading-[1] tracking-[-0.03em] md:text-[60px]">Alles wat een boekhouder deed. Elke nacht.</h2>
        <p className="mt-4 max-w-xl text-[18px] text-tekst-2">Jij doet wat je al deed: facturen sturen, bonnen bewaren. Alleen korter.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {functies.map((f) => (
            <div key={f.kop} className="blok-wit">
              <h3 className="display text-[22px] font-bold leading-tight">{f.kop}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-tekst-2">{f.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Groot scherm in zacht vlak */}
      <section className="blok-zand">
        <div className="grid items-center gap-10 px-7 py-12 md:grid-cols-[1.3fr_1fr] md:px-14 md:py-16">
          <div className="raam">
            <div className="raam-balk"><i /><i /><i /><span>app.zelfboek.nl/app/bank</span></div>
            <Image src="/schermen/bank.png" alt={`De bankpagina in ${MERK}: elke regel geboekt met categorie, btw-code en uitleg`} width={1440} height={900} className="block w-full" />
          </div>
          <div>
            <Eyebrow>Zo ziet je ochtend eruit</Eyebrow>
            <h2 className="display mt-4 text-[36px] font-bold leading-[1.02] tracking-[-0.02em] md:text-[48px]">Eén scherm. Meestal niets te doen.</h2>
            <ul className="mt-7 space-y-3 text-[17px]">
              {["Bovenaan staat of je iets moet doen", "Twijfelregels beantwoord je met één tik", "Omzet, kosten, winst en btw altijd actueel", "Bij elke boeking staat waarom"].map((x) => (
                <li key={x} className="flex gap-3"><Vink />{x}</li>
              ))}
            </ul>
            <Link href="/login" className="knop knop-groen mt-9">Start gratis, 30 dagen <Pijl /></Link>
          </div>
        </div>
      </section>

      {/* Werkt met: pillen */}
      <section id="werkt-met" className="mx-auto max-w-6xl px-3 py-20 md:px-6">
        <div className="flex flex-col gap-6">
          {[["Banken", banken], ["Verkoopkanalen", kanalen], ["Overstappen van", pakketten]].map(([kop, lijst]) => (
            <div key={kop as string} className="flex flex-wrap items-center gap-2.5">
              <span className="mr-3 w-full text-[15px] font-medium text-tekst-2 md:w-36">{kop as string}</span>
              {(lijst as LogoId[]).map((b) => <span key={b} className="merkpil"><Logo id={b} hoogte={18} /></span>)}
            </div>
          ))}
        </div>
        <p className="mt-6 text-[14px] text-tekst-3">Elke Nederlandse bank via PSD2. Alle koppelingen alleen-lezen: niemand kan geld overmaken, ook de bot niet.</p>
      </section>

      {/* Prijs: donker blok */}
      <section id="prijs" className="blok-donker">
        <div className="grid gap-12 px-7 py-14 md:grid-cols-2 md:items-center md:px-14 md:py-20">
          <div>
            <Eyebrow licht>Prijs</Eyebrow>
            <h2 className="display mt-4 text-[40px] font-bold leading-[1] tracking-[-0.03em] md:text-[60px]">Eén prijs.<br />Alles erin.</h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/65">Een boekhouder kost 600 tot 2.500 euro per jaar en kijkt één keer per kwartaal. {MERK} kijkt elke nacht.</p>
            <p className="display mt-8 text-[64px] font-bold leading-none tracking-[-0.03em]">€ {PRIJS}<span className="ml-3 text-[18px] font-medium text-white/55">per maand, zonder btw</span></p>
          </div>
          <div className="rounded-[24px] bg-white/[.06] p-7 ring-1 ring-white/10 md:p-9">
            <ul className="space-y-3 text-[16px]">
              {["Onbeperkt bankregels, bonnen en facturen", "Bankkoppeling en alle verkoopkanalen", "Btw-aangifte, ICP, IB-indicatie en jaarrekening", "Herinneringen, iDEAL-links en e-facturen via Peppol", "Een bot die je vragen over je cijfers beantwoordt", "Overstappen met je hele historie"].map((x) => (
                <li key={x} className="flex gap-3"><Vink fel />{x}</li>
              ))}
            </ul>
            <Link href="/login" className="knop knop-groen mt-8 w-full justify-center py-4 text-[16px]">Start gratis, 30 dagen <Pijl /></Link>
            <p className="mt-4 text-center text-[14px] text-white/50">Geen creditcard nodig. Maandelijks opzegbaar.</p>
          </div>
        </div>
      </section>

      {/* Vragen */}
      <section id="vragen" className="mx-auto max-w-3xl px-3 py-20 md:px-6 md:py-28">
        <Eyebrow>Vragen</Eyebrow>
        <h2 className="display mt-4 text-[36px] font-bold leading-[1.02] tracking-[-0.02em] md:text-[48px]">Wat mensen ons vragen.</h2>
        <div className="mt-8">
          {vragen.map(([v, a]) => (
            <details key={v} className="vraag">
              <summary>{v}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Slot */}
      <section className="blok-donker mb-3 md:mb-6">
        <div className="px-7 py-16 text-center md:px-14 md:py-24">
          <h2 className="display mx-auto max-w-2xl text-[40px] font-bold leading-[1] tracking-[-0.03em] md:text-[64px]">Morgenochtend is je boekhouding al gedaan.</h2>
          <Link href="/login" className="knop knop-groen mt-9 px-8 py-4 text-[16px]">Start gratis, 30 dagen <Pijl /></Link>
          <p className="mt-4 text-[14px] text-white/50">Account in dertig seconden, alleen een e-mailadres.</p>
        </div>
      </section>

      <Voettekst />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-lijn bg-white/95 p-3 backdrop-blur sm:hidden">
        <Link href="/login" className="knop knop-groen w-full justify-center py-3.5 text-[15px]">Start gratis, 30 dagen</Link>
      </div>
    </main>
  );
}
