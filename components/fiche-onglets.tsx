"use client";

import { useState } from "react";
import { formatPrix } from "@/lib/format";
import type { Resultat } from "@/lib/matching";
import { ExtractionCriteres } from "@/components/extraction-criteres";

import { BlocRgpd } from "@/components/bloc-rgpd";

const LIBELLES_CRITERES: Record<string, string> = {
    villes: "Villes",
    type: "Type de bien",
    piecesMin: "Pièces minimum",
    surfaceMin: "Surface minimum",
    budgetMin: "Budget minimum",
    budgetMax: "Budget maximum",
    devise: "Devise",
};

type Props = {
    prospect: {
        id: string;
            
        nom: string;

        budgetMin: number | null;
        budgetMax: number | null;
        devise: string;
        critereBrut: string | null;
        criteresIA: unknown;
        criteresValide: unknown;
        consentement: boolean;
    };
    echanges: { id: string; type: string; contenu: string; createdAt: string }[];
    rendezVous: { id: string; debut: string; statut: string; bien: string | null }[];
    documents: { id: string; nom: string; url: string }[];
    taches: { id: string; titre: string; fait: boolean; echeance: string | null }[];
    matchs: Resultat[];
    erreurMatching: string | null;
};

const ONGLETS = [
    { cle: "apercu", libelle: "Aperçu" },
    { cle: "matching", libelle: "Biens compatibles" },
    { cle: "echanges", libelle: "Échanges" },
    { cle: "visites", libelle: "Visites" },
    { cle: "taches", libelle: "Tâches" },
    { cle: "documents", libelle: "Documents" },
];

