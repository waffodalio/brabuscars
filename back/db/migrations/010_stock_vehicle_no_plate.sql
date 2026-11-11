-- 010 — le registre du garage n'enregistre pas la plaque.
--
-- En Belgique, la plaque suit le propriétaire et non le véhicule : la
-- plupart des voitures en stock n'en ont pas et l'acheteur en apporte une.
-- L'identifiant du véhicule est son VIN (unique dans le stock).

ALTER TABLE `stock_vehicle` DROP COLUMN `plate`;
