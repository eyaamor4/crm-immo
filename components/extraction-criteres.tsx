"use client";

import { useState, useTransition } from "react";
import {
  lancerExtraction,
  validerCriteres,
} from "@/app/(app)/prospects/[id]/actions";

const LIBELLES: Record<string, string> = {
  villes: "Villes",
  type: "Type de bien",
  piecesMin: "Pièces minimum",
  surfaceMin: "Surface minimum",
  budgetMin: "Budget minimum",
  budgetMax: "Budget maximum",
  devise: "Devise",
};

export function ExtractionCriteres({
  prospectId,
  criteresIA,
  aUneNote,
}: {
  prospectId: string;
  criteresIA: Record<string, unknown> | null;
  aUneNote: boolean;
}) {
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState<Record<string, unknown> | null>(
    criteresIA
  );

  function extraire() {
    setErreur(null);
    demarrer(async () => {
      const r = await lancerExtraction(prospectId);
      if (r?.erreur) setErreur(r.erreur);
      else window.location.reload();
    });
  }

  function valider() {
    if (!brouillon) return;
    setErreur(null);
    demarrer(async () => {
      const r = await validerCriteres(prospectId, brouillon);
      if (r?.erreur) setErreur(r.erreur);
      else window.location.reload();
    });
  }

  function modifier(cle: string, valeur: string) {
    if (!brouillon) return;
    const ancien = brouillon[cle];
    let nouveau: unknown = valeur;
    if (Array.isArray(ancien)) nouveau = valeur.split(",").map((s) => s.trim());
    else if (typeof ancien === "number") nouveau = Number(valeur) || 0;
    setBrouillon({ ...brouillon, [cle]: nouveau });
  }

  function retirer(cle: string) {
    if (!brouillon) return;
    const copie = { ...brouillon };
    delete copie[cle];
    setBrouillon(copie);
  }

  return (
    <div className="rounded-xl border border-sable-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">Extraction assistée</h3>
          <p className="mt-0.5 text-xs text-encre-400">
            L'IA propose, vous validez.
          </p>
        </div>
        <button
          onClick={extraire}
          disabled={enCours || !aUneNote}
          className="shrink-0 rounded-lg border border-sable-200 px-3 py-1.5 text-sm transition hover:bg-sable-100 disabled:opacity-40"
        >
          {enCours ? "Analyse…" : "Analyser la note"}
        </button>
      </div>

      {erreur && (
        <p className="mt-3 rounded-lg border border-terre-500/30 bg-terre-50 px-3 py-2 text-sm text-terre-500">
          {erreur}
        </p>
      )}

      {brouillon && Object.keys(brouillon).length > 0 && (
        <div className="mt-4 space-y-2 border-t border-sable-200 pt-4">
          <p className="text-[11px] uppercase tracking-wider text-encre-400">
            Brouillon — non validé
          </p>

          {Object.entries(brouillon).map(([cle, val]) => (
            <div key={cle} className="flex items-center gap-2">
              <label className="w-32 shrink-0 text-xs text-encre-400">
                {LIBELLES[cle] ?? cle}
              </label>
              <input
                value={Array.isArray(val) ? val.join(", ") : String(val)}
                onChange={(e) => modifier(cle, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-sable-200 px-2 py-1 text-sm"
              />
              <button
                onClick={() => retirer(cle)}
                className="shrink-0 px-1 text-encre-400 hover:text-terre-500"
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={valider}
            disabled={enCours}
            className="mt-2 w-full rounded-lg bg-foret-600 py-2 text-sm text-white transition hover:bg-foret-700 disabled:opacity-40"
          >
            Valider ces critères
          </button>
        </div>
      )}

      {!brouillon && !erreur && (
        <p className="mt-3 text-sm text-encre-400">
          {aUneNote
            ? "Lancez l'analyse pour obtenir un brouillon."
            : "Aucune note libre à analyser."}
        </p>
      )}
    </div>
  );
}