function dateCourte(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function Vide({ texte }: { texte: string }) {
    return (
        <div className="rounded-xl border border-dashed border-sable-300 py-10 text-center text-sm text-encre-400">
            {texte}
        </div>
    );
}

export function FicheOnglets(props: Props) {
    const [actif, setActif] = useState("apercu");
    const { prospect, echanges, rendezVous, documents, taches, matchs } = props;

    const criteres = (prospect.criteresValide ?? null) as Record<string, unknown> | null;

    return (
        <div className="space-y-5">
            <nav className="flex gap-1 overflow-x-auto border-b border-sable-200">
                {ONGLETS.map((o) => (
                    <button
                        key={o.cle}
                        onClick={() => setActif(o.cle)}
                        className={`shrink-0 border-b-2 px-3 py-2 text-sm transition ${actif === o.cle
                            ? "border-foret-600 text-foret-700"
                            : "border-transparent text-encre-400 hover:text-encre-900"
                            }`}
                    >
                        {o.libelle}
                    </button>
                ))}
            </nav>

            {actif === "apercu" && (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-sable-200 bg-white p-5">
                        <h3 className="text-sm font-medium">Budget</h3>
                        <p className="mt-2 text-encre-600">
                            {prospect.budgetMin && prospect.budgetMax
                                ? `${formatPrix(prospect.budgetMin, prospect.devise)} — ${formatPrix(
                                    prospect.budgetMax,
                                    prospect.devise
                                )}`
                                : "Non renseigné"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-sable-200 bg-white p-5">
                        <h3 className="text-sm font-medium">Critères validés</h3>
                        {criteres && Object.keys(criteres).length > 0 ? (
                            <dl className="mt-2 space-y-1 text-sm">
                                {Object.entries(criteres).map(([k, v]) => (
                                    <div key={k} className="flex justify-between gap-4">
                                                                                <dt className="text-encre-400">{LIBELLES_CRITERES[k] ?? k}</dt>
                                        <dd>{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
                                    </div>
                                ))}
                            </dl>
                        ) : (
                            <p className="mt-2 text-sm text-encre-400">
                                Aucun critère validé. L'extraction IA reste à confirmer.
                            </p>
                        )}
                    </div>

                                     <div className="rounded-xl border border-sable-200 bg-white p-5 md:col-span-2">
                        <h3 className="text-sm font-medium">Note libre</h3>
                        <p className="mt-2 text-sm leading-relaxed text-encre-600">
                            {prospect.critereBrut ?? "Aucune note."}
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <ExtractionCriteres
                            prospectId={prospect.id}
                            criteresIA={prospect.criteresIA as Record<string, unknown> | null}
                            aUneNote={!!prospect.critereBrut}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <BlocRgpd
                            prospectId={prospect.id}
                            consentement={prospect.consentement}
                            nom={prospect.nom}
                        />
                    </div>

                </div>
            )}

            {actif === "matching" && (
                <div className="space-y-3">
                    {props.erreurMatching && (
                        <div className="rounded-lg border border-terre-500/30 bg-terre-50 px-4 py-2 text-sm text-terre-500">
                            {props.erreurMatching}
                        </div>
                    )}
                    {matchs.length === 0 ? (
                        <Vide texte="Aucun bien disponible ne correspond." />
                    ) : (
                        matchs.map((m) => (
                            <article
                                key={m.bien.id}
                                className="rounded-xl border border-sable-200 bg-white p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <span className="text-[11px] uppercase tracking-widest text-encre-400">
                                            {m.bien.reference}
                                        </span>
                                        <h3 className="text-lg">{m.bien.titre}</h3>
                                        <p className="text-sm text-encre-600">
                                            {m.bien.ville} · {formatPrix(m.bien.prix, m.bien.devise)}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="font-display text-3xl text-foret-700">
                                            {m.score}
                                        </p>
                                        <p className="text-[11px] uppercase tracking-wider text-encre-400">
                                            score
                                        </p>
                                    </div>
                                </div>

                                {m.penalites.length > 0 ? (
                                    <ul className="mt-3 space-y-1 border-t border-sable-200 pt-3">
                                        {m.penalites.map((p, i) => (
                                            <li
                                                key={i}
                                                className="flex justify-between gap-4 text-sm text-encre-600"
                                            >
                                                <span>{p.raison}</span>
                                                <span className="shrink-0 text-terre-500">
                                                    −{p.points}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-3 border-t border-sable-200 pt-3 text-sm text-foret-600">
                                        Correspond à tous les critères.
                                    </p>
                                )}
                            </article>
                        ))
                    )}
                </div>
            )}

            {actif === "echanges" && (
                <div className="space-y-2">
                    {echanges.length === 0 ? (
                        <Vide texte="Aucun échange enregistré." />
                    ) : (
                        echanges.map((e) => (
                            <div
                                key={e.id}
                                className="rounded-xl border border-sable-200 bg-white p-4"
                            >
                                <div className="flex justify-between gap-4">
                                    <span className="text-[11px] uppercase tracking-wider text-encre-400">
                                        {e.type}
                                    </span>
                                    <span className="text-[11px] text-encre-400">
                                        {dateCourte(e.createdAt)}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm">{e.contenu}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {actif === "visites" && (
                <div className="space-y-2">
                    {rendezVous.length === 0 ? (
                        <Vide texte="Aucune visite planifiée." />
                    ) : (
                        rendezVous.map((r) => (
                            <div
                                key={r.id}
                                className="flex items-center justify-between rounded-xl border border-sable-200 bg-white p-4"
                            >
                                <div>
                                    <p className="text-sm">{r.bien ?? "Bien non précisé"}</p>
                                    <p className="text-xs text-encre-400">{dateCourte(r.debut)}</p>
                                </div>
                                <span className="text-xs text-encre-600">{r.statut}</span>
                            </div>
                        ))
                    )}
                </div>
            )}

            {actif === "taches" && (
                <div className="space-y-2">
                    {taches.length === 0 ? (
                        <Vide texte="Aucune tâche." />
                    ) : (
                        taches.map((t) => (
                            <div
                                key={t.id}
                                className="flex items-center justify-between rounded-xl border border-sable-200 bg-white p-4"
                            >
                                <p className={`text-sm ${t.fait ? "text-encre-400 line-through" : ""}`}>
                                    {t.titre}
                                </p>
                                {t.echeance && (
                                    <span className="text-xs text-encre-400">
                                        {dateCourte(t.echeance)}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

                       {actif === "documents" && (
                <div className="space-y-2">
                    {documents.length === 0 ? (
                        <Vide texte="Aucun document." />
                    ) : (
                        documents.map((d) => (
                            <div
                                key={d.id}
                                onClick={() => window.open(d.url, "_blank")}
                                className="cursor-pointer rounded-xl border border-sable-200 bg-white p-4 text-sm transition hover:bg-sable-50"
                            >
                                {d.nom}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}