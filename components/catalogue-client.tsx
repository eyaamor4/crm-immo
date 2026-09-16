"use client";

import { useState } from "react";
import { formatPrix, LIBELLES_STATUT, CLASSES_STATUT } from "@/lib/format";

type Bien = {
    id: string;
    reference: string;
    titre: string;
    planUrl: string | null;
    type: string;
    prix: number;
    devise: string;
    surface: number | null;
    pieces: number | null;
    ville: string;
    statut: string;
};

export function CatalogueClient({ biens }: { biens: Bien[] }) {
    const [selection, setSelection] = useState<string[]>([]);
    const [comparer, setComparer] = useState(false);

    function basculer(id: string) {
        setSelection((s) =>
            s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s
        );
    }

    const selectionnes = biens.filter((b) => selection.includes(b.id));

    if (biens.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-sable-300 p-12 text-center">
                <p className="text-sm text-encre-400">
                    Aucun bien ne correspond à ces critères.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {biens.map((b) => {
                    const actif = selection.includes(b.id);
                    return (
                        <article
                            key={b.id}
                            className={`rounded-xl border bg-white p-5 transition ${actif
                                ? "border-foret-500 ring-1 ring-foret-500"
                                : "border-sable-200"
                                }`}
                        >
                                          {b.planUrl && (
                <div className="mb-3 -mx-5 -mt-5 overflow-hidden rounded-t-xl bg-sable-100">
                  <img
                    src={b.planUrl}
                    alt={`Plan de ${b.titre}`}
                    className="h-40 w-full object-cover"
                  />
                </div>
              )}
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-[11px] uppercase tracking-widest text-encre-400">
                                    {b.reference}
                                </span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${CLASSES_STATUT[b.statut]
                                        }`}
                                >
                                    {LIBELLES_STATUT[b.statut]}
                                </span>
                            </div>

                            <h3 className="mt-2 text-lg leading-snug">{b.titre}</h3>
                            <p className="mt-0.5 text-sm text-encre-600">{b.ville}</p>

                            <p className="mt-3 font-display text-2xl text-foret-700">
                                {formatPrix(b.prix, b.devise)}
                            </p>

                            <dl className="mt-3 flex gap-5 text-sm text-encre-600">
                                {b.surface && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-encre-400">
                                            Surface
                                        </dt>
                                        <dd>{b.surface} m²</dd>
                                    </div>
                                )}
                                {b.pieces && (
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wider text-encre-400">
                                            Pièces
                                        </dt>
                                        <dd>{b.pieces}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-[11px] uppercase tracking-wider text-encre-400">
                                        Type
                                    </dt>
                                    <dd className="capitalize">{b.type}</dd>
                                </div>
                            </dl>

                            <button
                                onClick={() => basculer(b.id)}
                                disabled={!actif && selection.length >= 3}
                                className="mt-4 w-full rounded-lg border border-sable-200 py-2 text-sm text-encre-600 transition hover:bg-sable-100 disabled:opacity-40"
                            >
                                {actif ? "Retirer de la comparaison" : "Comparer"}
                            </button>
                        </article>
                    );
                })}
            </div>

            {/* Barre de comparaison */}
            {selection.length > 0 && (
                <div className="fixed inset-x-0 bottom-16 z-20 mx-4 flex items-center justify-between gap-4 rounded-xl border border-sable-200 bg-white px-5 py-3 shadow-lg md:bottom-6 md:mx-8">
                    <p className="text-sm text-encre-600">
                        {selection.length} bien{selection.length > 1 ? "s" : ""} sélectionné
                        {selection.length > 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelection([])}
                            className="rounded-lg px-3 py-1.5 text-sm text-encre-400 hover:text-encre-900"
                        >
                            Effacer
                        </button>
                        <button
                            onClick={() => setComparer(true)}
                            disabled={selection.length < 2}
                            className="rounded-lg bg-foret-600 px-4 py-1.5 text-sm text-white transition hover:bg-foret-700 disabled:opacity-40"
                        >
                            Comparer
                        </button>
                    </div>
                </div>
            )}

            {/* Modale de comparaison */}
            {comparer && (
                <div
                    className="fixed inset-0 z-30 flex items-end justify-center bg-encre-900/40 p-0 md:items-center md:p-6"
                    onClick={() => setComparer(false)}
                >
                    <div
                        className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-t-2xl bg-white p-6 md:rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl">Comparaison</h2>
                            <button
                                onClick={() => setComparer(false)}
                                className="text-sm text-encre-400 hover:text-encre-900"
                            >
                                Fermer
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody>
                                    {[
                                        ["Référence", (b: Bien) => b.reference],
                                        ["Titre", (b: Bien) => b.titre],
                                        ["Ville", (b: Bien) => b.ville],
                                        ["Prix", (b: Bien) => formatPrix(b.prix, b.devise)],
                                        ["Surface", (b: Bien) => (b.surface ? `${b.surface} m²` : "—")],
                                        ["Pièces", (b: Bien) => b.pieces ?? "—"],
                                        ["Statut", (b: Bien) => LIBELLES_STATUT[b.statut]],
                                    ].map(([label, get]) => (
                                        <tr key={label as string} className="border-b border-sable-200">
                                            <th className="py-3 pr-4 text-left text-[11px] uppercase tracking-wider font-normal text-encre-400 whitespace-nowrap">
                                                {label as string}
                                            </th>
                                            {selectionnes.map((b) => (
                                                <td key={b.id} className="py-3 pr-4">
                                                    {(get as (b: Bien) => React.ReactNode)(b)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}