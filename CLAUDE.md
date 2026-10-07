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
- `scripts/` : `createAdmin.ts` (`npm run create-admin [-- --super]`), seul moyen d'obtenir un compte `admin` / `super_admin` hors interface ; `resetMfa.ts` (`npm run reset-mfa -- --email=…`) supprime la 2FA d'un compte (réenrôlement à la connexion suivante).
- `utils/` : `ApiError`, enveloppes de réponse, `actor.ts`, `cookies.ts`, mappers de réponse.

### Rôles et accès

Hiérarchie : `user` < `admin` < `super_admin`. `authenticate` **relit le rôle en base** à chaque requête (le rôle du JWT n'est pas utilisé) : un changement de rôle prend effet immédiatement, et un compte disparu est rejeté en 401. `authorize(minRole)` vérifie un **rang minimal** (via `ROLE_RANK`), donc un `super_admin` passe partout où un `admin` est requis.

- **Visiteur (non connecté) & `user`** : consulter **uniquement les annonces publiées** — chaque annonce porte le nom de sa marque / son modèle / sa catégorie. `GET /api/listings` force `status=published` (et ignore `sellerId`) pour tout non-admin ; `GET /api/listings/:id` renvoie 404 sur une annonce non publiée. Un `user` gère en plus ses favoris ; l'inscription publique ne crée que des `user`.
- Les **référentiels catalogue ne sont jamais exposés hors administration** : `GET /api/brands`, `GET /api/categories`, `GET /api/car-models` — liste **et** détail — sont derrière `adminOnly`. Les filtres marque / modèle / catégorie de la page publique `/annonces` sont donc dérivés des annonces elles-mêmes, pas d'un appel aux référentiels.
- **`admin`** : + gérer tout le **catalogue** (marques, catégories, modèles, véhicules) et les **annonces** (dont leurs **photos**). Routes d'écriture protégées par `adminOnly`.
- **`super_admin`** : + gérer les **comptes** — `GET /api/users`, `PATCH /api/users/:id/role` (bascule `user` ⇄ `admin`), routes protégées par `superAdminOnly`. Ne peut pas changer son propre rôle ni celui d'un autre `super_admin` ; le rôle `super_admin` ne s'attribue jamais via l'API. Chaque changement effectif est journalisé (table `role_change_log`, même transaction) et consultable via `GET /api/users/role-changes` ; côté front, l'interrupteur passe par une modale de confirmation. `DELETE /api/users/:id` supprime **uniquement un compte `user`** (jamais un admin, ni soi-même) : favoris en cascade, historique conservé, annonces éventuelles (ancien admin) réattribuées au super_admin.
- Côté front : `useAuth()` expose `isAdmin` / `isSuperAdmin` ; `AdminGuard` protège `/admin/*`, la page `/admin/utilisateurs` exige `isSuperAdmin`.
- **Pas de données préremplies / de seed** : le contenu est saisi par l'administrateur via l'application.
- Attente de l'utilisateur : livrer de **vraies fonctionnalités de gestion** (actions/CRUD/interrupteurs qui modifient l'état via l'API), pas seulement des pages d'affichage.

### Concession unique & contact

- CHCars est **une seule concession** : tous les véhicules sont à la même adresse. Pas de ville par annonce (`Listing.city`/`postal_code` retirés). Les coordonnées viennent des variables `env.COMPANY_*`, exposées par `GET /api/company` (public) et partagées côté front via `CompanyContext` / `useCompany()`. Liens réseaux sociaux du pied de page : `COMPANY_INSTAGRAM_URL` / `COMPANY_FACEBOOK_URL` (optionnels, `https://` uniquement, icône masquée si vide).
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
- **Double authentification (TOTP) obligatoire pour `admin` / `super_admin`** (et tout compte l'ayant activée) : `POST /auth/login` ne pose alors pas la session mais un cookie httpOnly `chcars_mfa` (JWT `typ: mfa_pending`, 5 min) ; `POST /auth/mfa/setup` (1er enrôlement : secret + URI `otpauth://`) puis `POST /auth/mfa/verify` (code TOTP ou code de secours) posent la session, dont le JWT porte `mfa: true`. `authenticate` refuse toute session admin sans ce claim. Tables `user_mfa` (secret chiffré AES-256-GCM via `MFA_ENCRYPTION_KEY`, anti-rejeu `last_used_step`, verrouillage 5 échecs → 15 min) et `user_recovery_code` (SHA-256, usage unique). TOTP implémenté sans dépendance (`utils/totp.ts`, vecteurs RFC testés). Réinitialisation : `npm run reset-mfa -- --email=…`.
- **Connexion Google (OpenID Connect)**, optionnelle (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`, sinon `GET /auth/providers` → `google: false` et bouton masqué). Flux code + PKCE côté serveur, sans dépendance (`utils/googleOAuth.ts`) : `GET /auth/google` pose un cookie httpOnly signé `chcars_oauth` (state + nonce + verifier, 10 min, `SameSite=Lax`) et redirige vers Google ; `GET /auth/google/callback` vérifie `state`, échange le code, valide les claims de l'ID token (iss, aud, exp, nonce, `email_verified`), puis redirige vers le front (`/<locale>`, `/<locale>/connexion?mfa=enroll|code` si 2FA due, `?google=<raison>` en cas d'échec). Compte retrouvé par `user.google_sub`, sinon rattaché au compte de même e-mail (refus si déjà lié à un autre compte Google), sinon créé en `user` **sans mot de passe** (`password_hash` NULL → connexion par mot de passe refusée). Un admin passe toujours par la 2FA.
- Login à temps constant (`auth.service.ts` : bcrypt toujours exécuté, hash factice si l'e-mail est inconnu) ; bcrypt en 12 tours.
- Recherches : `escapeLike()` sur toute valeur passée à `Like(...)`.
- `errorHandler` : jamais de stack ni de message interne au client en production.
- Validation d'entrée : schémas zod `.strict()` (rejet des clés inconnues).
- Frontend : en-têtes via `next.config.ts` (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS, `poweredByHeader: false`) et CSP via `proxy.ts` (le « middleware » Next 16 ; stricte + nonce en production, permissive en dev pour le HMR). `apiClient` envoie `credentials: "include"` et l'en-tête `X-CSRF-Token` sur les requêtes mutantes.

### Images

Les photos sont rattachées à l'**annonce** (`ListingImage`, route imbriquée `/api/listings/:listingId/images`). Upload en `multipart/form-data` (champ `file`), admin only : `multer` (mémoire) → validation via `sharp().metadata()` → ré-encodage **WebP ≤ 2000 px** + vignette 400 px (`imageProcessor`), EXIF supprimée. Les fichiers vont sur disque via `StorageService` (`LocalDiskStorage`, dossier `env.UPLOAD_DIR`) ; la base ne stocke que `storage_key` + métadonnées. L'URL publique est reconstruite à partir de `env.PUBLIC_UPLOADS_URL`. Supprimer une annonce efface aussi ses fichiers (`listingImageService.purgeForListing`).

### Base de données

- `synchronize` et `migrationsRun` sont **toujours** à `false` dans `data-source.ts` — l'app ne touche jamais au schéma au runtime.
- Le schéma vit dans des **migrations versionnées** `back/db/migrations/NNN_description.sql` (`001_init.sql` = schéma initial). `npm run migrate` (`src/scripts/migrate.ts`, connexion `mysql2` directe, ciblé par `NODE_ENV`, verrou `GET_LOCK`) applique dans l'ordre celles qui manquent et les enregistre dans `schema_migrations` (avec empreinte SHA-256) ; il s'arrête à la première erreur. `deploy.sh` le lance à chaque déploiement, **précédé d'une sauvegarde** (`mariadb-dump` → `backups/<date>_<tag>.sql.gz` dans le dossier de déploiement, rotation `BACKUP_KEEP` = 10 par défaut ; déploiement arrêté si le dump échoue). Restauration : `README.md` § « Sauvegardes de la base ».
- **Ne jamais lancer de commande destructive** (`DROP`, `TRUNCATE`, `DELETE` massif) sur la base sans demande explicite de l'utilisateur.
- À chaque changement de schéma : **ajouter un nouveau fichier** de migration (numéro suivant), puis `npm run migrate`. **Ne jamais modifier une migration déjà appliquée** (empreinte vérifiée, le script refuse). Les entités TypeORM doivent rester alignées sur le résultat.
- La création de la **base** et de l'**utilisateur** MariaDB reste manuelle (hors périmètre du script).

## CI/CD (`.github/workflows/`, `deploy/`, `e2e/`)

Pipeline `ci-cd.yml` : tests back + front → build Docker → GHCR (`chcars-back` / `chcars-front`, tag `sha-<commit>`) → déploiement préprod → Playwright E2E (`e2e/`) → production. `deploy.yml` est le workflow réutilisable (et lançable à la main pour un rollback) : SSH + `deploy/deploy.sh` (`docker compose`, MariaDB ; reverse proxy = **nginx du serveur**, `deploy/nginx/chcars.conf` + certbot, installé à la main — les conteneurs n'écoutent que sur `127.0.0.1`, préprod et prod sur **le même serveur** : un dossier, un `.env` et un `COMPOSE_PROJECT_NAME` chacun (vérifié par `deploy.sh`), ports serveur prod 3010/3011/3012 et préprod 3013/3014/3015 via `FRONT_PORT` / `BACK_PORT` / `DB_HOST_PORT`, un site nginx par environnement généré depuis le modèle `deploy/nginx/chcars.conf`). Détails et mise en place : `README.md` § « CI/CD et déploiement ».

- **Une seule image par commit**, promue de la préprod à la prod : rien de spécifique à un environnement ne doit être figé au build. Le front est construit avec `NEXT_PUBLIC_API_URL=/api` (même origine derrière nginx) ; tout le reste passe par le `.env` du serveur.
- `e2e/` est un package de tests indépendant (pas une 3ᵉ application) ; il ne vise que des environnements déployés, jamais la prod (création de comptes de test).
- Le back est compilé via `tsconfig.build.json` (exclut les `*.test.ts`) ; `migrate` / `createAdmin` tournent dans le conteneur via `node dist/scripts/*.js`.
- Le front est en `output: "standalone"` (requis par `front/Dockerfile`).

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
