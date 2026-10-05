-- 001 — schéma initial CHCars (11 tables).
--
-- Les `IF NOT EXISTS` permettent d'enregistrer cette migration sur une base
-- de dev créée avant le système de migrations versionnées ; les migrations
-- suivantes n'en ont pas besoin.
--
-- Ordre imposé par les clés étrangères :
--   user → brand → category → car_model → listing
--        → listing_image → favorite → role_change_log
--        → user_mfa → user_recovery_code  (MariaDB 10.11 LTS ou plus récent)
--
-- L'annonce (`listing`) porte directement les caractéristiques techniques du
-- véhicule : l'administrateur saisit tout dans un seul formulaire. Il n'existe
-- pas de table `vehicle` séparée.

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

CREATE TABLE IF NOT EXISTS `listing` (
  `id`           INT               NOT NULL AUTO_INCREMENT,
  `seller_id`    INT               NOT NULL,
  `model_id`     INT               NOT NULL,
  `category_id`  INT               NULL,
  `title`        VARCHAR(150)      NOT NULL,
  `description`  TEXT              NULL,
  `price`        DECIMAL(10,2)     NOT NULL,
  `year`         SMALLINT UNSIGNED NOT NULL,
  `mileage`      INT      UNSIGNED NOT NULL,            -- kilométrage
  `fuel_type`    ENUM('petrol','diesel','hybrid','electric','lpg') NOT NULL,
  `transmission` ENUM('manual','automatic') NOT NULL,
  `power`        SMALLINT UNSIGNED NULL,                -- puissance en ch
  `doors`        TINYINT  UNSIGNED NULL,
  `color`        VARCHAR(50)       NULL,
  `status`       ENUM('draft','published','sold','archived') NOT NULL DEFAULT 'draft',
  `published_at` DATETIME          NULL,
  `created_at`   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_listing_seller` (`seller_id`),
  KEY `idx_listing_model` (`model_id`),
  KEY `idx_listing_category` (`category_id`),
  KEY `idx_listing_status` (`status`),
  CONSTRAINT `fk_listing_seller`
    FOREIGN KEY (`seller_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk_listing_model`
    FOREIGN KEY (`model_id`) REFERENCES `car_model` (`id`),
  CONSTRAINT `fk_listing_category`
    FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
    ON DELETE SET NULL
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

CREATE TABLE IF NOT EXISTS `contact_message` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(120) NOT NULL,
  `email`      VARCHAR(255) NOT NULL,
  `message`    TEXT         NOT NULL,
  `handled`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_message_handled` (`handled`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journal d'audit des changements de rôle (fait par un super admin via l'API).
-- E-mails recopiés au moment du changement : l'historique reste lisible même si
-- un compte disparaît (les clés étrangères passent alors à NULL).
CREATE TABLE IF NOT EXISTS `role_change_log` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `target_user_id` INT          NULL,
  `target_email`   VARCHAR(255) NOT NULL,
  `actor_user_id`  INT          NULL,
  `actor_email`    VARCHAR(255) NOT NULL,
  `old_role`       ENUM('user','admin','super_admin') NOT NULL,
  `new_role`       ENUM('user','admin','super_admin') NOT NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_role_change_log_target` (`target_user_id`, `created_at`),
  KEY `idx_role_change_log_created` (`created_at`),
  CONSTRAINT `fk_role_change_log_target`
    FOREIGN KEY (`target_user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_role_change_log_actor`
    FOREIGN KEY (`actor_user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Double authentification TOTP (obligatoire pour admin / super_admin).
-- Tables séparées de `user` : la fonctionnalité n'ajoute que des tables, que
-- `npm run migrate` crée sur toute base existante.
--   secret_encrypted : secret base32 chiffré AES-256-GCM (MFA_ENCRYPTION_KEY)
--   enabled_at       : NULL tant que l'enrôlement n'est pas confirmé
--   last_used_step   : dernier pas de 30 s accepté (anti-rejeu)
CREATE TABLE IF NOT EXISTS `user_mfa` (
  `user_id`          INT               NOT NULL,
  `secret_encrypted` VARCHAR(255)      NOT NULL,
  `enabled_at`       DATETIME          NULL,
  `last_used_step`   INT UNSIGNED      NULL,
  `failed_attempts`  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until`     DATETIME          NULL,
  `created_at`       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_mfa_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Codes de secours 2FA à usage unique (seul le SHA-256 est stocké).
CREATE TABLE IF NOT EXISTS `user_recovery_code` (
  `id`         INT      NOT NULL AUTO_INCREMENT,
  `user_id`    INT      NOT NULL,
  `code_hash`  CHAR(64) NOT NULL,
  `used_at`    DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_recovery_code_user` (`user_id`),
  CONSTRAINT `fk_user_recovery_code_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
