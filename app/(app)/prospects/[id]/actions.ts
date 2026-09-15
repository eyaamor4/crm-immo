"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extraireCriteres } from "@/lib/extraction";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

async function verifierAcces(prospectId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const p = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { conseillerId: true, critereBrut: true },
  });
  if (!p || p.conseillerId !== session.user.id) return null;
  return p;
}

export async function lancerExtraction(prospectId: string) {
  const p = await verifierAcces(prospectId);
  if (!p) return { erreur: "Accès refusé." };
  if (!p.critereBrut) return { erreur: "Aucune note libre à analyser." };

  try {
    const criteres = await extraireCriteres(p.critereBrut);

    await prisma.prospect.update({
      where: { id: prospectId },
      data: { criteresIA: criteres },
    });

    revalidatePath(`/prospects/${prospectId}`);
    return { ok: true };
  } catch (e) {
    return {
      erreur:
        e instanceof Error ? e.message : "L'extraction a échoué. Réessayez.",
    };
  }
}

export async function validerCriteres(
  prospectId: string,
  criteres: Record<string, unknown>
) {
  const p = await verifierAcces(prospectId);
  if (!p) return { erreur: "Accès refusé." };

  try {
    await prisma.$transaction([
      prisma.prospect.update({
        where: { id: prospectId },
                data: {
          criteresValide: criteres as Prisma.InputJsonValue,
          derniereActivite: new Date(),
        },
      }),
      prisma.echange.create({
        data: {
          prospectId,
          type: "note",
          contenu: "Critères de recherche validés par le conseiller",
        },
      }),
    ]);
  } catch {
    return { erreur: "La validation a échoué." };
  }

  revalidatePath(`/prospects/${prospectId}`);
  return { ok: true };
}