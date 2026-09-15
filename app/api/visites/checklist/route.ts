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

  const { prospectId, visiteId, elements } = corps;

  if (!prospectId || !Array.isArray(elements)) {
    return NextResponse.json(
      { erreur: "prospectId et elements requis" },
      { status: 400 }
    );
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id: String(prospectId) },
  });
  if (!prospect) {
    return NextResponse.json({ erreur: "Prospect introuvable" }, { status: 404 });
  }

  const demain = new Date();
  demain.setDate(demain.getDate() + 1);

  await prisma.$transaction([
    ...elements.slice(0, 10).map((el: string) =>
      prisma.tache.create({
        data: {
          prospectId: prospect.id,
          titre: String(el).slice(0, 200),
          echeance: demain,
        },
      })
    ),
    prisma.echange.create({
      data: {
        prospectId: prospect.id,
        type: "note",
        contenu: `Checklist de préparation générée pour la visite${
          visiteId ? ` (${visiteId})` : ""
        }`,
      },
    }),
  ]);

  return NextResponse.json({ statut: "checklist_creee", nombre: elements.length });
}