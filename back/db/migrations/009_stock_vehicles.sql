-- 009 — registre du garage (stock), indépendant des annonces.
--
-- `stock_vehicle`      : chaque véhicule physiquement géré par la concession,
--                        avec ses infos techniques et administratives, son
--                        entrée (date, origine, fournisseur, prix d'achat) et
--                        sa sortie (date, motif). Lien facultatif vers une
--                        annonce (une annonce = au plus un véhicule).
--                        Statuts : incoming (en arrivage) → in_stock →
--                        preparation → sold | exited (sorti sans vente).
-- `stock_vehicle_cost` : frais engagés sur le véhicule (remise en état,
--                        contrôle technique, carrosserie…), pour le prix de
--                        revient et la marge.
-- `sale.stock_vehicle_id` : véhicule vendu par un dossier de vente ; la
--                        facture finale le passe en « vendu ».

CREATE TABLE `stock_vehicle` (
  `id`                 INT           NOT NULL AUTO_INCREMENT,
  `model_id`           INT           NOT NULL,
  `listing_id`         INT           NULL,
  `status`             ENUM('incoming','in_stock','preparation','sold','exited') NOT NULL DEFAULT 'in_stock',
  `version`            VARCHAR(150)  NULL,
  `vin`                VARCHAR(17)   NULL,
  `plate`              VARCHAR(15)   NULL,
  `year`               SMALLINT UNSIGNED NOT NULL,
  `first_registration` DATE          NULL,
  `mileage`            INT UNSIGNED  NOT NULL,
  `fuel_type`          ENUM('petrol','diesel','hybrid','electric','lpg') NOT NULL,
  `transmission`       ENUM('manual','automatic') NOT NULL,
  `power`              SMALLINT UNSIGNED NULL,
  `color`              VARCHAR(50)   NULL,
  `doors`              TINYINT UNSIGNED NULL,
  `entry_date`         DATE          NOT NULL,
  `entry_source`       ENUM('purchase','trade_in','consignment','other') NOT NULL DEFAULT 'purchase',
  `supplier`           VARCHAR(150)  NULL,
  `purchase_price`     DECIMAL(10,2) NULL,
  `target_price`       DECIMAL(10,2) NULL,
  `location`           VARCHAR(100)  NULL,
  `exit_date`          DATE          NULL,
  `exit_reason`        ENUM('sale','return','scrap','transfer','other') NULL,
  `notes`              TEXT          NULL,
  `created_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stock_vehicle_vin` (`vin`),
  UNIQUE KEY `uq_stock_vehicle_listing` (`listing_id`),
  KEY `idx_stock_vehicle_status` (`status`, `entry_date`),
  CONSTRAINT `fk_stock_vehicle_model`
    FOREIGN KEY (`model_id`) REFERENCES `car_model` (`id`),
  CONSTRAINT `fk_stock_vehicle_listing`
    FOREIGN KEY (`listing_id`) REFERENCES `listing` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_vehicle_cost` (
  `id`         INT           NOT NULL AUTO_INCREMENT,
  `vehicle_id` INT           NOT NULL,
  `label`      VARCHAR(150)  NOT NULL,
  `amount`     DECIMAL(10,2) NOT NULL,
  `spent_on`   DATE          NOT NULL,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stock_vehicle_cost_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_stock_vehicle_cost_vehicle`
    FOREIGN KEY (`vehicle_id`) REFERENCES `stock_vehicle` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `sale`
  ADD COLUMN `stock_vehicle_id` INT NULL AFTER `listing_id`,
  ADD KEY `idx_sale_stock_vehicle` (`stock_vehicle_id`),
  ADD CONSTRAINT `fk_sale_stock_vehicle`
    FOREIGN KEY (`stock_vehicle_id`) REFERENCES `stock_vehicle` (`id`)
    ON DELETE SET NULL;
