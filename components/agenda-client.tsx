"use client";

import { useState, useTransition } from "react";
import { creerRendezVous, annulerRendezVous } from "@/app/(app)/agenda/actions";

type Option = { id: string; nom: string };
type Rdv = {
  id: string;
  debut: string;
  fin: string;
  statut: string;
  prospect: string;
  bien: string | null;
};

function formatCreneau(debut: string, fin: string) {
  const d = new Date(debut);
  const f = new Date(fin);
  return `${d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })} · ${d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })} — ${f.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function AgendaClient({
  prospects,
  biens,
  rendezVous,
}: {
  prospects: Option[];
  biens: Option[];
  rendezVous: Rdv[];
}) {
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const [prospectId, setProspectId] = useState("");
  const [bienId, setBienId] = useState("");
  const [debut, setDebut] = useState("");
  const [duree, setDuree] = useState(60);

  function planifier() {
    setErreur(null);
    setSucces(false);

    if (!prospectId) return setErreur("Choisissez un prospect.");
    if (!debut) return setErreur("Choisissez une date et une heure.");

    demarrer(async () => {
      const r = await creerRendezVous({
        prospectId,
        bienId: bienId || null,
        debut,
        dureeMinutes: duree,
      });
      if (r?.erreur) setErreur(r.erreur);
      else {
        setSucces(true);
        setDebut("");
        setTimeout(() => window.location.reload(), 600);
      }
    });
  }

  function annuler(id: string) {
    setErreur(null);
    demarrer(async () => {
      const r = await annulerRendezVous(id);
      if (r?.erreur) setErreur(r.erreur);
      else window.location.reload();
    });
  }

  const actifs = rendezVous.filter((r) => r.statut !== "annule");

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="rounded-xl border border-sable-200 bg-white p-5">
        <h2 className="text-sm font-medium">Planifier une visite</h2>

        {erreur && (
          <p className="mt-3 rounded-lg border border-terre-500/30 bg-terre-50 px-3 py-2 text-sm text-terre-500">
            {erreur}
          </p>
        )}
        {succes && (
          <p className="mt-3 rounded-lg border border-foret-500/30 bg-foret-50 px-3 py-2 text-sm text-foret-700">
            Visite confirmée.
          </p>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-encre-400">Prospect</label>
            <select
              value={prospectId}
              onChange={(e) => setProspectId(e.target.value)}
              className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
            >
              <option value="">Choisir…</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-encre-400">
              Bien (optionnel)
            </label>
            <select
              value={bienId}
              onChange={(e) => setBienId(e.target.value)}
              className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
            >
              <option value="">Aucun</option>
              {biens.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-encre-400">
              Date et heure
            </label>
            <input
              type="datetime-local"
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-encre-400">Durée</label>
            <select
              value={duree}
              onChange={(e) => setDuree(Number(e.target.value))}
              className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 heure</option>
              <option value={90}>1 h 30</option>
            </select>
          </div>

          <button
            onClick={planifier}
            disabled={enCours}
            className="w-full rounded-lg bg-foret-600 py-2 text-sm text-white transition hover:bg-foret-700 disabled:opacity-40"
          >
            {enCours ? "Vérification…" : "Planifier"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="px-1 text-sm font-medium">
          Visites à venir ({actifs.length})
        </h2>

        {actifs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sable-300 py-12 text-center text-sm text-encre-400">
            Aucune visite planifiée.
          </div>
        ) : (
          actifs.map((r) => (
            <article
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-sable-200 bg-white p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.prospect}</p>
                <p className="truncate text-xs text-encre-600">
                  {r.bien ?? "Bien non précisé"}
                </p>
                <p className="mt-1 text-xs text-encre-400">
                  {formatCreneau(r.debut, r.fin)}
                </p>
              </div>
              <button
                onClick={() => annuler(r.id)}
                disabled={enCours}
                className="shrink-0 rounded-lg border border-sable-200 px-3 py-1.5 text-xs text-encre-600 transition hover:bg-sable-100 disabled:opacity-40"
              >
                Annuler
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}