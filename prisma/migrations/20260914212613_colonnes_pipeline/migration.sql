-- CreateTable
CREATE TABLE "ColonnePipeline" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT 'foret',

    CONSTRAINT "ColonnePipeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ColonnePipeline_cle_key" ON "ColonnePipeline"("cle");
