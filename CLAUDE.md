# CHCars

Plateforme web de consultation et de vente de véhicules.

## Structure du dépôt

Monorepo à deux applications **strictement séparées** :

| Dossier  | Rôle                        | Stack                                                   |
| -------- | --------------------------- | ------------------------------------------------------- |
| `front/` | Application cliente         | Next.js 16 (App Router), React 19, TypeScript, Bootstrap (`react-bootstrap`) |
| `back/`  | API REST                    | Node.js, Express 5, TypeScript, TypeORM, MySQL/MariaDB  |

Ne jamais mélanger le code `front/` et `back/`. Le frontend communique **uniquement** avec l'API backend (jamais directement avec la base de données).

## Règles générales

- Tout le code est en TypeScript.
- Code simple, lisible, maintenable ; respect de SOLID quand c'est pertinent ; pas de duplication.
- Aucun secret dans le code : tout passe par des variables d'environnement. Seuls les fichiers `*.example` sont commités.
- **Environnements dissociés** : `development` / `test` / `production`, chacun avec sa base MySQL, son utilisateur (`chcarsdev` / `chcarstest` / `chcarsprod`) et son fichier `back/.env.<env>` (modèle `back/.env.<env>.example`). `env.ts` charge le bon fichier selon `NODE_ENV`.
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
- `scripts/` : `createAdmin.ts` (`npm run create-admin`), seul moyen d'obtenir un compte `admin`.
- `utils/` : `ApiError`, enveloppes de réponse, `actor.ts`, mappers de réponse.

### Rôles et accès

- Le **catalogue** (marques, catégories, modèles, véhicules, photos) et les **annonces** sont gérés **uniquement par un `admin`** : routes d'écriture protégées par `adminOnly`.
- Un `user` peut seulement consulter et gérer ses favoris. L'inscription publique ne crée que des comptes `user`.
- **Pas de données préremplies / de seed** : le contenu est saisi par l'administrateur via l'application.

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
- Frontend : en-têtes via `next.config.ts` (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS, `poweredByHeader: false`) et CSP via `middleware.ts` (stricte + nonce en production, permissive en dev pour le HMR). `apiClient` envoie `credentials: "include"` et l'en-tête `X-CSRF-Token` sur les requêtes mutantes.

### Base de données — RÈGLE STRICTE

La création et la gestion des tables sont faites **manuellement par le propriétaire du projet**.

- `synchronize` et `migrationsRun` sont **toujours** à `false` dans `data-source.ts`.
- Ne jamais créer, modifier ou supprimer de table ; ne jamais lancer de migration ou de commande destructive sur la base.
- Rôle des entités TypeORM : mapper des tables **existantes**.
- À chaque nouvelle entité, fournir au propriétaire : rôle, propriétés, relations, et le `CREATE TABLE` MySQL correspondant qu'il exécutera lui-même.

## Démarrage local

```bash
# Backend
cd back && cp .env.development.example .env.development   # renseigner DB_PASSWORD, JWT_SECRET…
npm install && npm run dev                                # http://localhost:4000/api
npm run create-admin -- --email=… --password=…            # 1er administrateur

# Frontend
cd front && cp .env.example .env.local
npm install && npm run dev                                # http://localhost:3000
```

Voir `README.md` pour la création des bases par environnement.
