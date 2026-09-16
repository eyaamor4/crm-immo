"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normaliserTelephone } from "@/lib/telephone";
import { revalidatePath } from "next/cache";

export async function creerProspect(data: {
  nom: string;
  email: string;
  telephone: string;
  budgetMin: string;
  budgetMax: string;
  devise: string;
  note: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { erreur: "Session expirée." };

  const nom = data.nom.trim();
  if (!nom) return { erreur: "Le nom est obligatoire." };

  const email = data.email.trim().toLowerCase() || null;
  const telephone = data.telephone.trim() || null;

  if (!email && !telephone) {
    return { erreur: "Renseignez au moins un e-mail ou un téléphone." };
  }

  if (email && !email.includes("@")) {
    return { erreur: "L'adresse e-mail n'est pas valide." };
  }

  const telNormalise = normaliserTelephone(telephone);

  // Même déduplication que le webhook n8n
  const existant = await prisma.prospect.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        ...(telNormalise ? [{ telephoneNormalise: telNormalise }] : []),
      ],
    },
    select: { id: true, nom: true },
  });

  if (existant) {
    return {
      erreur: `${existant.nom} existe déjà avec ces coordonnées.`,
      prospectExistant: existant.id,
    };
  }

  const budgetMin = data.budgetMin ? Number(data.budgetMin) : null;
  const budgetMax = data.budgetMax ? Number(data.budgetMax) : null;

  if (budgetMin && budgetMax && budgetMin > budgetMax) {
    return { erreur: "Le budget minimum dépasse le maximum." };
  }

  let prospectId: string;

  try {
    const prospect = await prisma.prospect.create({
      data: {
        nom,
        email,
        telephone,
        telephoneNormalise: telNormalise,
        budgetMin,
        budgetMax,
        devise: data.devise || "TND",
        montantPotentiel: budgetMax,
        critereBrut: data.note.trim() || null,
        consentement: true,
        consentementAt: new Date(),
        statutPipeline: "nouveau",
        conseillerId: session.user.id,
      },
    });
    prospectId = prospect.id;

    await prisma.echange.create({
      data: {
        prospectId,
        type: "note",
        contenu: "Dossier créé par le conseiller",
      },
    });
  } catch {
    return { erreur: "La création a échoué. Réessayez." };
  }

  revalidatePath("/prospects");
  revalidatePath("/dashboard");
  return { ok: true, prospectId };
}