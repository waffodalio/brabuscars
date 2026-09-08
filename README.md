# CHCars

Plateforme web de consultation et de vente de véhicules.

- **`front/`** — application cliente : Next.js 16 (App Router), React 19, TypeScript, Bootstrap (`react-bootstrap`)
- **`back/`** — API REST : Node.js, Express 5, TypeScript, TypeORM, MySQL / MariaDB

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

Les informations et les images des véhicules sont saisies par l'administrateur
depuis l'application ; il n'y a **aucune donnée préremplie** dans la base.

## Prérequis

- **Node.js 20+** et npm
- Un serveur **MySQL** ou **MariaDB** accessible en local

## Environnements

Trois environnements dissociés, chacun avec sa base, son utilisateur MySQL et ses secrets :

| Environnement | Base MySQL | Utilisateur MySQL | Fichier backend |
|---|---|---|---|
| développement | `chcars_dev` | `chcarsdev` | `back/.env.development` |
| test | `chcars_test` | `chcarstest` | `back/.env.test` |
| production | `chcars_prod` | `chcarsprod` | `back/.env.production` |

Chaque fichier `back/.env.<env>` se crée à partir du `back/.env.<env>.example`
correspondant (versionné). `env.ts` charge automatiquement le bon fichier selon
`NODE_ENV` (`.env.<env>.local` > `.env.<env>` > `.env`).

## 1. Base de données

> ⚠️ L'application ne crée, ne modifie ni ne supprime aucune table
> (`synchronize: false`). Les opérations ci-dessous sont à exécuter
> **manuellement** avec un client MySQL, **pour chaque environnement utilisé**.

Exemple pour le développement :

```sql
CREATE DATABASE chcars_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chcarsdev'@'localhost' IDENTIFIED BY 'choisir_un_mot_de_passe';
GRANT ALL PRIVILEGES ON chcars_dev.* TO 'chcarsdev'@'localhost';
FLUSH PRIVILEGES;
```

```bash
mysql -u chcarsdev -p chcars_dev < back/db/schema.sql
```

Répéter avec `chcars_test` / `chcarstest` et `chcars_prod` / `chcarsprod` selon
les besoins. Aucun jeu de données à charger : le contenu est ajouté par
l'administrateur via l'application.

## 2. Configuration

### Backend

```bash
cd back
cp .env.development.example .env.development     # puis renseigner DB_PASSWORD, JWT_SECRET…
# (idem .env.test.example / .env.production.example si besoin)
```

| Variable | Rôle |
|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` |
| `PORT` / `API_PREFIX` | port et préfixe de l'API |
| `CORS_ORIGIN` | origine autorisée (le frontend) |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | connexion MySQL de l'environnement |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | signature et durée de validité des tokens |

### Frontend — `front/.env.local`

```bash
cd front
cp .env.example .env.local
```

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

L'inscription publique ne crée que des comptes `user`. Pour obtenir un `admin` :

```bash
cd back
npm run create-admin -- --email=admin@chcars.fr --password=motdepasse123 \
  --firstName=Alice --lastName=Martin
```

- cible l'environnement `development` ; pour la production : `npm run create-admin:prod -- …`
- si l'e-mail existe déjà, le compte est promu `admin` (mot de passe réinitialisé)

## API REST

Base : `http://localhost:4000/api`. Réponses :
`{ "success": true, "data": … }` ou `{ "success": false, "message": "…", "details"?: … }`.

| Ressource | Endpoints | Accès |
|---|---|---|
| Santé | `GET /health` | public |
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` | public / token pour `/me` |
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
| Favoris | `GET /favorites` · `POST /favorites` · `DELETE /favorites/:listingId` | token (tout `user`) |

En-tête des routes protégées : `Authorization: Bearer <token>` (obtenu via
`/auth/login` ou `/auth/register`).

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
- Les secrets ne sont jamais commités : seuls les fichiers `*.env.*.example` le sont.
