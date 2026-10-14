-- 003 — mesure d'audience interne (pages vues).
--
-- Une ligne par page publique affichée par un visiteur ayant accepté le cookie
-- de mesure (`chcars_visitor_id`, identifiant aléatoire sans lien avec un
-- compte). Ni IP, ni user-agent, ni paramètres d'URL ne sont stockés.
-- `path` est sans préfixe de langue (`/annonces/12`), `locale` le garde à part.
-- `listing_id` est renseigné pour les fiches annonce ; il passe à NULL si
-- l'annonce est supprimée. Les lignes de plus de 13 mois sont purgées par l'API.

CREATE TABLE `page_view` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `visitor_id` CHAR(36)        NOT NULL,
  `path`       VARCHAR(255)    NOT NULL,
  `locale`     VARCHAR(5)      NULL,
  `listing_id` INT             NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_page_view_created` (`created_at`),
  KEY `idx_page_view_listing` (`listing_id`, `created_at`),
  CONSTRAINT `fk_page_view_listing`
    FOREIGN KEY (`listing_id`) REFERENCES `listing` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
