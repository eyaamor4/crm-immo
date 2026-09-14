"use client";

import { useState, useTransition } from "react";
import { deplacerProspect } from "@/app/(app)/dashboard/actions";
import { formatPrix } from "@/lib/format";

type Colonne = { id: string; cle: string; libelle: string };
type Prospect = {
    id: string;
    nom: string;
    statutPipeline: string;
    montantPotentiel: number | null;
    devise: string;
    derniereActivite: string;
    prochaineTache: string | null;
};

function joursDepuis(iso: string) {
    const j = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (j === 0) return "aujourd'hui";
    if (j === 1) return "hier";
    return `il y a ${j} j`;
}

export function Pipeline({
    colonnes,
    prospects,
}: {
    colonnes: Colonne[];
    prospects: Prospect[];
}) {
    const [enCours, demarrer] = useTransition();
    const [erreur, setErreur] = useState<string | null>(null);
    const [menuOuvert, setMenuOuvert] = useState<string | null>(null);

    function deplacer(id: string, cle: string) {
        setMenuOuvert(null);
        setErreur(null);
        demarrer(async () => {
            const r = await deplacerProspect(id, cle);
            if (r?.erreur) setErreur(r.erreur);
        });
    }

    return (
        <div className="space-y-4">
            {erreur && (
                <div className="rounded-lg border border-terre-500/30 bg-terre-50 px-4 py-2 text-sm text-terre-500">
                    {erreur}
                </div>
            )}

            <div
                className={`flex gap-4 overflow-x-auto pb-4 ${enCours ? "opacity-60" : ""
                    }`}
            >
                {colonnes.map((col) => {
                    const cartes = prospects.filter((p) => p.statutPipeline === col.cle);
                    const total = cartes.reduce(
                        (s, p) => s + (p.montantPotentiel ?? 0),
                        0
                    );

                    return (
                        <section key={col.id} className="w-72 shrink-0">
                            <header className="mb-3 flex items-baseline justify-between px-1">
                                <h2 className="text-sm font-medium">{col.libelle}</h2>
                                <span className="text-xs text-encre-400">{cartes.length}</span>
                            </header>

                            {total > 0 && (
                                <p className="mb-2 px-1 text-[11px] uppercase tracking-wider text-encre-400">
                                    {formatPrix(total)}
                                </p>
                            )}

                            <div className="space-y-2">
                                {cartes.map((p) => (
                                    <article
                                        key={p.id}
                                        className="relative rounded-xl border border-sable-200 bg-white p-4"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-sm font-medium">{p.nom}</h3>
                                            <button
                                                onClick={() =>
                                                    setMenuOuvert(menuOuvert === p.id ? null : p.id)
                                                }
                                                className="rounded px-1.5 text-encre-400 hover:bg-sable-100"
                                            >
                                                ⋯
                                            </button>
                                        </div>

                                        {p.montantPotentiel && (
                                            <p className="mt-1 font-display text-lg text-foret-700">
                                                {formatPrix(p.montantPotentiel, p.devise)}
                                            </p>
                                        )}

                                        <p className="mt-2 text-xs text-encre-600">
                                            {p.prochaineTache ?? "Aucune action prévue"}
                                        </p>

                                        <p className="mt-1 text-[11px] text-encre-400">
                                            Contact {joursDepuis(p.derniereActivite)}
                                        </p>

                                        {menuOuvert === p.id && (
                                            <div className="absolute right-3 top-10 z-10 w-48 overflow-hidden rounded-lg border border-sable-200 bg-white shadow-lg">
                                                {colonnes
                                                    .filter((c) => c.cle !== p.statutPipeline)
                                                    .map((c) => (
                                                        <button
                                                            key={c.id}
                                                            onClick={() => deplacer(p.id, c.cle)}
                                                            className="block w-full px-3 py-2 text-left text-sm hover:bg-sable-100"
                                                        >
                                                            {c.libelle}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </article>
                                ))}

                                {cartes.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-sable-300 py-8 text-center text-xs text-encre-400">
                                        Vide
                                    </div>
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}