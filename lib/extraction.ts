import Groq from "groq-sdk";

export type CriteresExtraits = {
  villes?: string[];
  type?: string;
  piecesMin?: number;
  surfaceMin?: number;
  budgetMin?: number;
  budgetMax?: number;
  devise?: string;
};

const SYSTEME = `Tu extrais des critères de recherche immobilière depuis une note libre en français.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans balises markdown.

Clés autorisées (toutes optionnelles, omets celles que la note ne mentionne pas) :
- villes: tableau de noms de villes
- type: "appartement" | "villa" | "terrain" | "bureau"
- piecesMin: nombre entier
- surfaceMin: nombre en m²
- budgetMin: nombre entier, sans séparateur
- budgetMax: nombre entier, sans séparateur
- devise: "TND" | "EUR" | "USD"

N'invente rien. Si la note ne dit rien sur un critère, omets la clé.`;

export async function extraireCriteres(note: string): Promise<CriteresExtraits> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Clé API absente : l'extraction est indisponible.");
  }
  if (note.trim().length < 10) {
    throw new Error("La note est trop courte pour en extraire des critères.");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const reponse = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEME },
      { role: "user", content: note },
    ],
  });

  const brut = reponse.choices[0]?.message?.content;
  if (!brut) throw new Error("Le modèle n'a rien renvoyé.");

  let parse: unknown;
  try {
    parse = JSON.parse(brut);
  } catch {
    throw new Error("Le modèle a renvoyé un format inattendu.");
  }

  return nettoyer(parse);
}

// Garde-fou : on ne garde que les clés connues, avec le bon type.
function nettoyer(brut: unknown): CriteresExtraits {
  if (typeof brut !== "object" || brut === null) return {};
  const o = brut as Record<string, unknown>;
  const out: CriteresExtraits = {};

  if (Array.isArray(o.villes)) {
    const v = o.villes.filter((x): x is string => typeof x === "string");
    if (v.length) out.villes = v;
  }
  if (typeof o.type === "string") out.type = o.type.toLowerCase();
  if (typeof o.piecesMin === "number") out.piecesMin = Math.round(o.piecesMin);
  if (typeof o.surfaceMin === "number") out.surfaceMin = Math.round(o.surfaceMin);
  if (typeof o.budgetMin === "number") out.budgetMin = Math.round(o.budgetMin);
  if (typeof o.budgetMax === "number") out.budgetMax = Math.round(o.budgetMax);
  if (typeof o.devise === "string" && ["TND", "EUR", "USD"].includes(o.devise)) {
    out.devise = o.devise;
  }

  return out;
}