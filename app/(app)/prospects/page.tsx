import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/format";
import Link from "next/link";

export default async function ProspectsPage() {
    const session = await auth();

    const prospects = await prisma.prospect.findMany({
        where: { conseillerId: session!.user.id },
        orderBy: { derniereActivite: "desc" },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl">Prospects</h1>
                <p className="mt-1 text-sm text-encre-600">
                    {prospects.length} dossier{prospects.length > 1 ? "s" : ""} au portefeuille
                </p>
            </div>

            {prospects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-sable-300 p-12 text-center">
                    <p className="text-sm text-encre-400">Aucun prospect pour l'instant.</p>
                </div>
            ) : (
                <div className="divide-y divide-sable-200 overflow-hidden rounded-xl border border-sable-200 bg-white">
                    {prospects.map((p) => (
                        <Link
                            key={p.id}
                            href={`/prospects/${p.id}`}
                            className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-sable-50"
                        >
                            <div className="min-w-0">
                                <p className="font-medium">{p.nom}</p>
                                <p className="truncate text-sm text-encre-400">
                                    {p.email ?? p.telephone ?? "Pas de coordonnées"}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                {p.montantPotentiel && (
                                    <p className="font-display text-lg text-foret-700">
                                        {formatPrix(p.montantPotentiel, p.devise)}
                                    </p>
                                )}
                                {!p.consentement && (
                                    <span className="text-[11px] text-terre-500">
                                        Consentement retiré
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}