import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("password123", 10);

    // --- Taux de change (devise pivot : TND) ---
    const taux = [
        { devise: "TND", versTND: 1 },
        { devise: "EUR", versTND: 3.4 },
        { devise: "USD", versTND: 3.1 },
    ];

    for (const t of taux) {
        await prisma.tauxChange.upsert({
            where: { devise: t.devise },
            update: { versTND: t.versTND },
            create: t,
        });
    }
    const colonnes = [
        { cle: "nouveau", libelle: "Nouveau", ordre: 1 },
        { cle: "qualification", libelle: "Qualification", ordre: 2 },
        { cle: "visite", libelle: "Visite planifiée", ordre: 3 },
        { cle: "offre", libelle: "Offre en cours", ordre: 4 },
        { cle: "conclu", libelle: "Conclu", ordre: 5 },
    ];

    for (const c of colonnes) {
        await prisma.colonnePipeline.upsert({
            where: { cle: c.cle },
            update: { libelle: c.libelle, ordre: c.ordre },
            create: c,
        });
    }

    const conseiller = await prisma.conseiller.upsert({
        where: { email: "eya.amor@enis.tn" },
        update: {},
        create: {
            nom: "Eya Amor",
            email: "eya.amor@enis.tn",
            passwordHash,
        },
    });

    await prisma.bien.upsert({
        where: { reference: "APT-001" },
        update: { statut: "DISPONIBLE" },
        create: {
            reference: "APT-001",
            titre: "Appartement S+2 vue mer",
            type: "appartement",
            prix: 350000,
            devise: "TND",
            surface: 85,
            pieces: 3,
            ville: "La Marsa",
            statut: "DISPONIBLE",
        },
    });

    await prisma.bien.upsert({
        where: { reference: "VIL-001" },
        update: { statut: "DISPONIBLE" },
        create: {
            reference: "VIL-001",
            titre: "Villa avec piscine",
            type: "villa",
            prix: 950000,
            devise: "TND",
            surface: 250,
            pieces: 6,
            ville: "Gammarth",
            statut: "DISPONIBLE",
        },
    });

    // Bien RÉSERVÉ : sert à démontrer l'exigence 01 (jamais proposé au matching)
    await prisma.bien.upsert({
        where: { reference: "APT-002" },
        update: { statut: "RESERVE" },
        create: {
            reference: "APT-002",
            titre: "Appartement S+1 centre-ville",
            type: "appartement",
            prix: 220000,
            devise: "TND",
            surface: 60,
            pieces: 2,
            ville: "Tunis",
            statut: "RESERVE",
        },
    });

    await prisma.prospect.upsert({
        where: { email: "amira@example.com" },
        update: {},
        create: {
            nom: "Amira Trabelsi",
            email: "amira@example.com",
            telephone: "+21620000000",
            budgetMin: 300000,
            budgetMax: 400000,
            devise: "TND",
            critereBrut: "Cherche appartement 3 pièces avec vue mer, budget max 400k, La Marsa ou Gammarth",
            consentement: true,
            consentementAt: new Date(),
            statutPipeline: "qualification",
            montantPotentiel: 350000,
            conseillerId: conseiller.id,
        },
    });

    // Prospect en EUR : sert à démontrer le cas limite "budget en devise différente"
    await prisma.prospect.upsert({
        where: { email: "pierre@example.fr" },
        update: {},
        create: {
            nom: "Pierre Dubois",
            email: "pierre@example.fr",
            telephone: "+33612345678",
            budgetMin: 80000,
            budgetMax: 120000,
            devise: "EUR",
            critereBrut: "Villa avec piscine, Gammarth ou La Marsa, budget 120k euros",
            consentement: true,
            consentementAt: new Date(),
            statutPipeline: "nouveau",
            montantPotentiel: 400000,
            conseillerId: conseiller.id,
        },
    });

    console.log("Seed terminé ✅");
    console.log("Login démo → email: eya.amor@enis.tn / mot de passe: password123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });