#!/usr/bin/env sh
# Déploie une version des images CHCars sur le serveur courant.
# Appelé par la CI (.github/workflows/deploy.yml) depuis le dossier de
# déploiement, qui contient docker-compose.yml et le .env du serveur. Le
# reverse proxy (nginx du serveur, deploy/nginx/chcars.conf) est installé une
# fois à la main et n'est pas touché ici.
#
#   IMAGE_BACK=ghcr.io/<owner>/chcars-back \
#   IMAGE_FRONT=ghcr.io/<owner>/chcars-front \
#   IMAGE_TAG=sha-abc1234 ./deploy.sh
set -eu

: "${IMAGE_BACK:?}" "${IMAGE_FRONT:?}" "${IMAGE_TAG:?}"
export IMAGE_BACK IMAGE_FRONT IMAGE_TAG
cd "$(dirname "$0")"

# Préprod et prod partagent le serveur : chaque dossier de déploiement doit
# nommer explicitement son projet compose (conteneurs, réseau et volumes
# distincts). Sans cela, deux dossiers de même nom viseraient le même projet
# et un déploiement de préprod remplacerait la prod.
project=$(sed -n 's/^COMPOSE_PROJECT_NAME=//p' .env 2>/dev/null | tail -n 1)
if [ -z "$project" ]; then
  echo "[deploy] COMPOSE_PROJECT_NAME manquant dans $(pwd)/.env" >&2
  exit 1
fi
echo "[deploy] projet ${project}"

echo "[deploy] images ${IMAGE_TAG}"
docker compose pull back front

# Base prête, puis sauvegarde, puis migrations en attente (db/migrations/). Un
# échec arrête le déploiement avant le redémarrage de l'API : l'ancienne
# version reste en ligne.
docker compose up -d --wait mariadb

# Sauvegarde avant migration : dump complet de la base de cet environnement
# dans backups/<date>_<tag>.sql.gz (droits 600 : le dump contient des données
# personnelles et des hash de mots de passe). Les BACKUP_KEEP plus récents
# sont gardés (défaut 10, réglable dans le .env). Restauration : README §
# « Sauvegardes de la base ».
backup_keep=$(sed -n 's/^BACKUP_KEEP=//p' .env 2>/dev/null | tail -n 1)
backup_keep=${backup_keep:-10}
case "$backup_keep" in
  ''|*[!0-9]*|0) echo "[deploy] BACKUP_KEEP invalide : ${backup_keep}" >&2; exit 1 ;;
esac
mkdir -p backups
chmod 700 backups
safe_tag=$(printf '%s' "$IMAGE_TAG" | tr -c 'A-Za-z0-9._-' '_')
backup="backups/$(date -u +%Y%m%d-%H%M%S)_${safe_tag}.sql"
echo "[deploy] sauvegarde → ${backup}.gz"
(
  umask 077
  # Mot de passe root lu dans l'environnement du conteneur (MYSQL_PWD) : il
  # n'apparaît ni dans la ligne de commande, ni dans les logs de la CI.
  docker compose exec -T mariadb sh -c \
    'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" exec mariadb-dump -uroot \
       --single-transaction --routines --triggers --events \
       --databases "$MARIADB_DATABASE"' > "${backup}.part"
  # mariadb-dump termine un dump complet par « -- Dump completed ».
  if ! tail -n 1 "${backup}.part" | grep -q '^-- Dump completed'; then
    echo "[deploy] sauvegarde incomplète, déploiement arrêté" >&2
    exit 1
  fi
  gzip -9 "${backup}.part"
  mv "${backup}.part.gz" "${backup}.gz"
) || { rm -f "${backup}.part" "${backup}.part.gz"; exit 1; }
# Rotation : on ne garde que les BACKUP_KEEP plus récents.
ls -1t backups/*.sql.gz | tail -n +"$((backup_keep + 1))" | while read -r old; do
  rm -f "$old"
done

docker compose run --rm --no-deps back node dist/scripts/migrate.js

docker compose up -d --wait --remove-orphans

# Mémorise la version déployée (rollback : IMAGE_TAG=$(cat .previous_tag) ./deploy.sh).
[ -f .current_tag ] && cp .current_tag .previous_tag
echo "${IMAGE_TAG}" > .current_tag

docker image prune -f >/dev/null
echo "[deploy] ok"
