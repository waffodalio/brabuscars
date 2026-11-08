-- 005 — réservations.
--
-- Deux types de demande sur une annonce publiée :
--   `hold`  : mettre le véhicule de côté. Acceptée, elle bloque le véhicule
--             jusqu'à `hold_until` (une seule mise de côté active par annonce,
--             vérifiée par l'API sous verrou) ;
--   `visit` : rendez-vous d'essai / de visite à `visit_at`.
--
-- Le demandeur peut avoir un compte (`user_id`) ou non : nom, e-mail et
-- téléphone sont donc toujours stockés sur la réservation. Sans compte, la
-- demande reste `unconfirmed` tant que le lien envoyé par e-mail n'a pas été
-- ouvert (seule l'empreinte SHA-256 du jeton est stockée, 30 min) ; les
-- demandes jamais confirmées sont purgées par l'API.
--
-- Statuts : unconfirmed → pending → confirmed | declined ; pending/confirmed
-- → cancelled (par le client ou la concession).

CREATE TABLE `reservation` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `listing_id`         INT          NOT NULL,
  `user_id`            INT          NULL,
  `type`               ENUM('hold','visit') NOT NULL,
  `status`             ENUM('unconfirmed','pending','confirmed','declined','cancelled') NOT NULL,
  `first_name`         VARCHAR(100) NOT NULL,
  `last_name`          VARCHAR(100) NOT NULL,
  `email`              VARCHAR(255) NOT NULL,
  `phone`              VARCHAR(30)  NOT NULL,
  `message`            TEXT         NULL,
  `locale`             VARCHAR(5)   NOT NULL DEFAULT 'fr',
  `visit_at`           DATETIME     NULL,
  `hold_until`         DATETIME     NULL,
  `admin_note`         VARCHAR(500) NULL,
  `confirm_token_hash` CHAR(64)     NULL,
  `confirm_expires_at` DATETIME     NULL,
  `email_confirmed_at` DATETIME     NULL,
  `decided_at`         DATETIME     NULL,
  `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reservation_token` (`confirm_token_hash`),
  KEY `idx_reservation_listing` (`listing_id`, `type`, `status`),
  KEY `idx_reservation_status` (`status`, `created_at`),
  KEY `idx_reservation_user` (`user_id`),
  KEY `idx_reservation_email` (`email`),
  CONSTRAINT `fk_reservation_listing`
    FOREIGN KEY (`listing_id`) REFERENCES `listing` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_reservation_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
