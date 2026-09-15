import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      echanges: true,
      rendezVous: { include: { bien: { select: { reference: true, titre: true } } } },
      documents: true,
      taches: true,
      conseiller: { select: { nom: true } },
    },
  });

  if (!prospect || prospect.conseillerId !== session.user.id) {
    return NextResponse.json({ erreur: "Introuvable" }, { status: 404 });
  }

  const dossier = {
    exporteLe: new Date().toISOString(),
    identite: {
      nom: prospect.nom,
      email: prospect.email,
      telephone: prospect.telephone,
    },
    consentement: {
      actif: prospect.consentement,
      donneLe: prospect.consentementAt,
    },
    recherche: {
      budgetMin: prospect.budgetMin,
      budgetMax: prospect.budgetMax,
      devise: prospect.devise,
      noteLibre: prospect.critereBrut,
      criteresValides: prospect.criteresValide,
    },
    suivi: {
      etape: prospect.statutPipeline,
      conseiller: prospect.conseiller.nom,
      creeLe: prospect.createdAt,
      derniereActivite: prospect.derniereActivite,
    },
    echanges: prospect.echanges.map((e) => ({
      date: e.createdAt,
      type: e.type,
      contenu: e.contenu,
    })),
    visites: prospect.rendezVous.map((r) => ({
      debut: r.debut,
      fin: r.fin,
      statut: r.statut,
      bien: r.bien?.titre ?? null,
    })),
    documents: prospect.documents.map((d) => ({ nom: d.nom, url: d.url })),
    taches: prospect.taches.map((t) => ({
      titre: t.titre,
      fait: t.fait,
      echeance: t.echeance,
    })),
  };

  const nomFichier = `donnees-${prospect.nom.toLowerCase().replace(/\s+/g, "-")}.json`;

  return new NextResponse(JSON.stringify(dossier, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
    },
  });
}