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

# Base prête, puis migrations en attente (db/migrations/). Un échec arrête le
# déploiement avant le redémarrage de l'API : l'ancienne version reste en ligne.
docker compose up -d --wait mariadb
docker compose run --rm --no-deps back node dist/scripts/migrate.js

docker compose up -d --wait --remove-orphans

# Mémorise la version déployée (rollback : IMAGE_TAG=$(cat .previous_tag) ./deploy.sh).
[ -f .current_tag ] && cp .current_tag .previous_tag
echo "${IMAGE_TAG}" > .current_tag

docker image prune -f >/dev/null
echo "[deploy] ok"
