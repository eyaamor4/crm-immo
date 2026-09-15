/*
  Warnings:

  - A unique constraint covering the columns `[telephoneNormalise]` on the table `Prospect` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN     "telephoneNormalise" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_telephoneNormalise_key" ON "Prospect"("telephoneNormalise");
