CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "RendezVous"
  ADD CONSTRAINT rdv_conseiller_no_overlap
  EXCLUDE USING gist (
    "conseillerId" WITH =,
    tsrange("debut", "fin") WITH &&
  ) WHERE (statut <> 'annule');

ALTER TABLE "RendezVous"
  ADD CONSTRAINT rdv_bien_no_overlap
  EXCLUDE USING gist (
    "bienId" WITH =,
    tsrange("debut", "fin") WITH &&
  ) WHERE (statut <> 'annule' AND "bienId" IS NOT NULL);