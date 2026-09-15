import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierSecret } from "@/lib/api-auth";

export async function GET(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  demain.setHours(0, 0, 0, 0);

  const finDemain = new Date(demain);
  finDemain.setHours(23, 59, 59, 999);

  const visites = await prisma.rendezVous.findMany({
    where: {
      debut: { gte: demain, lte: finDemain },
      statut: { not: "annule" },
    },
    include: {
      prospect: {
        select: {
          id: true,
          nom: true,
          email: true,
          telephone: true,
          budgetMin: true,
          budgetMax: true,
          devise: true,
          criteresValide: true,
          consentement: true,
        },
      },
      bien: {
        select: {
          reference: true,
          titre: true,
          ville: true,
          prix: true,
          devise: true,
          surface: true,
          pieces: true,
          statut: true,
        },
      },
      conseiller: { select: { nom: true, email: true } },
    },
    orderBy: { debut: "asc" },
  });

  // Cas limite : consentement retiré entre la planification et la veille
  const actives = visites.filter((v) => v.prospect.consentement);

  return NextResponse.json({
    total: actives.length,
    visites: actives.map((v) => ({
      id: v.id,
      debut: v.debut.toISOString(),
      fin: v.fin.toISOString(),
      heure: v.debut.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      prospect: {
        id: v.prospect.id,
        nom: v.prospect.nom,
        email: v.prospect.email,
        telephone: v.prospect.telephone,
        budget:
          v.prospect.budgetMin && v.prospect.budgetMax
            ? `${v.prospect.budgetMin}-${v.prospect.budgetMax} ${v.prospect.devise}`
            : "non renseigné",
        criteres: v.prospect.criteresValide,
      },
      bien: v.bien
        ? {
            reference: v.bien.reference,
            titre: v.bien.titre,
            ville: v.bien.ville,
            prix: `${v.bien.prix} ${v.bien.devise}`,
            surface: v.bien.surface,
            pieces: v.bien.pieces,
            // Cas limite : le bien a été réservé depuis la planification
            alerte:
              v.bien.statut !== "DISPONIBLE"
                ? `Ce bien est passé en ${v.bien.statut}`
                : null,
          }
        : null,
      conseiller: v.conseiller,
    })),
  });
}