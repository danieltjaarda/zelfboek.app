import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { abonnementStatus, huidigeOnderneming, logUit, vereisGebruiker, wisselOnderneming } from "@/lib/auth";
import { Zijbalk } from "@/components/Zijbalk";

export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessie = await vereisGebruiker();
  const o = await huidigeOnderneming();
  const status = abonnementStatus(o);
  const [ondernemingen, ongelezen, twijfel] = await Promise.all([
    db.lidmaatschap.findMany({ where: { gebruikerId: sessie.gebruikerId }, include: { onderneming: true } }),
    db.melding.count({ where: { ondernemingId: o.id, gelezen: false } }),
    db.transactie.count({ where: { ondernemingId: o.id, bevestigd: false, zakelijk: { not: null } } }),
  ]);

  async function uitloggen() {
    "use server";
    await logUit();
    redirect("/login");
  }
  async function wissel(fd: FormData) {
    "use server";
    await wisselOnderneming(String(fd.get("id")));
    redirect("/app");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Zijbalk
        onderneming={{ id: o.id, naam: o.naam }}
        ondernemingen={ondernemingen.map((l) => ({ id: l.ondernemingId, naam: l.onderneming.naam }))}
        email={sessie.gebruiker.email}
        status={status}
        tellers={{ meldingen: ongelezen, bank: twijfel }}
        uitloggen={uitloggen}
        wissel={wissel}
      />
      <main className="min-w-0 flex-1 px-5 py-7 md:px-10 md:py-9">
        {!status.toegang && (
          <p className="mb-6 rounded-lg bg-rood-licht px-4 py-3 text-sm text-rood-tekst">
            Je proefperiode is voorbij. <Link href="/app/instellingen?tab=abonnement" className="underline">Start je abonnement</Link> om verder te boeken. Bekijken kan altijd.
          </p>
        )}
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
