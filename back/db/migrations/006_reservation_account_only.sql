-- 006 — réservations réservées aux clients connectés.
--
-- Le parcours « sans compte » (demande confirmée par un lien e-mail) est
-- abandonné : un visiteur doit se connecter ou créer un compte pour réserver.
-- On retire donc le statut `unconfirmed` et les colonnes du jeton de
-- confirmation. `user_id` reste NULL-able : la réservation est conservée
-- (coordonnées incluses) si le compte est supprimé.

-- Demandes jamais confirmées : inutilisables sans leur jeton.
DELETE FROM `reservation` WHERE `status` = 'unconfirmed';

ALTER TABLE `reservation`
  DROP INDEX `uq_reservation_token`,
  DROP COLUMN `confirm_token_hash`,
  DROP COLUMN `confirm_expires_at`,
  DROP COLUMN `email_confirmed_at`,
  MODIFY `status` ENUM('pending','confirmed','declined','cancelled') NOT NULL;
