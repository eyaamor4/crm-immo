import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AgendaClient } from "@/components/agenda-client";

export default async function AgendaPage() {
  const session = await auth();
  const conseillerId = session!.user.id;

  const [prospects, biens, rendezVous] = await Promise.all([
    prisma.prospect.findMany({
      where: { conseillerId, consentement: true },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.bien.findMany({
      where: { statut: "DISPONIBLE" },
      select: { id: true, titre: true, reference: true },
      orderBy: { reference: "asc" },
    }),
    prisma.rendezVous.findMany({
      where: { conseillerId },
      orderBy: { debut: "asc" },
      include: {
        prospect: { select: { nom: true } },
        bien: { select: { titre: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Agenda</h1>
        <p className="mt-1 text-sm text-encre-600">
          Les créneaux en conflit sont refusés automatiquement.
        </p>
      </div>

      <AgendaClient
        prospects={prospects}
        biens={biens.map((b) => ({
          id: b.id,
          nom: `${b.reference} — ${b.titre}`,
        }))}
        rendezVous={rendezVous.map((r) => ({
          id: r.id,
          debut: r.debut.toISOString(),
          fin: r.fin.toISOString(),
          statut: r.statut,
          prospect: r.prospect.nom,
          bien: r.bien?.titre ?? null,
        }))}
      />
    </div>
  );
}