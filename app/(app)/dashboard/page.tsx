import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Pipeline } from "@/components/pipeline";

export default async function DashboardPage() {
  const session = await auth();
  const conseillerId = session!.user.id;

  const [colonnes, prospectsBruts, nbBiens, nbRdv] = await Promise.all([
    prisma.colonnePipeline.findMany({ orderBy: { ordre: "asc" } }),
    prisma.prospect.findMany({
      where: { conseillerId },
      orderBy: { derniereActivite: "desc" },
      include: {
        taches: {
          where: { fait: false },
          orderBy: { echeance: "asc" },
          take: 1,
        },
      },
    }),
    prisma.bien.count({ where: { statut: "DISPONIBLE" } }),
    prisma.rendezVous.count({ where: { conseillerId } }),
  ]);

  const prospects = prospectsBruts.map((p) => ({
    id: p.id,
    nom: p.nom,
    statutPipeline: p.statutPipeline,
    montantPotentiel: p.montantPotentiel,
    devise: p.devise,
    derniereActivite: p.derniereActivite.toISOString(),
    prochaineTache: p.taches[0]?.titre ?? null,
  }));

  const stats = [
    { label: "Prospects actifs", valeur: prospects.length },
    { label: "Biens disponibles", valeur: nbBiens },
    { label: "Visites planifiées", valeur: nbRdv },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">
          Bonjour {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-encre-600">
          Voici l'état de votre portefeuille aujourd'hui.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-sable-200 bg-white p-5"
          >
            <p className="text-xs uppercase tracking-wider text-encre-400">
              {s.label}
            </p>
            <p className="mt-2 font-display text-3xl text-foret-700">
              {s.valeur}
            </p>
          </div>
        ))}
      </div>

      <Pipeline colonnes={colonnes} prospects={prospects} />
    </div>
  );
}