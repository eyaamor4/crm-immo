"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deplacerProspect(prospectId: string, nouvelleCle: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { erreur: "Session expirée. Reconnectez-vous." };
    }

    const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: { conseillerId: true },
    });

    if (!prospect) {
        return { erreur: "Ce prospect n'existe plus." };
    }
    if (prospect.conseillerId !== session.user.id) {
        return { erreur: "Ce prospect ne vous est pas affecté." };
    }

    const colonne = await prisma.colonnePipeline.findUnique({
        where: { cle: nouvelleCle },
    });
    if (!colonne) {
        return { erreur: "Cette étape n'existe plus." };
    }

    try {
        await prisma.$transaction([
            prisma.prospect.update({
                where: { id: prospectId },
                data: { statutPipeline: nouvelleCle, derniereActivite: new Date() },
            }),
            prisma.echange.create({
                data: {
                    prospectId,
                    type: "note",
                    contenu: `Déplacé vers « ${colonne.libelle} »`,
                },
            }),
        ]);
    } catch {
        return { erreur: "Le déplacement a échoué. Réessayez." };
    }

    revalidatePath("/dashboard");
    return { ok: true };
}