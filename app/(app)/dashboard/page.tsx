import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();

  const [nbProspects, nbBiens, nbRdv] = await Promise.all([
    prisma.prospect.count({ where: { conseillerId: session!.user.id } }),
    prisma.bien.count({ where: { statut: "DISPONIBLE" } }),
    prisma.rendezVous.count({ where: { conseillerId: session!.user.id } }),
  ]);

  const stats = [
    { label: "Prospects actifs", valeur: nbProspects },
    { label: "Biens disponibles", valeur: nbBiens },
    { label: "Visites planifiées", valeur: nbRdv },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Bonjour {session?.user?.name?.split(" ")[0]}</h1>
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

      <div className="rounded-xl border border-dashed border-sable-300 p-10 text-center">
        <p className="text-sm text-encre-400">Le pipeline arrive ici.</p>
      </div>
    </div>
  );
}