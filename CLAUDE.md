# CHCars

Plateforme web de consultation et de vente de véhicules.

## Structure du dépôt

Monorepo à deux applications **strictement séparées** :

| Dossier  | Rôle                        | Stack                                                   |
| -------- | --------------------------- | ------------------------------------------------------- |
| `front/` | Application cliente         | Next.js 16 (App Router), React 19, TypeScript, Bootstrap (`react-bootstrap`) |
| `back/`  | API REST                    | Node.js, Express 5, TypeScript, TypeORM, MariaDB (10.11 LTS+) |

Ne jamais mélanger le code `front/` et `back/`. Le frontend communique **uniquement** avec l'API backend (jamais directement avec la base de données).

## Règles générales

- Tout le code est en TypeScript.
- Code simple, lisible, maintenable ; respect de SOLID quand c'est pertinent ; pas de duplication.
- Aucun secret dans le code : tout passe par des variables d'environnement. **Aucun fichier `.env*` n'est versionné** (contenu documenté dans `README.md` §2) ; les secrets vont dans `.env.<env>.local`, chargés en priorité par `env.ts`.
- **Environnements dissociés** : `development` / `test` / `production`, chacun avec sa base MariaDB, son utilisateur (`chcarsdev` / `chcarstest` / `chcarsprod`) et son fichier `back/.env.<env>`. `env.ts` charge le bon fichier selon `NODE_ENV`, ordre `.env.<env>.local` > `.env.<env>` > `.env`.
- Ne pas supprimer de code fonctionnel sans le signaler.

## Frontend (`front/`)

