# CHCars

Plateforme web de consultation et de vente de véhicules.

- **`front/`** — application cliente : Next.js 16 (App Router), React 19, TypeScript, Bootstrap (`react-bootstrap`)
- **`back/`** — API REST : Node.js, Express 5, TypeScript, TypeORM, MariaDB

Le frontend ne parle **qu'à l'API backend** ; toute la communication avec la base de données passe par `back/`.

```text
chcars/
├── back/
│   ├── db/schema.sql       # structure des 8 tables (à exécuter manuellement)
│   └── src/
│       ├── config/         # env.ts (chargement + validation zod), data-source.ts
│       ├── entities/       # 8 entités TypeORM
│       ├── repositories/  services/  controllers/  routes/
│       ├── middlewares/    # authenticate / authorize / errorHandler / notFound
│       ├── dto/            # schémas de validation zod
│       ├── scripts/        # createAdmin.ts
│       └── utils/
└── front/
    ├── app/                # routing Next (pages)
    └── src/
        ├── components/  layouts/  hooks/  context/  services/  types/  utils/
```

## Rôles

| Rôle | Peut… |
|---|---|
| *(visiteur)* | consulter marques, catégories, modèles, véhicules, annonces publiées |
| `user` | + s'inscrire / se connecter, gérer ses favoris |
| `admin` | + gérer **tout le catalogue** : marques, catégories, modèles, véhicules, **photos**, annonces |
| `super_admin` | + **gérer les comptes** : lister les utilisateurs, basculer un compte `user` ⇄ `admin` |

Les rôles sont hiérarchiques (`user` < `admin` < `super_admin`). Les informations
et les images des véhicules sont saisies par l'administrateur depuis
l'application ; il n'y a **aucune donnée préremplie** dans la base.

Un `super_admin` ne peut ni modifier son propre rôle ni celui d'un autre
`super_admin` ; le rôle `super_admin` ne s'attribue jamais via l'application
(script `create-admin --super` ou base de données uniquement).

## Prérequis

- **Node.js 20+** et npm
- Un serveur **MariaDB 10.11 LTS** (ou plus récent) accessible en local

## Environnements

Trois environnements dissociés, chacun avec sa base, son utilisateur MariaDB et ses secrets :

| Environnement | Base MariaDB | Utilisateur MariaDB | Fichier backend |
|---|---|---|---|
| développement | `chcars_dev` | `chcarsdev` | `back/.env.development` |
| test | `chcars_test` | `chcarstest` | `back/.env.test` |
| production | `chcars_prod` | `chcarsprod` | `back/.env.production` |

`env.ts` charge automatiquement le bon fichier selon `NODE_ENV`, dans l'ordre
`.env.<env>.local` > `.env.<env>` > `.env`. **Aucun de ces fichiers n'est
versionné** ; leur contenu est décrit en section 2, et les secrets (mot de passe
BD, `JWT_SECRET`) vont dans le `.local`.

## 1. Base de données

> ⚠️ L'application ne crée, ne modifie ni ne supprime aucune table
> (`synchronize: false`). Les opérations ci-dessous sont à exécuter
> **manuellement** avec un client MariaDB, **pour chaque environnement utilisé**.

Exemple pour le développement :

```sql
CREATE DATABASE chcars_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chcarsdev'@'localhost' IDENTIFIED BY 'choisir_un_mot_de_passe';
GRANT ALL PRIVILEGES ON chcars_dev.* TO 'chcarsdev'@'localhost';
FLUSH PRIVILEGES;
```

```bash
mariadb -u chcarsdev -p chcars_dev < back/db/schema.sql
```

Répéter avec `chcars_test` / `chcarstest` et `chcars_prod` / `chcarsprod` selon
les besoins. Aucun jeu de données à charger : le contenu est ajouté par
l'administrateur via l'application.

## 2. Configuration

**Aucun fichier `.env` n'est versionné.** `env.ts` charge, dans l'ordre,
`.env.<env>.local` > `.env.<env>` > `.env` (le plus spécifique gagne). On met
les secrets (`DB_PASSWORD`, `JWT_SECRET`) dans le `.local`.

### Backend

Créer `back/.env.development` :

```dotenv
NODE_ENV=development
PORT=4000
API_PREFIX=/api
CORS_ORIGIN=http://localhost:3000
TRUST_PROXY=0
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=chcarsdev
DB_PASSWORD=
DB_DATABASE=chcars_dev
JWT_SECRET=chcars_dev_only_not_a_real_secret_change_in_prod
JWT_EXPIRES_IN=1d
```

Puis `back/.env.development.local` avec le mot de passe MariaDB :

```dotenv
DB_PASSWORD=le_mot_de_passe_de_chcarsdev
```

