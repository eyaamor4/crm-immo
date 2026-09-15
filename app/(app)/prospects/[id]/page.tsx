import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { matcher, type Resultat } from "@/lib/matching";
import { formatPrix } from "@/lib/format";
import { FicheOnglets } from "@/components/fiche-onglets";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function FicheProspect({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth();

    const prospect = await prisma.prospect.findUnique({
        where: { id },
        include: {
            echanges: { orderBy: { createdAt: "desc" }, take: 20 },
            rendezVous: {
                orderBy: { debut: "desc" },
                include: { bien: { select: { titre: true, reference: true } } },
            },
            documents: { orderBy: { createdAt: "desc" } },
            taches: { orderBy: { echeance: "asc" } },
        },
    });

    if (!prospect) notFound();
    if (prospect.conseillerId !== session!.user.id) notFound();

    let matchs: Resultat[];
    let erreurMatching: string | null = null;
    try {
        matchs = await matcher(prospect.id);
    } catch (e) {
        matchs = [];
        erreurMatching =
            e instanceof Error ? e.message : "Le matching est indisponible.";
    }

    return (
        <div className="space-y-6">
            <Link
                href="/prospects"
                className="text-sm text-encre-400 hover:text-encre-900"
            >
                ← Prospects
            </Link>

            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl">{prospect.nom}</h1>
                    <p className="mt-1 text-sm text-encre-600">
                        {[prospect.email, prospect.telephone].filter(Boolean).join(" · ") ||
                            "Pas de coordonnées"}
                    </p>
                </div>
                <div className="text-right">
                    {prospect.montantPotentiel && (
                        <p className="font-display text-2xl text-foret-700">
                            {formatPrix(prospect.montantPotentiel, prospect.devise)}
                        </p>
                    )}
                    <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] ring-1 ring-inset ${prospect.consentement
                            ? "bg-foret-50 text-foret-700 ring-foret-500/20"
                            : "bg-terre-50 text-terre-500 ring-terre-500/20"
                            }`}
                    >
                        {prospect.consentement ? "Consentement actif" : "Consentement retiré"}
                    </span>
                </div>
            </header>

            <FicheOnglets
                prospect={{
                    id: prospect.id,
                    budgetMin: prospect.budgetMin,
                    budgetMax: prospect.budgetMax,
                    devise: prospect.devise,
                    critereBrut: prospect.critereBrut,
                    criteresIA: prospect.criteresIA,
                    criteresValide: prospect.criteresValide,
                    consentement: prospect.consentement,
                }}
                echanges={prospect.echanges.map((e) => ({
                    id: e.id,
                    type: e.type,
                    contenu: e.contenu,
                    createdAt: e.createdAt.toISOString(),
                }))}
                rendezVous={prospect.rendezVous.map((r) => ({
                    id: r.id,
                    debut: r.debut.toISOString(),
                    statut: r.statut,
                    bien: r.bien?.titre ?? null,
                }))}
                documents={prospect.documents.map((d) => ({
                    id: d.id,
                    nom: d.nom,
                    url: d.url,
                }))}
                taches={prospect.taches.map((t) => ({
                    id: t.id,
                    titre: t.titre,
                    fait: t.fait,
                    echeance: t.echeance?.toISOString() ?? null,
                }))}
                matchs={matchs}
                erreurMatching={erreurMatching}
            />
        </div>
    );
}