- Routage : App Router de Next (dossier `app/`). Pas de React Router.
- UI : Bootstrap via `react-bootstrap`. Éviter le CSS personnalisé quand une solution Bootstrap existe. Le CSS Bootstrap est importé une seule fois dans `app/layout.tsx`.
- Composants `react-bootstrap` interactifs → marquer `"use client"`.
- Code applicatif dans `front/src/` : `components/`, `layouts/`, `services/` (client API), `hooks/`, `context/`, `types/`, `utils/`. Alias d'import : `@/*` → `front/src/*`.
- Appels HTTP via `src/services/apiClient.ts` ; URL de l'API dans `NEXT_PUBLIC_API_URL`.
- `front/AGENTS.md` est un bloc géré et régénéré par `next dev` — le committer tel quel.
- Vérification : `npm run build` (le check TypeScript de Next utilise des types générés absents d'un `tsc` isolé).

## Backend (`back/`)

Architecture en couches : **Route → Controller → Service → Repository → Entity/DB**.

- `routes/` : définition des endpoints, branchement vers les controllers uniquement.
- `controllers/` : réception requête, validation d'entrée (zod), appel service, réponse HTTP. Pas de logique métier.
- `services/` : logique métier.
- `repositories/` : accès aux données via TypeORM. Pas de SQL brut dans controllers/routes.
- `entities/` : entités TypeORM.
- `middlewares/` : `errorHandler` (gestion centralisée), `notFoundHandler`, `authenticate` / `authorize` (+ `adminOnly`).
- `config/` : `env.ts` (chargement `.env.<env>` + validation zod), `data-source.ts` (TypeORM).
- `scripts/` : `createAdmin.ts` (`npm run create-admin [-- --super]`), seul moyen d'obtenir un compte `admin` / `super_admin` hors interface.
- `utils/` : `ApiError`, enveloppes de réponse, `actor.ts`, `cookies.ts`, mappers de réponse.

### Rôles et accès

Hiérarchie : `user` < `admin` < `super_admin`. `authorize(minRole)` vérifie un **rang minimal** (via `ROLE_RANK`), donc un `super_admin` passe partout où un `admin` est requis.

- **`user`** : consulter le catalogue + annonces publiées, gérer ses favoris. L'inscription publique ne crée que des `user`.
- **`admin`** : + gérer tout le **catalogue** (marques, catégories, modèles, véhicules) et les **annonces** (dont leurs **photos**). Routes d'écriture protégées par `adminOnly`.
- **`super_admin`** : + gérer les **comptes** — `GET /api/users`, `PATCH /api/users/:id/role` (bascule `user` ⇄ `admin`), routes protégées par `superAdminOnly`. Ne peut pas changer son propre rôle ni celui d'un autre `super_admin` ; le rôle `super_admin` ne s'attribue jamais via l'API.
- Côté front : `useAuth()` expose `isAdmin` / `isSuperAdmin` ; `AdminGuard` protège `/admin/*`, la page `/admin/utilisateurs` exige `isSuperAdmin`.
- **Pas de données préremplies / de seed** : le contenu est saisi par l'administrateur via l'application.
- Attente de l'utilisateur : livrer de **vraies fonctionnalités de gestion** (actions/CRUD/interrupteurs qui modifient l'état via l'API), pas seulement des pages d'affichage.

### Concession unique & contact

- CHCars est **une seule concession** : tous les véhicules sont à la même adresse. Pas de ville par annonce (`Listing.city`/`postal_code` retirés). Les coordonnées viennent des variables `env.COMPANY_*`, exposées par `GET /api/company` (public) et partagées côté front via `CompanyContext` / `useCompany()`.
- Formulaire de contact public : `POST /api/contact` (exempt de CSRF, rate-limité, honeypot `website` que le service ignore silencieusement) → table `contact_message`. `GET`/`PATCH`/`DELETE /api/contact[/:id]` réservés à l'admin (page `/admin/messages`).

Réponses API cohérentes :
- succès : `{ "success": true, "data": ... }`
- erreur : `{ "success": false, "message": "...", "details"?: ... }`

Vérification : `npm run typecheck` puis `npm run build`.

### Sécurité (à préserver)

- `app.ts` : `helmet` (CSP `default-src 'none'`, HSTS en prod, CORP `same-site`), CORS restreint à `env.CORS_ORIGIN` (méthodes/headers explicites), corps JSON limité à 32 kB, `hpp`, `x-powered-by` désactivé, `trust proxy` = `env.TRUST_PROXY`.
- Rate limiting (`middlewares/rateLimit.ts`) : général 300/15 min sur toute l'API, strict 10/15 min sur `/auth/register` et `/auth/login`.
- JWT : algorithme épinglé à `HS256` (signature **et** vérification) ; `JWT_SECRET` ≥ 32 caractères imposé par `env.ts`.
- **Authentification par cookie** : `auth.controller` pose le JWT dans un cookie `chcars_token` **httpOnly** (jamais dans le corps de réponse) + un cookie lisible `chcars_csrf` (`utils/cookies.ts`). `authenticate` lit le cookie (repli sur `Authorization: Bearer` pour l'outillage). `POST /auth/logout` efface les cookies.
- **CSRF** : double-submit (`middlewares/csrf.ts`) — `ensureCsrfCookie` garantit le cookie, `verifyCsrf` exige l'en-tête `X-CSRF-Token` = cookie sur toute requête non-GET, sauf `/auth/login` et `/auth/register`. CORS avec `credentials: true` et origine unique.
- Login à temps constant (`auth.service.ts` : bcrypt toujours exécuté, hash factice si l'e-mail est inconnu) ; bcrypt en 12 tours.
- Recherches : `escapeLike()` sur toute valeur passée à `Like(...)`.
- `errorHandler` : jamais de stack ni de message interne au client en production.
- Validation d'entrée : schémas zod `.strict()` (rejet des clés inconnues).
- Frontend : en-têtes via `next.config.ts` (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS, `poweredByHeader: false`) et CSP via `proxy.ts` (le « middleware » Next 16 ; stricte + nonce en production, permissive en dev pour le HMR). `apiClient` envoie `credentials: "include"` et l'en-tête `X-CSRF-Token` sur les requêtes mutantes.

### Images

Les photos sont rattachées à l'**annonce** (`ListingImage`, route imbriquée `/api/listings/:listingId/images`). Upload en `multipart/form-data` (champ `file`), admin only : `multer` (mémoire) → validation via `sharp().metadata()` → ré-encodage **WebP ≤ 2000 px** + vignette 400 px (`imageProcessor`), EXIF supprimée. Les fichiers vont sur disque via `StorageService` (`LocalDiskStorage`, dossier `env.UPLOAD_DIR`) ; la base ne stocke que `storage_key` + métadonnées. L'URL publique est reconstruite à partir de `env.PUBLIC_UPLOADS_URL`. Supprimer une annonce efface aussi ses fichiers (`listingImageService.purgeForListing`).

### Base de données

- `synchronize` et `migrationsRun` sont **toujours** à `false` dans `data-source.ts` — l'app ne touche jamais au schéma au runtime.
- Le schéma vit dans `back/db/schema.sql` (`CREATE TABLE IF NOT EXISTS`). Il s'applique via `npm run migrate` (`src/scripts/migrate.ts`, connexion `mysql2` directe, ciblé par `NODE_ENV`).
- **Ne jamais lancer de commande destructive** (`DROP`, `TRUNCATE`, `DELETE` massif) sur la base sans demande explicite de l'utilisateur.
- À chaque changement de schéma : mettre à jour `schema.sql` (nouvelle table = `CREATE TABLE IF NOT EXISTS` ; changement de colonne = ajouter un `ALTER` commenté dans la section « Migrations » en bas), puis `npm run migrate`.
- La création de la **base** et de l'**utilisateur** MariaDB reste manuelle (hors périmètre du script).

## Démarrage local

```bash
# Backend  (back/.env.development est déjà versionné ; surcharger DB_PASSWORD
#           dans back/.env.development.local si besoin)
cd back && npm install && npm run dev                     # http://localhost:4000/api
npm run create-admin -- --email=… --password=…            # 1er administrateur

# Frontend (front/.env est déjà versionné)
cd front && npm install && npm run dev                    # http://localhost:3000
```

Voir `README.md` pour la création des bases par environnement.
