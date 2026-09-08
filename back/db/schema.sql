-- CHCars — schéma de référence complet (8 tables)
--
-- L'application ne crée ni ne modifie aucune table au runtime (synchronize = false).
-- Ce fichier est le schéma de référence. L'appliquer avec, au choix :
--
--   npm run migrate                      (depuis back/, utilise .env.<NODE_ENV>)
--   mariadb -u chcarsdev -p chcars_dev < back/db/schema.sql
--
-- Les `CREATE TABLE IF NOT EXISTS` rendent le script ré-exécutable : il crée
-- les tables manquantes sans toucher aux existantes. Les modifications de
-- colonnes sur des tables déjà créées restent manuelles (voir « Migrations »
-- en fin de fichier).
--
-- Ordre imposé par les clés étrangères :
--   user → brand → category → car_model → vehicle → listing
--        → listing_image → favorite  (MariaDB 10.11 LTS ou plus récent)

CREATE TABLE IF NOT EXISTS `user` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(255)  NOT NULL,
  `password_hash` VARCHAR(255)  NOT NULL,
  `first_name`    VARCHAR(100)  NOT NULL,
  `last_name`     VARCHAR(100)  NOT NULL,
  `role`          ENUM('user','admin','super_admin') NOT NULL DEFAULT 'user',
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `brand` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `slug`       VARCHAR(120) NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_brand_name` (`name`),
  UNIQUE KEY `uq_brand_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(80)  NOT NULL,
  `slug`       VARCHAR(100) NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_name` (`name`),
  UNIQUE KEY `uq_category_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `car_model` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `brand_id`   INT          NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_car_model_brand_name` (`brand_id`, `name`),
  KEY `idx_car_model_brand` (`brand_id`),
  CONSTRAINT `fk_car_model_brand`
    FOREIGN KEY (`brand_id`) REFERENCES `brand` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vehicle` (
  `id`           INT               NOT NULL AUTO_INCREMENT,
  `model_id`     INT               NOT NULL,
  `category_id`  INT               NULL,
  `year`         SMALLINT UNSIGNED NOT NULL,
  `mileage`      INT      UNSIGNED NOT NULL,            -- kilométrage
  `fuel_type`    ENUM('petrol','diesel','hybrid','electric','lpg') NOT NULL,
  `transmission` ENUM('manual','automatic') NOT NULL,
  `power`        SMALLINT UNSIGNED NULL,                -- puissance en ch
  `doors`        TINYINT  UNSIGNED NULL,
  `color`        VARCHAR(50)       NULL,
  `created_at`   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_model` (`model_id`),
  KEY `idx_vehicle_category` (`category_id`),
  CONSTRAINT `fk_vehicle_model`
    FOREIGN KEY (`model_id`) REFERENCES `car_model` (`id`),
  CONSTRAINT `fk_vehicle_category`
    FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `listing` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `seller_id`    INT           NOT NULL,
  `vehicle_id`   INT           NOT NULL,
  `title`        VARCHAR(150)  NOT NULL,
  `description`  TEXT          NULL,
  `price`        DECIMAL(10,2) NOT NULL,
  `city`         VARCHAR(120)  NOT NULL,
  `postal_code`  VARCHAR(10)   NULL,
  `status`       ENUM('draft','published','sold','archived') NOT NULL DEFAULT 'draft',
  `published_at` DATETIME      NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_vehicle` (`vehicle_id`),
  KEY `idx_listing_seller` (`seller_id`),
  KEY `idx_listing_status` (`status`),
  CONSTRAINT `fk_listing_seller`
    FOREIGN KEY (`seller_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk_listing_vehicle`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `listing_image` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `listing_id`  INT          NOT NULL,
  `storage_key` VARCHAR(255) NOT NULL,                  -- chemin du WebP sur disque
  `mime_type`   VARCHAR(50)  NOT NULL,
  `size_bytes`  INT UNSIGNED NOT NULL,
  `width`       SMALLINT UNSIGNED NULL,
  `height`      SMALLINT UNSIGNED NULL,
  `position`    INT UNSIGNED NOT NULL DEFAULT 0,        -- ordre dans la galerie
  `is_cover`    TINYINT(1)   NOT NULL DEFAULT 0,        -- image principale
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_listing_image_listing` (`listing_id`),
  CONSTRAINT `fk_listing_image_listing`
    FOREIGN KEY (`listing_id`) REFERENCES `listing` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `favorite` (
  `id`         INT      NOT NULL AUTO_INCREMENT,
  `user_id`    INT      NOT NULL,
  `listing_id` INT      NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_favorite_user_listing` (`user_id`, `listing_id`),
  KEY `idx_favorite_listing` (`listing_id`),
  CONSTRAINT `fk_favorite_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_favorite_listing`
    FOREIGN KEY (`listing_id`) REFERENCES `listing` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
--  Migrations pour une base déjà créée avec une version antérieure du schéma
-- ---------------------------------------------------------------------------
-- Rôle super administrateur (ajout de la valeur d'enum) :
-- ALTER TABLE `user`
--   MODIFY COLUMN `role` ENUM('user','admin','super_admin') NOT NULL DEFAULT 'user';
