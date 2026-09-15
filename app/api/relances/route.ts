import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierSecret } from "@/lib/api-auth";

export async function GET(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const seuil = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  const prospects = await prisma.prospect.findMany({
    where: {
      derniereActivite: { lt: seuil },
      consentement: true, // cas limite : consentement retiré → pas de relance
      statutPipeline: { notIn: ["conclu", "perdu"] },
    },
    include: {
      conseiller: { select: { nom: true, email: true } },
      echanges: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    take: 20,
  });

  return NextResponse.json({
    total: prospects.length,
    prospects: prospects.map((p) => ({
      id: p.id,
      nom: p.nom,
      email: p.email,
      joursInactif: Math.floor(
        (Date.now() - p.derniereActivite.getTime()) / 86400000
      ),
      budget:
        p.budgetMin && p.budgetMax
          ? `${p.budgetMin}-${p.budgetMax} ${p.devise}`
          : "non renseigné",
      criteres: p.criteresValide,
      etape: p.statutPipeline,
      derniersEchanges: p.echanges.map((e) => e.contenu),
      conseiller: p.conseiller,
    })),
  });
}