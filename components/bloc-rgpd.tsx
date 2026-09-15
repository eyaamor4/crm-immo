"use client";

import { useState, useTransition } from "react";
import {
  basculerConsentement,
  supprimerProspect,
} from "@/app/(app)/prospects/[id]/actions";

export function BlocRgpd({
  prospectId,
  consentement,
  nom,
}: {
  prospectId: string;
  consentement: boolean;
  nom: string;
}) {
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  function basculer() {
    setErreur(null);
    demarrer(async () => {
      const r = await basculerConsentement(prospectId);
      if (r?.erreur) setErreur(r.erreur);
      else window.location.reload();
    });
  }

  function supprimer() {
    setErreur(null);
    demarrer(async () => {
      const r = await supprimerProspect(prospectId);
      if (r?.erreur) setErreur(r.erreur);
    });
  }

  return (
    <div className="rounded-xl border border-sable-200 bg-white p-5">
      <h3 className="text-sm font-medium">Données personnelles</h3>
      <p className="mt-0.5 text-xs text-encre-400">
        Droits d'accès, de rectification et d'effacement.
      </p>

      {erreur && (
        <p className="mt-3 rounded-lg border border-terre-500/30 bg-terre-50 px-3 py-2 text-sm text-terre-500">
          {erreur}
        </p>
      )}

           <div className="mt-4 space-y-2">
        <button
          onClick={() => window.open(`/api/prospects/${prospectId}/export`, "_blank")}
          className="w-full rounded-lg border border-sable-200 py-2 text-center text-sm transition hover:bg-sable-100"
        >
          Exporter le dossier (JSON)
        </button>

        <button
          onClick={basculer}
          disabled={enCours}
          className="w-full rounded-lg border border-sable-200 py-2 text-sm transition hover:bg-sable-100 disabled:opacity-40"
        >
          {consentement ? "Retirer le consentement" : "Rétablir le consentement"}
        </button>

        {!confirmation ? (
          <button
            onClick={() => setConfirmation(true)}
            disabled={enCours}
            className="w-full rounded-lg border border-terre-500/40 py-2 text-sm text-terre-500 transition hover:bg-terre-50 disabled:opacity-40"
          >
            Supprimer définitivement
          </button>
        ) : (
          <div className="rounded-lg border border-terre-500/40 bg-terre-50 p-3">
            <p className="text-sm text-terre-500">
              Supprimer {nom} et tout son historique ? Cette action est
              irréversible.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={supprimer}
                disabled={enCours}
                className="flex-1 rounded-lg bg-terre-500 py-2 text-sm text-white disabled:opacity-40"
              >
                {enCours ? "Suppression…" : "Confirmer"}
              </button>
              <button
                onClick={() => setConfirmation(false)}
                className="flex-1 rounded-lg border border-sable-200 bg-white py-2 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {!consentement && (
        <p className="mt-3 border-t border-sable-200 pt-3 text-xs text-terre-500">
          Consentement retiré : ce prospect est exclu des relances automatiques
          et aucune visite ne peut lui être planifiée.
        </p>
      )}
    </div>
  );
}