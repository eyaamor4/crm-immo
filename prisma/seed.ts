import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("password123", 10);

    const conseiller = await prisma.conseiller.upsert({
        where: { email: "sami@crm-immo.tn" },
        update: {},
        create: {
            nom: "Sami Ben Ali",
            email: "sami@crm-immo.tn",
            passwordHash,
        },
    });

    await prisma.bien.upsert({
        where: { reference: "APT-001" },
        update: {},
        create: {
            reference: "APT-001",
            titre: "Appartement S+2 vue mer",
            type: "appartement",
            prix: 350000,
            devise: "TND",
            surface: 85,
            pieces: 3,
            ville: "La Marsa",
            disponible: true,
        },
    });

    await prisma.bien.upsert({
        where: { reference: "VIL-001" },
        update: {},
        create: {
            reference: "VIL-001",
            titre: "Villa avec piscine",
            type: "villa",
            prix: 950000,
            devise: "TND",
            surface: 250,
            pieces: 6,
            ville: "Gammarth",
            disponible: true,
        },
    });

    await prisma.bien.upsert({
        where: { reference: "APT-002" },
        update: {},
        create: {
            reference: "APT-002",
            titre: "Appartement S+1 centre-ville",
            type: "appartement",
            prix: 220000,
            devise: "TND",
            surface: 60,
            pieces: 2,
            ville: "Tunis",
            disponible: false,
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

    console.log("Seed terminé ✅");
    console.log("Login démo → email: sami@crm-immo.tn / mot de passe: password123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });