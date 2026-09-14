export function formatPrix(montant: number, devise: string = "TND") {
    return new Intl.NumberFormat("fr-TN", {
        style: "currency",
        currency: devise,
        maximumFractionDigits: 0,
    }).format(montant);
}

export const LIBELLES_STATUT: Record<string, string> = {
    DISPONIBLE: "Disponible",
    RESERVE: "Réservé",
    VENDU: "Vendu",
    RETIRE: "Retiré",
};

export const CLASSES_STATUT: Record<string, string> = {
    DISPONIBLE: "bg-foret-50 text-foret-700 ring-foret-500/20",
    RESERVE: "bg-terre-50 text-terre-500 ring-terre-500/20",
    VENDU: "bg-sable-100 text-encre-600 ring-encre-400/20",
    RETIRE: "bg-sable-100 text-encre-400 ring-encre-400/20",
};