import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierSecret, masquer } from "@/lib/api-auth";
import { normaliserTelephone } from "@/lib/telephone";
import { extraireCriteres } from "@/lib/extraction";

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

  const { nom, email, telephone, note, budgetMin, budgetMax, devise } = corps;

  if (!nom || (!email && !telephone)) {
    return NextResponse.json(
      { erreur: "Nom et au moins un moyen de contact requis" },
      { status: 400 }
    );
  }

  const emailNormalise = email ? String(email).toLowerCase().trim() : null;
  const telNormalise = normaliserTelephone(telephone);

  // --- Étape 2 : déduplication email / téléphone ---
  const existant = await prisma.prospect.findFirst({
    where: {
      OR: [
        ...(emailNormalise ? [{ email: emailNormalise }] : []),
        ...(telNormalise ? [{ telephoneNormalise: telNormalise }] : []),
      ],
    },
  });

  if (existant) {
    await prisma.echange.create({
      data: {
        prospectId: existant.id,
        type: "note",
        contenu: "Nouvelle soumission de formulaire — prospect déjà existant",
      },
    });

    console.log("[lead] doublon détecté", { email: masquer(emailNormalise) });

    return NextResponse.json({
      statut: "doublon",
      prospectId: existant.id,
      message: "Ce prospect existe déjà, un échange a été ajouté à son dossier.",
    });
  }

  // --- Étape 4 : affectation conseiller (le moins chargé) ---
  const conseillers = await prisma.conseiller.findMany({
    include: { _count: { select: { prospects: true } } },
  });

  if (conseillers.length === 0) {
    return NextResponse.json(
      { erreur: "Aucun conseiller disponible" },
      { status: 503 }
    );
  }

  const conseiller = conseillers.sort(
    (a, b) => a._count.prospects - b._count.prospects
  )[0];

  // --- Étape 3 : extraction des critères (brouillon, non validé) ---
  let criteresIA = null;
  let extractionErreur: string | null = null;
  if (note) {
    try {
      criteresIA = await extraireCriteres(String(note));
    } catch (e) {
      extractionErreur =
        e instanceof Error ? e.message : "Extraction indisponible";
    }
  }

  const prospect = await prisma.prospect.create({
    data: {
      nom: String(nom),
      email: emailNormalise,
      telephone: telephone ? String(telephone) : null,
      telephoneNormalise: telNormalise,
      critereBrut: note ? String(note) : null,
      criteresIA: criteresIA ?? undefined,
      budgetMin: budgetMin ? Number(budgetMin) : null,
      budgetMax: budgetMax ? Number(budgetMax) : null,
      devise: devise ? String(devise) : "TND",
      consentement: true,
      consentementAt: new Date(),
      statutPipeline: "nouveau",
      conseillerId: conseiller.id,
    },
  });

  console.log("[lead] créé", {
    id: prospect.id,
    email: masquer(emailNormalise),
    conseiller: conseiller.nom,
  });

  return NextResponse.json({
    statut: "cree",
    prospectId: prospect.id,
    conseiller: { id: conseiller.id, nom: conseiller.nom, email: conseiller.email },
    criteresExtraits: criteresIA,
    extractionErreur,
  });
}