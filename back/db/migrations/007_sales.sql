-- 007 — dossiers de vente : paiements, bon de commande et facture.
--
-- Module de facturation du back-office, indépendant des comptes clients :
-- l'acheteur est saisi à la main sur le dossier.
--
-- `sale`          : le dossier (acheteur, régime de TVA, annonce éventuelle).
--                   Statuts : draft → ordered (bon de commande émis après une
--                   avance) → paid (facture émise une fois tout payé) ; un
--                   paiement intégral d'emblée passe directement à `paid`.
-- `sale_line`     : ce qui est vendu (véhicule, frais…), prix TVA comprise.
-- `sale_payment`  : versements enregistrés par l'admin.
-- `sale_document` : bons de commande et factures émis — figés : numéro,
--                   montants au moment de l'émission et fichier PDF (stocké
--                   hors du dossier public, `DOCUMENTS_DIR`).
-- `document_counter` : dernier numéro attribué par type et par année, pour
--                   une numérotation continue sans trou (BC-2026-0001,
--                   F-2026-0001…).

CREATE TABLE `sale` (
  `id`                INT           NOT NULL AUTO_INCREMENT,
  `status`            ENUM('draft','ordered','paid') NOT NULL DEFAULT 'draft',
  `vat_regime`        ENUM('margin','standard') NOT NULL DEFAULT 'margin',
  `listing_id`        INT           NULL,
  `buyer_name`        VARCHAR(150)  NOT NULL,
  `buyer_company`     VARCHAR(150)  NULL,
  `buyer_vat_number`  VARCHAR(30)   NULL,
  `buyer_address`     VARCHAR(255)  NULL,
  `buyer_postal_code` VARCHAR(20)   NULL,
  `buyer_city`        VARCHAR(100)  NULL,
  `buyer_country`     VARCHAR(100)  NULL,
  `buyer_email`       VARCHAR(255)  NULL,
  `buyer_phone`       VARCHAR(30)   NULL,
  `vehicle_vin`       VARCHAR(17)   NULL,
  `notes`             TEXT          NULL,
  `created_by`        INT           NULL,
  `created_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sale_status` (`status`, `created_at`),
  KEY `idx_sale_listing` (`listing_id`),
  CONSTRAINT `fk_sale_listing`
    FOREIGN KEY (`listing_id`) REFERENCES `listing` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_sale_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `user` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sale_line` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `sale_id`     INT           NOT NULL,
  `position`    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `description` VARCHAR(255)  NOT NULL,
  `quantity`    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `unit_price`  DECIMAL(12,2) NOT NULL,              -- TVA comprise
  PRIMARY KEY (`id`),
  KEY `idx_sale_line_sale` (`sale_id`, `position`),
  CONSTRAINT `fk_sale_line_sale`
    FOREIGN KEY (`sale_id`) REFERENCES `sale` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sale_document` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `sale_id`     INT           NOT NULL,
  `kind`        ENUM('order','invoice') NOT NULL,
  `year`        SMALLINT UNSIGNED NOT NULL,
  `seq`         INT UNSIGNED  NOT NULL,
  `number`      VARCHAR(20)   NOT NULL,
  `total`       DECIMAL(12,2) NOT NULL,              -- montant total du dossier à l'émission
  `paid`        DECIMAL(12,2) NOT NULL,              -- déjà versé à l'émission
  `storage_key` VARCHAR(255)  NOT NULL,
  `issued_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sale_document_number` (`number`),
  UNIQUE KEY `uq_sale_document_seq` (`kind`, `year`, `seq`),
  UNIQUE KEY `uq_sale_document_kind` (`sale_id`, `kind`),
  -- Un document émis ne disparaît pas avec son dossier.
  CONSTRAINT `fk_sale_document_sale`
    FOREIGN KEY (`sale_id`) REFERENCES `sale` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sale_payment` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `sale_id`     INT           NOT NULL,
  `amount`      DECIMAL(12,2) NOT NULL,
  `paid_on`     DATE          NOT NULL,
  `method`      ENUM('transfer','cash','card','cheque','other') NOT NULL,
  `reference`   VARCHAR(100)  NULL,
  -- Document émis à la suite de ce versement (il fige alors le paiement).
  `document_id` INT           NULL,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sale_payment_sale` (`sale_id`, `paid_on`),
  CONSTRAINT `fk_sale_payment_sale`
    FOREIGN KEY (`sale_id`) REFERENCES `sale` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_sale_payment_document`
    FOREIGN KEY (`document_id`) REFERENCES `sale_document` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `document_counter` (
  `kind`     ENUM('order','invoice') NOT NULL,
  `year`     SMALLINT UNSIGNED NOT NULL,
  `last_seq` INT UNSIGNED  NOT NULL,
  PRIMARY KEY (`kind`, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