Pour `test` / `production` : mêmes clés, adapter `NODE_ENV`, `DB_*`, `CORS_ORIGIN`,
`TRUST_PROXY`. **En production, `JWT_SECRET` doit faire ≥ 32 caractères aléatoires**
(`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`)
et vivre dans `back/.env.production.local`.

| Variable | Rôle |
|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` |
| `PORT` / `API_PREFIX` | port et préfixe de l'API |
| `CORS_ORIGIN` | origine exacte autorisée (le frontend) |
| `TRUST_PROXY` | nombre de reverse proxies devant l'API (0 en local) |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | connexion MariaDB |
| `JWT_SECRET` (≥ 32 car.) / `JWT_EXPIRES_IN` | signature et durée de validité des sessions |

### Frontend

Créer `front/.env` :

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

(surcharge possible sans toucher au fichier : `front/.env.local`).

| Variable | Exemple |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` |

## 3. Lancement (développement)

```bash
# Terminal 1 — API
cd back && npm install && npm run dev        # http://localhost:4000/api

# Terminal 2 — client
cd front && npm install && npm run dev       # http://localhost:3000
```

```bash
curl http://localhost:4000/api/health
```

## 4. Créer le premier administrateur

L'inscription publique ne crée que des comptes `user`. Créez le **premier compte
en `super_admin`** (il pourra ensuite nommer les autres administrateurs depuis
l'interface, `/admin/utilisateurs`) :

```bash
cd back
npm run create-admin -- --email=admin@chcars.fr --password=motdepasse123 \
  --firstName=Alice --lastName=Martin --super
```

- sans `--super`, le compte est créé en `admin` simple
- cible l'environnement `development` ; pour la production : `npm run create-admin:prod -- …`
- si l'e-mail existe déjà, le compte est promu (mot de passe réinitialisé)

## API REST

Base : `http://localhost:4000/api`. Réponses :
`{ "success": true, "data": … }` ou `{ "success": false, "message": "…", "details"?: … }`.

| Ressource | Endpoints | Accès |
|---|---|---|
| Santé | `GET /health` | public |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` | public / session pour `/me` |
| Utilisateurs | `GET /users` (`?role=` `?search=`) · `PATCH /users/:id/role` | **super_admin** |
| Marques | `GET /brands` · `GET /brands/:id` | public |
| | `POST /brands` · `PUT /brands/:id` · `DELETE /brands/:id` | **admin** |
| Catégories | `GET /categories` · `GET /categories/:id` | public |
| | `POST` · `PUT` · `DELETE /categories/:id` | **admin** |
| Modèles | `GET /car-models` · `GET /car-models/:id` | public |
| | `POST` · `PUT` · `DELETE /car-models/:id` | **admin** |
| Véhicules | `GET /vehicles` · `GET /vehicles/:id` | public |
| | `POST` · `PUT` · `DELETE /vehicles/:id` | **admin** |
| Photos | `GET /vehicles/:vehicleId/images` | public |
| | `POST` · `PATCH /…/:imageId` · `DELETE /…/:imageId` | **admin** |
| Annonces | `GET /listings` · `GET /listings/:id` | public |
| | `POST` · `PUT /:id` · `PATCH /:id/status` · `DELETE /:id` | **admin** |
| Favoris | `GET /favorites` · `POST /favorites` · `DELETE /favorites/:listingId` | session (tout `user`) |

**Authentification par cookie.** `POST /auth/login` et `/auth/register` posent
un cookie `chcars_token` **httpOnly** (le JWT n'est jamais dans le corps de la
réponse) et un cookie lisible `chcars_csrf`. Les requêtes doivent être envoyées
avec les cookies (`credentials: "include"` côté navigateur, `-c/-b` avec curl).
Toute requête **non‑GET** (hors `/auth/login` et `/auth/register`) doit renvoyer
la valeur du cookie `chcars_csrf` dans l'en‑tête `X-CSRF-Token`.

## Scripts npm

| Emplacement | Commande | Effet |
|---|---|---|
| `back/` | `npm run dev` | API en watch, `NODE_ENV=development` |
| `back/` | `npm run start` | API compilée, `NODE_ENV=production` |
| `back/` | `npm run start:test` | API, `NODE_ENV=test` |
| `back/` | `npm run build` / `npm run typecheck` | compilation / vérification TS |
| `back/` | `npm run create-admin[:prod]` | crée ou promeut un administrateur |
| `front/` | `npm run dev` / `npm run build` / `npm start` | Next.js |
| `front/` | `npm run lint` | ESLint |

## Notes

- Les entités TypeORM (`back/src/entities/`) **mappent des tables existantes** ;
  `synchronize` est désactivé.
- Toute évolution du schéma : mettre à jour `back/db/schema.sql` puis l'appliquer
  manuellement à chaque environnement.
- Aucun fichier `.env*` n'est versionné (voir section 2 pour leur contenu).
