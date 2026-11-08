-- 004 — réinitialisation et changement du mot de passe.
--
-- `password_reset_token` : lien « mot de passe oublié » envoyé par e-mail.
-- Seule l'empreinte SHA-256 du jeton est stockée (le jeton en clair n'existe
-- que dans l'e-mail) ; usage unique (`used_at`), expiration courte
-- (`expires_at`). Supprimé avec le compte.
--
-- `user.password_changed_at` : date du dernier changement de mot de passe.
-- Toute session (JWT) émise avant cette date est refusée par `authenticate` :
-- changer ou réinitialiser son mot de passe déconnecte les autres appareils.

CREATE TABLE `password_reset_token` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  `token_hash` CHAR(64)     NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `used_at`    DATETIME     NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_password_reset_token_hash` (`token_hash`),
  KEY `idx_password_reset_token_user` (`user_id`, `created_at`),
  CONSTRAINT `fk_password_reset_token_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `user`
  ADD COLUMN `password_changed_at` DATETIME NULL AFTER `google_sub`;
