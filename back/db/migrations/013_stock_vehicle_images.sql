-- 013 — les photos appartiennent au véhicule du stock.
--
-- Demandées à l'entrée du véhicule au garage, gérées depuis sa fiche ; son
-- annonce les affiche (une annonce sans véhicule garde ses propres photos,
-- table `listing_image`). Même stockage : WebP + vignette sur disque, la base
-- ne garde que la clé et les métadonnées.

CREATE TABLE `stock_vehicle_image` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `vehicle_id`  INT          NOT NULL,
  `storage_key` VARCHAR(255) NOT NULL,
  `mime_type`   VARCHAR(50)  NOT NULL,
  `size_bytes`  INT UNSIGNED NOT NULL,
  `width`       SMALLINT UNSIGNED NULL,
  `height`      SMALLINT UNSIGNED NULL,
  `position`    INT UNSIGNED NOT NULL DEFAULT 0,
  `is_cover`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stock_vehicle_image_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_stock_vehicle_image_vehicle`
    FOREIGN KEY (`vehicle_id`) REFERENCES `stock_vehicle` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
