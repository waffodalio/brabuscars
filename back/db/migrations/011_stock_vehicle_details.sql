-- 011 — le véhicule du stock porte aussi ses options et ses papiers.
--
-- Le véhicule est la référence technique : ses équipements (tableau JSON de
-- clés, liste fermée `entities/listingDetails.ts`), sa norme Euro, son CO₂
-- (g/km) et son Car-Pass sont saisis à l'entrée au stock et recopiés sur
-- son annonce (la garantie, offre commerciale, reste propre à l'annonce).

ALTER TABLE `stock_vehicle`
  ADD COLUMN `equipment` JSON NULL AFTER `doors`,
  ADD COLUMN `euro_norm` ENUM('euro1','euro2','euro3','euro4','euro5','euro6','euro6dTemp','euro6d','euro7') NULL AFTER `equipment`,
  ADD COLUMN `co2` SMALLINT UNSIGNED NULL AFTER `euro_norm`,
  ADD COLUMN `has_car_pass` TINYINT(1) NOT NULL DEFAULT 0 AFTER `co2`;
