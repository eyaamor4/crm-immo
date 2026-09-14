import { prisma } from "@/lib/prisma";

export type Penalite = { raison: string; points: number };
export type Resultat = {
    bien: {
        id: string;
        reference: string;
        titre: string;
        ville: string;
        prix: number;
        devise: string;
        surface: number | null;
        pieces: number | null;
        type: string;
    };
    score: number;
    penalites: Penalite[];
};

type Criteres = {
    villes?: string[];
    type?: string;
    piecesMin?: number;
    surfaceMin?: number;
};

export async function convertirEnTND(montant: number, devise: string) {
    if (devise === "TND") return montant;
    const taux = await prisma.tauxChange.findUnique({ where: { devise } });
    if (!taux) throw new Error(`Taux de change manquant pour ${devise}`);
    return Math.round(montant * taux.versTND);
}

export async function matcher(prospectId: string): Promise<Resultat[]> {
    const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
    });
    if (!prospect) throw new Error("Prospect introuvable");

    // EXIGENCE 01 : un lot réservé n'est jamais proposé
    const biens = await prisma.bien.findMany({
        where: { statut: "DISPONIBLE" },
    });

    const criteres = (prospect.criteresValide ?? {}) as Criteres;

    const budgetMaxTND = prospect.budgetMax
        ? await convertirEnTND(prospect.budgetMax, prospect.devise)
        : null;
    const budgetMinTND = prospect.budgetMin
        ? await convertirEnTND(prospect.budgetMin, prospect.devise)
        : null;

    const resultats = await Promise.all(
        biens.map(async (b) => {
            const prixTND = await convertirEnTND(b.prix, b.devise);
            const penalites: Penalite[] = [];

            if (budgetMaxTND && prixTND > budgetMaxTND) {
                const ecart = Math.round(((prixTND - budgetMaxTND) / budgetMaxTND) * 100);
                penalites.push({
                    raison: `Dépasse le budget de ${ecart} %`,
                    points: Math.min(50, ecart),
                });
            }
            if (budgetMinTND && prixTND < budgetMinTND * 0.6) {
                penalites.push({
                    raison: "Très en dessous du budget annoncé",
                    points: 15,
                });
            }
            if (criteres.villes?.length && !criteres.villes.includes(b.ville)) {
                penalites.push({ raison: `Ville hors zone (${b.ville})`, points: 25 });
            }
            if (criteres.type && criteres.type !== b.type) {
                penalites.push({ raison: `Type ${b.type} au lieu de ${criteres.type}`, points: 20 });
            }
            if (criteres.piecesMin && (b.pieces ?? 0) < criteres.piecesMin) {
                penalites.push({
                    raison: `${b.pieces ?? 0} pièces au lieu de ${criteres.piecesMin} minimum`,
                    points: 15,
                });
            }
            if (criteres.surfaceMin && (b.surface ?? 0) < criteres.surfaceMin) {
                penalites.push({
                    raison: `${b.surface ?? 0} m² au lieu de ${criteres.surfaceMin} minimum`,
                    points: 10,
                });
            }

            const score = Math.max(
                0,
                100 - penalites.reduce((s, p) => s + p.points, 0)
            );

            return {
                bien: {
                    id: b.id,
                    reference: b.reference,
                    titre: b.titre,
                    ville: b.ville,
                    prix: b.prix,
                    devise: b.devise,
                    surface: b.surface,
                    pieces: b.pieces,
                    type: b.type,
                },
                score,
                penalites,
            };
        })
    );

    return resultats.sort((a, b) => b.score - a.score).slice(0, 5);
}