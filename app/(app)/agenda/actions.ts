"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function creerRendezVous(data: {
  prospectId: string;
  bienId: string | null;
  debut: string;
  dureeMinutes: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { erreur: "Session expirée." };

  const prospect = await prisma.prospect.findUnique({
    where: { id: data.prospectId },
    select: { conseillerId: true, consentement: true, nom: true },
  });

  if (!prospect || prospect.conseillerId !== session.user.id) {
    return { erreur: "Prospect introuvable." };
  }

  // Cas limite : consentement retiré
  if (!prospect.consentement) {
    return {
      erreur: `${prospect.nom} a retiré son consentement : aucune visite ne peut être planifiée.`,
    };
  }

  const debut = new Date(data.debut);
  if (isNaN(debut.getTime())) return { erreur: "Date invalide." };
  if (debut < new Date()) return { erreur: "La date est déjà passée." };

  const fin = new Date(debut.getTime() + data.dureeMinutes * 60000);

  // Cas limite : bien réservé pendant la planification
  if (data.bienId) {
    const bien = await prisma.bien.findUnique({
      where: { id: data.bienId },
      select: { statut: true, titre: true },
    });
    if (!bien) return { erreur: "Ce bien n'existe plus." };
    if (bien.statut !== "DISPONIBLE") {
      return { erreur: `« ${bien.titre} » n'est plus disponible à la visite.` };
    }
  }

  try {
    await prisma.$transaction([
      prisma.rendezVous.create({
        data: {
          prospectId: data.prospectId,
          bienId: data.bienId,
          conseillerId: session.user.id,
          debut,
          fin,
          statut: "confirme",
        },
      }),
      prisma.prospect.update({
        where: { id: data.prospectId },
        data: { derniereActivite: new Date() },
      }),
      prisma.echange.create({
        data: {
          prospectId: data.prospectId,
          type: "note",
          contenu: `Visite planifiée le ${debut.toLocaleString("fr-FR")}`,
        },
      }),
    ]);
  } catch (e) {

    // La contrainte d'exclusion Postgres a rejeté le chevauchement
    const message = e instanceof Error ? e.message : "";
    if (message.includes("rdv_conseiller_no_overlap")) {
      return { erreur: "Vous avez déjà un rendez-vous sur ce créneau." };
    }
    if (message.includes("rdv_bien_no_overlap")) {
      return { erreur: "Ce bien est déjà visité sur ce créneau." };
    }
    return { erreur: "La planification a échoué. Réessayez." };
  }

  revalidatePath("/agenda");
  revalidatePath(`/prospects/${data.prospectId}`);
  return { ok: true };
}

export async function annulerRendezVous(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { erreur: "Session expirée." };

  const rdv = await prisma.rendezVous.findUnique({
    where: { id },
    select: { conseillerId: true },
  });
  if (!rdv || rdv.conseillerId !== session.user.id) {
    return { erreur: "Rendez-vous introuvable." };
  }

  try {
    await prisma.rendezVous.update({
      where: { id },
      data: { statut: "annule" },
    });
  } catch {
    return { erreur: "L'annulation a échoué." };
  }

  revalidatePath("/agenda");
  return { ok: true };
}