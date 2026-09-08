-- CHCars — schéma de référence complet (8 tables)
--
-- Ce fichier est fourni À TITRE DE RÉFÉRENCE. L'application ne crée ni ne
-- modifie aucune table (synchronize = false). C'est au propriétaire du projet
-- d'exécuter ce script, après relecture, sur sa base MariaDB (10.11 LTS ou
-- plus récent) :
--
--   mariadb -u chcarsdev -p chcars_dev < back/db/schema.sql
--
-- Les tables sont créées dans l'ordre imposé par les clés étrangères :
--   user → brand → category → car_model → vehicle → listing
--        → vehicle_image → favorite

CREATE TABLE `user` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(255)  NOT NULL,
  `password_hash` VARCHAR(255)  NOT NULL,
  `first_name`    VARCHAR(100)  NOT NULL,
  `last_name`     VARCHAR(100)  NOT NULL,
  `role`          ENUM('user','admin') NOT NULL DEFAULT 'user',
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `brand` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `slug`       VARCHAR(120) NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_brand_name` (`name`),
  UNIQUE KEY `uq_brand_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `category` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(80)  NOT NULL,
  `slug`       VARCHAR(100) NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_name` (`name`),
  UNIQUE KEY `uq_category_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `car_model` (
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

CREATE TABLE `vehicle` (
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

CREATE TABLE `listing` (
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

CREATE TABLE `vehicle_image` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `vehicle_id` INT          NOT NULL,
  `url`        VARCHAR(500) NOT NULL,
  `position`   INT UNSIGNED NOT NULL DEFAULT 0,         -- ordre dans la galerie
  `is_cover`   TINYINT(1)   NOT NULL DEFAULT 0,         -- image principale
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_image_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_vehicle_image_vehicle`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `favorite` (
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
