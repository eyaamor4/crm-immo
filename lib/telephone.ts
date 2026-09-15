// Normalisation pour la déduplication (W1)
export function normaliserTelephone(brut: string | null | undefined) {
  if (!brut) return null;
  const chiffres = brut.replace(/\D/g, "");
  if (!chiffres) return null;
  // On garde les 8 derniers chiffres : +216 20 000 000 et 20000000 se rejoignent
  return chiffres.slice(-8);
}