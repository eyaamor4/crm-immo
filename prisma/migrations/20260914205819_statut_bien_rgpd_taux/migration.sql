/*
  Warnings:

  - You are about to drop the column `disponible` on the `Bien` table. All the data in the column will be lost.
  - You are about to drop the column `ancienEtat` on the `HistoriqueDisponibilite` table. All the data in the column will be lost.
  - You are about to drop the column `nouvelEtat` on the `HistoriqueDisponibilite` table. All the data in the column will be lost.
  - Added the required column `ancienStatut` to the `HistoriqueDisponibilite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nouveauStatut` to the `HistoriqueDisponibilite` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatutBien" AS ENUM ('DISPONIBLE', 'RESERVE', 'VENDU', 'RETIRE');

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_prospectId_fkey";

-- DropForeignKey
ALTER TABLE "Echange" DROP CONSTRAINT "Echange_prospectId_fkey";

-- DropForeignKey
ALTER TABLE "Tache" DROP CONSTRAINT "Tache_prospectId_fkey";

-- AlterTable
ALTER TABLE "Bien" DROP COLUMN "disponible",
ADD COLUMN     "statut" "StatutBien" NOT NULL DEFAULT 'DISPONIBLE';

-- AlterTable
ALTER TABLE "HistoriqueDisponibilite" DROP COLUMN "ancienEtat",
DROP COLUMN "nouvelEtat",
ADD COLUMN     "ancienStatut" "StatutBien" NOT NULL,
ADD COLUMN     "nouveauStatut" "StatutBien" NOT NULL;

-- CreateTable
CREATE TABLE "TauxChange" (
    "devise" TEXT NOT NULL,
    "versTND" DOUBLE PRECISION NOT NULL,
    "majLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TauxChange_pkey" PRIMARY KEY ("devise")
);

-- CreateIndex
CREATE INDEX "Prospect_conseillerId_derniereActivite_idx" ON "Prospect"("conseillerId", "derniereActivite");

-- AddForeignKey
ALTER TABLE "Echange" ADD CONSTRAINT "Echange_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
