import { prisma } from "@/lib/prisma";
import { CatalogueClient } from "@/components/catalogue-client";
import Link from "next/link";
import { LIBELLES_STATUT } from "@/lib/format";

export default async function BiensPage({
    searchParams,
}: {
    searchParams: Promise<{ ville?: string; type?: string; statut?: string }>;
}) {
    const params = await searchParams;

    const biens = await prisma.bien.findMany({
        where: {
            ...(params.ville ? { ville: params.ville } : {}),
            ...(params.type ? { type: params.type } : {}),
            ...(params.statut ? { statut: params.statut as never } : {}),
        },
        orderBy: { createdAt: "desc" },
    });

    const villes = [...new Set((await prisma.bien.findMany({ select: { ville: true } })).map((b) => b.ville))];
    const types = [...new Set((await prisma.bien.findMany({ select: { type: true } })).map((b) => b.type))];

    const filtres = [
        { cle: "ville", valeurs: villes },
        { cle: "type", valeurs: types },
        { cle: "statut", valeurs: ["DISPONIBLE", "RESERVE", "VENDU"] },
    ];

    function lien(cle: string, valeur?: string) {
        const p = new URLSearchParams(params as Record<string, string>);
        if (valeur) p.set(cle, valeur);
        else p.delete(cle);
        const q = p.toString();
        return q ? `/biens?${q}` : "/biens";
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl">Catalogue</h1>
                    <p className="mt-1 text-sm text-encre-600">
                        {biens.length} bien{biens.length > 1 ? "s" : ""} au portefeuille
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {filtres.map((f) =>
                    f.valeurs.map((v) => {
                        const actif = params[f.cle as keyof typeof params] === v;
                        return (
                            <Link
                                key={f.cle + v}
                                href={lien(f.cle, actif ? undefined : v)}
                                className={`rounded-full border px-3 py-1 text-xs transition ${actif
                                    ? "border-foret-600 bg-foret-600 text-white"
                                    : "border-sable-200 bg-white text-encre-600 hover:bg-sable-100"
                                    }`}
                            >
                                {LIBELLES_STATUT[v] ?? v}
                            </Link>
                        );
                    })
                )}
                {Object.keys(params).length > 0 && (
                    <Link
                        href="/biens"
                        className="rounded-full px-3 py-1 text-xs text-encre-400 hover:text-encre-900"
                    >
                        Réinitialiser
                    </Link>
                )}
            </div>

            <CatalogueClient biens={biens} />
        </div>
    );
}