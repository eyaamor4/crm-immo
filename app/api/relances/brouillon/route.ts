import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierSecret } from "@/lib/api-auth";

export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  let corps;
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "JSON invalide" }, { status: 400 });
  }

  const { prospectId, brouillon } = corps;
  if (!prospectId || !brouillon) {
    return NextResponse.json(
      { erreur: "prospectId et brouillon requis" },
      { status: 400 }
    );
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id: String(prospectId) },
  });
  if (!prospect) {
    return NextResponse.json({ erreur: "Prospect introuvable" }, { status: 404 });
  }

  // EXIGENCE 03 : le brouillon attend la validation du conseiller
  await prisma.tache.create({
    data: {
      prospectId: prospect.id,
      titre: `Relance à valider : ${String(brouillon).slice(0, 80)}…`,
      echeance: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.echange.create({
    data: {
      prospectId: prospect.id,
      type: "note",
      contenu: `Brouillon de relance généré :\n\n${brouillon}`,
    },
  });

  return NextResponse.json({ statut: "brouillon_enregistre" });
}