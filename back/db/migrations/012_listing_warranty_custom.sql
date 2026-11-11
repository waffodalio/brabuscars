-- 012 — garantie : éléments couverts saisis librement.
--
-- En plus de la liste fermée `warranty_coverage`, l'admin peut ajouter ses
-- propres éléments (« Embrayage », « Boîte de transfert 4×4 »…) : tableau
-- JSON de libellés, vidé quand l'annonce n'a pas de garantie.

ALTER TABLE `listing`
  ADD COLUMN `warranty_custom` JSON NULL AFTER `warranty_coverage`;
