-- 008 — fiche détaillée d'une annonce : équipements, environnement, Car-Pass
--       et garantie.
--
-- `equipment`         : tableau JSON de clés d'équipement (GPS, caméra…),
--                       liste fermée côté API (`entities/listingDetails.ts`).
-- `euro_norm`, `co2`  : norme d'émission et CO₂ (g/km) — zones de basses
--                       émissions et taxe de mise en circulation en Belgique.
-- `has_car_pass`      : Car-Pass disponible (obligatoire à la vente en Belgique).
-- `warranty_*`        : garantie proposée — durée en mois (NULL = aucune),
--                       type (concession / constructeur), éléments couverts
--                       (tableau JSON) et conditions en texte libre.
-- Toutes les colonnes sont optionnelles : les annonces existantes restent
-- valides telles quelles.

ALTER TABLE `listing`
  ADD COLUMN `equipment` JSON NULL AFTER `color`,
  ADD COLUMN `euro_norm` ENUM('euro1','euro2','euro3','euro4','euro5','euro6','euro6dTemp','euro6d','euro7') NULL AFTER `equipment`,
  ADD COLUMN `co2` SMALLINT UNSIGNED NULL AFTER `euro_norm`,
  ADD COLUMN `has_car_pass` TINYINT(1) NOT NULL DEFAULT 0 AFTER `co2`,
  ADD COLUMN `warranty_months` TINYINT UNSIGNED NULL AFTER `has_car_pass`,
  ADD COLUMN `warranty_kind` ENUM('dealer','manufacturer') NULL AFTER `warranty_months`,
  ADD COLUMN `warranty_coverage` JSON NULL AFTER `warranty_kind`,
  ADD COLUMN `warranty_notes` VARCHAR(500) NULL AFTER `warranty_coverage`;
