-- 002 — connexion avec Google (OpenID Connect).
--
-- `google_sub` : identifiant Google stable du compte (claim `sub`), unique.
-- `password_hash` devient facultatif : un compte créé via Google n'a pas de
-- mot de passe (la connexion par mot de passe lui est alors refusée).

ALTER TABLE `user`
  MODIFY `password_hash` VARCHAR(255) NULL,
  ADD COLUMN `google_sub` VARCHAR(255) NULL AFTER `password_hash`,
  ADD UNIQUE KEY `uq_user_google_sub` (`google_sub`);
