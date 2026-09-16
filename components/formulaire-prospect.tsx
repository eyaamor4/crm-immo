"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerProspect } from "@/app/(app)/prospects/actions";

const VIDE = {
  nom: "",
  email: "",
  telephone: "",
  budgetMin: "",
  budgetMax: "",
  devise: "TND",
  note: "",
};

export function FormulaireProspect() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [lienDoublon, setLienDoublon] = useState<string | null>(null);
  const [champs, setChamps] = useState(VIDE);

  function modifier(cle: keyof typeof VIDE, valeur: string) {
    setChamps((c) => ({ ...c, [cle]: valeur }));
  }

  function enregistrer() {
    setErreur(null);
    setLienDoublon(null);

    demarrer(async () => {
      const r = await creerProspect(champs);
      if (r?.erreur) {
        setErreur(r.erreur);
        if (r.prospectExistant) setLienDoublon(r.prospectExistant);
        return;
      }
      setChamps(VIDE);
      setOuvert(false);
      if (r?.prospectId) router.push(`/prospects/${r.prospectId}`);
    });
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="rounded-lg bg-foret-600 px-4 py-2 text-sm text-white transition hover:bg-foret-700"
      >
        Nouveau prospect
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-encre-900/40 md:items-center md:p-6"
      onClick={() => setOuvert(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-6 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl">Nouveau prospect</h2>
          <button
            onClick={() => setOuvert(false)}
            className="text-sm text-encre-400 hover:text-encre-900"
          >
            Fermer
          </button>
        </div>

        {erreur && (
          <div className="mb-4 rounded-lg border border-terre-500/30 bg-terre-50 px-3 py-2 text-sm text-terre-500">
            {erreur}
            {lienDoublon && (
              <button
                onClick={() => router.push(`/prospects/${lienDoublon}`)}
                className="mt-1 block underline"
              >
                Ouvrir le dossier existant
              </button>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-encre-400">Nom *</label>
            <input
              value={champs.nom}
              onChange={(e) => modifier("nom", e.target.value)}
              className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-encre-400">E-mail</label>
              <input
                type="email"
                value={champs.email}
                onChange={(e) => modifier("email", e.target.value)}
                className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-encre-400">
                Téléphone
              </label>
              <input
                value={champs.telephone}
                onChange={(e) => modifier("telephone", e.target.value)}
                className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-encre-400">
                Budget min
              </label>
              <input
                type="number"
                value={champs.budgetMin}
                onChange={(e) => modifier("budgetMin", e.target.value)}
                className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-encre-400">
                Budget max
              </label>
              <input
                type="number"
                value={champs.budgetMax}
                onChange={(e) => modifier("budgetMax", e.target.value)}
                className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-encre-400">Devise</label>
              <select
                value={champs.devise}
                onChange={(e) => modifier("devise", e.target.value)}
                className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
              >
                <option value="TND">TND</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-encre-400">
              Note libre
            </label>
            <textarea
              rows={3}
              value={champs.note}
              onChange={(e) => modifier("note", e.target.value)}
              placeholder="Ce que recherche le prospect, en texte libre. L'IA pourra en extraire les critères."
              className="w-full rounded-lg border border-sable-200 px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={enregistrer}
            disabled={enCours}
            className="w-full rounded-lg bg-foret-600 py-2 text-sm text-white transition hover:bg-foret-700 disabled:opacity-40"
          >
            {enCours ? "Création…" : "Créer le dossier"}
          </button>

          <p className="text-center text-xs text-encre-400">
            Le consentement est enregistré à la création.
          </p>
        </div>
      </div>
    </div>
  );
}