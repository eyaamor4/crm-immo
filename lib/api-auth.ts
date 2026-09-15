export function verifierSecret(request: Request) {
  const entete = request.headers.get("x-n8n-secret");
  if (!process.env.N8N_SECRET) return false;
  return entete === process.env.N8N_SECRET;
}

// EXIGENCE 02 : masquage des données personnelles dans les logs
export function masquer(valeur: string | null | undefined) {
  if (!valeur) return null;
  if (valeur.includes("@")) {
    const [avant, apres] = valeur.split("@");
    return `${avant.slice(0, 2)}***@${apres}`;
  }
  return `${valeur.slice(0, 4)}***${valeur.slice(-2)}`;
}