# CHCars

Plateforme web de consultation et de vente de véhicules.

- **`front/`** — application cliente : Next.js 16 (App Router), React 19, TypeScript, Bootstrap (`react-bootstrap`)
- **`back/`** — API REST : Node.js, Express 5, TypeScript, TypeORM, MariaDB

Le frontend ne parle **qu'à l'API backend** ; toute la communication avec la base de données passe par `back/`.

```text
chcars/
├── back/
│   ├── db/migrations/      # migrations SQL versionnées (001_init.sql, …)
│   └── src/
│       ├── config/         # env.ts (chargement + validation zod), data-source.ts
│       ├── entities/       # entités TypeORM
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
| *(visiteur)* | consulter les **annonces publiées** (avec leur marque / modèle / catégorie), envoyer un message via `/contact` — les référentiels marques / modèles / catégories ne sont pas exposés hors administration |
| `user` | + s'inscrire / se connecter, gérer ses favoris |
| `admin` | + gérer le **catalogue** (marques, catégories, modèles), les **annonces** (caractéristiques du véhicule + **photos**, saisies dans le même formulaire) et les **messages de contact** |
| `super_admin` | + **gérer les comptes** : lister les utilisateurs, basculer un compte `user` ⇄ `admin` |

Les rôles sont hiérarchiques (`user` < `admin` < `super_admin`). Les informations
et les images des véhicules sont saisies par l'administrateur depuis
l'application ; il n'y a **aucune donnée préremplie** dans la base.

CHCars est une **concession unique** : tous les véhicules sont à la même adresse.
Il n'y a donc pas de ville par annonce — les coordonnées (adresse, téléphone,
horaires) viennent des variables `COMPANY_*` et sont exposées par `GET /api/company`.

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

L'application ne crée ni ne modifie aucune table au runtime (`synchronize: false`).
La création de la **base** et de l'**utilisateur** MariaDB reste manuelle ; les
**tables** s'appliquent avec `npm run migrate`.

**a. Base + utilisateur** (exemple développement) :

```sql
CREATE DATABASE chcars_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chcarsdev'@'localhost' IDENTIFIED BY 'choisir_un_mot_de_passe';
GRANT ALL PRIVILEGES ON chcars_dev.* TO 'chcarsdev'@'localhost';
FLUSH PRIVILEGES;
```

**b. Tables** — depuis `back/`, une fois `.env.development` renseigné :

```bash
npm run migrate            # dev  (npm run migrate:test / migrate:prod pour les autres)
```

Le script applique, dans l'ordre, les fichiers de `back/db/migrations/`
(`001_init.sql`, `002_….sql`…) qui ne l'ont pas encore été, et les enregistre
dans la table `schema_migrations`. Ré-exécutable : sans nouvelle migration, il ne
fait rien. Il s'arrête (code de sortie ≠ 0) à la première erreur.

**Faire évoluer le schéma** : ajouter un nouveau fichier `NNN_description.sql`
(numéro suivant, minuscules et `_`), par exemple `002_listing_add_vin.sql` :

```sql
ALTER TABLE `listing` ADD COLUMN `vin` VARCHAR(17) NULL AFTER `color`;
```

Ne **jamais modifier** une migration déjà appliquée quelque part : le script
compare une empreinte SHA-256 et refuse de continuer. Corriger avec une nouvelle
migration. MariaDB valide chaque `ALTER` immédiatement : une migration en échec
n'est pas annulée, il faut remettre la base d'aplomb à la main avant de relancer.

Répéter (a) avec `chcars_test` / `chcarstest` et `chcars_prod` / `chcarsprod` selon
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
MFA_ENCRYPTION_KEY=<64 caractères hex : openssl rand -hex 32>
# Connexion Google (optionnelle — bouton masqué si vide) : secrets dans .env.development.local
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
# E-mails (Brevo) — optionnel en dev : sans SMTP_HOST, l'e-mail (et le lien) s'affiche dans la console
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=BrabusCars <no-reply@brabuscars.be>
UPLOAD_DIR=uploads
PUBLIC_UPLOADS_URL=http://localhost:4000/uploads
DOCUMENTS_DIR=documents
MAX_UPLOAD_BYTES=15728640
MAX_IMAGES_PER_LISTING=20
COMPANY_NAME=BrabusCars
COMPANY_ADDRESS=12 avenue de l'Automobile
COMPANY_POSTAL_CODE=69003
COMPANY_CITY=Lyon
COMPANY_COUNTRY=France
COMPANY_PHONE=+33 4 78 00 00 00
COMPANY_EMAIL=contact@brabuscars.be
COMPANY_HOURS=Du lundi au samedi, 9h–19h
COMPANY_HOURS_EN=Monday to Saturday, 9 am–7 pm
COMPANY_HOURS_NL=Maandag tot zaterdag, 9u–19u
COMPANY_INSTAGRAM_URL=https://www.instagram.com/<compte>
COMPANY_FACEBOOK_URL=https://www.facebook.com/<page>
# Mentions des bons de commande / factures (facultatives mais recommandées)
COMPANY_VAT_NUMBER=BE 0123.456.789
COMPANY_IBAN=BE68 5390 0754 7034
COMPANY_BIC=GKCCBEBB
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
| `MFA_ENCRYPTION_KEY` (64 hex, **obligatoire**) / `MFA_ISSUER` | clé AES-256 qui chiffre les secrets 2FA des admins (`openssl rand -hex 32`, différente par environnement, **à ne jamais changer** une fois des admins enrôlés) ; nom affiché dans l'application d'authentification (défaut `BrabusCars`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | « Continuer avec Google » (optionnel : les deux identifiants ensemble, ou aucun — le bouton est alors masqué). Client OAuth « Application Web » de la Google Cloud Console ; l'URI de redirection autorisée doit être exactement `GOOGLE_REDIRECT_URI` (`<origine de l'API>/api/auth/google/callback`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `MAIL_FROM` | envoi des e-mails (lien « mot de passe oublié », avis de changement de mot de passe) via **Brevo** : `smtp-relay.brevo.com`, port `587` (STARTTLS ; `465` = TLS direct), identifiant et **clé SMTP** de Brevo (*Paramètres → SMTP & API → Clés SMTP*, pas la clé API). `MAIL_FROM` = expéditeur affiché, dont l'adresse doit être un expéditeur ou un domaine **vérifié** dans Brevo (SPF/DKIM). Sans `SMTP_HOST` : e-mails affichés dans la console en dev/test, **non envoyés** en production (avertissement dans les logs, lien jamais journalisé) |
| `UPLOAD_DIR` | dossier où sont écrits les fichiers image (hors dépôt ; hors dossier de déploiement en prod) |
| `PUBLIC_UPLOADS_URL` | préfixe d'URL publique des images (`…/uploads`) |
| `DOCUMENTS_DIR` | dossier **privé** des bons de commande et factures PDF (`back/documents/` par défaut, ignoré par git) ; jamais servi publiquement, téléchargé uniquement via l'API admin. En prod : volume Docker `documents` |
| `MAX_UPLOAD_BYTES` / `MAX_IMAGES_PER_LISTING` | limites d'upload (défaut 15 Mo / 20 images) |
| `COMPANY_*` | coordonnées de la concession (nom, adresse, CP, ville, pays, téléphone, e-mail, horaires) — l'adresse suffit, la carte (Google Maps) géolocalise automatiquement |
| `COMPANY_HOURS_EN` / `COMPANY_HOURS_NL` | horaires affichés sur le site en anglais / néerlandais (optionnels ; à défaut, `COMPANY_HOURS` en français) |
| `COMPANY_VAT_NUMBER` / `COMPANY_IBAN` / `COMPANY_BIC` | n° de TVA, IBAN et BIC de la concession, imprimés sur les bons de commande et factures (pied de page) ; facultatifs mais recommandés. Le n° de TVA sert aussi de n° d'entreprise (BCE) dans les mentions légales |
| `COMPANY_LEGAL_NAME` / `COMPANY_HOSTING` | pages Mentions légales / Confidentialité : raison sociale avec sa forme (« BrabusCars SRL », défaut `COMPANY_NAME`) et hébergeur du serveur (nom + adresse, ex. « OVH SAS, 2 rue Kellermann, 59100 Roubaix, France ») ; facultatifs, mais l'hébergeur est attendu dans les mentions légales |
| `COMPANY_INSTAGRAM_URL` / `COMPANY_FACEBOOK_URL` | pages Instagram / Facebook affichées dans le pied de page (optionnelles, `https://` uniquement ; icône masquée si vide) |

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
npm run create-admin -- --email=admin@brabuscars.be --password=motdepasse123 \
  --firstName=Alice --lastName=Martin --super
```

- sans `--super`, le compte est créé en `admin` simple
- cible l'environnement `development` ; pour la production : `npm run create-admin:prod -- …`
- si l'e-mail existe déjà, le compte est promu (mot de passe réinitialisé)

### Double authentification (admins)

Les comptes `admin` et `super_admin` se connectent obligatoirement avec un code
TOTP (Google Authenticator, Microsoft Authenticator, Authy, 1Password…). À la
**première connexion**, après le mot de passe, un QR code s'affiche : l'admin le
scanne, saisit le premier code, et reçoit **10 codes de secours** à usage
unique (affichés une seule fois). Un `user` promu admin passe par cet enrôlement
à sa connexion suivante (sa session en cours est invalidée).

- 5 codes faux d'affilée bloquent le second facteur du compte 15 minutes.
- Téléphone **et** codes de secours perdus : `npm run reset-mfa -- --email=…`
  (`reset-mfa:prod` pour la production) — l'admin refait l'enrôlement.

### Mot de passe oublié

- Sur la page de connexion, « Mot de passe oublié ? » : l'utilisateur saisit son
  e-mail et reçoit un lien `…/<langue>/reinitialiser-mot-de-passe?token=…`,
  **valable 30 minutes, à usage unique** (seule l'empreinte SHA-256 du jeton est
  en base, table `password_reset_token`). La réponse est identique que le compte
  existe ou non ; un seul e-mail toutes les 2 minutes par compte, 5 demandes /
  15 min par IP. Une nouvelle demande annule le lien précédent. Fonctionne aussi
  pour un compte créé avec Google (il peut ainsi définir un mot de passe).
- C'est le seul moyen de changer de mot de passe (pas de formulaire dans « Mon compte »).
- `user.password_changed_at` est mis à jour et **toutes les sessions ouvertes
  avant sont refusées** (tous les appareils sont déconnectés), et un e-mail
  d'avis « votre mot de passe a été modifié » est envoyé. La réinitialisation
  n'ouvre pas de session : un admin repasse par sa double authentification.

### Réservations

Sur une annonce publiée, un client **connecté** peut **réserver le véhicule**
(mise de côté) ou **planifier un essai / une visite** (date + heure, de 8 h à
20 h, au moins 1 h à l'avance, au plus 90 jours) :

- **Compte obligatoire** : un visiteur qui clique sur « Réserver » ou « Planifier
  un essai » arrive directement sur la page de connexion (lien « Créer un
  compte » sur place) ; une fois connecté (mot de passe, inscription ou Google),
  il revient sur l'annonce avec le formulaire ouvert (retour gardé en
  `sessionStorage`, chemins du site uniquement).
- Le client donne son téléphone (nom et e-mail viennent du compte) ; la demande
  part directement à la concession. Il la suit et peut l'annuler dans « Mon compte ».
- **Admin** (`/admin/reservations`) : confirme (mise de côté de 3 à 30 jours,
  7 par défaut ; rendez-vous éventuellement déplacé), refuse ou annule, avec un
  message facultatif. Le client est prévenu par e-mail à chaque étape, la
  concession (`COMPANY_EMAIL`) à chaque nouvelle demande ou annulation client.
- Une seule **mise de côté active** par véhicule (vérifiée sous verrou) : tant
  qu'elle court, l'annonce affiche « Réservé » et n'accepte plus de mise de
  côté, mais toujours des visites.
- **Véhicule vendu, archivé ou hors ligne** alors que des réservations sont en
  cours : rien n'est annulé automatiquement, mais c'est signalé partout (page
  Réservations, liste et fiche des annonces, dossier de vente, « Mon compte »
  du client) ; la confirmation est bloquée et le refus prérempli (« Ce véhicule
  a été vendu… »). Une annonce qui a des réservations en cours ne peut pas être
  supprimée : il faut d'abord les refuser ou les annuler (le client est prévenu).

Réserver ne dépend pas de l'envoi d'e-mails ; sans SMTP, seuls les avis
(client et concession) ne partent pas.

### Facturation (dossiers de vente)

Module du back-office (`/admin/ventes`, admin), **indépendant des comptes clients** :
l'acheteur est saisi à la main.

- **Dossier** : acheteur, véhicule (choisi dans les annonces pour préremplir, ou
  saisi librement), n° de châssis, lignes (prix TVA comprise : véhicule, frais,
  garantie…), régime de TVA : **marge** (occasion, TVA non détaillée + mention
  légale) ou **TVA 21 %** (HTVA / TVA / TVAC détaillés).
- **Paiements** saisis par l'admin (montant, date, mode, référence). Ils pilotent
  le dossier : une **avance** génère le **bon de commande** (`BC-AAAA-NNNN`,
  statut « Bon de commande émis ») ; le **solde** génère la **facture**
  (`F-AAAA-NNNN`, statut « Payé ») et passe l'annonce liée en « Vendue ». Un
  paiement intégral d'emblée donne directement la facture.
- Numérotation **continue, sans trou**, par type et par année (table
  `document_counter`, incrémentée dans la transaction d'émission).
- Un document émis est **figé** (montants et PDF archivés) ; le dossier n'est
  plus modifiable dès le premier document ; un paiement n'est supprimable que
  s'il n'a donné lieu à aucun document. Trop-perçu refusé.
- PDF générés par le back (`pdfkit`), stockés dans `DOCUMENTS_DIR`
  (privé), téléchargés via `GET /api/sales/:id/documents/:documentId/pdf`.
  **Pensez à sauvegarder le volume `documents`** (la sauvegarde automatique de
  `deploy.sh` ne couvre que la base).
- La mention du régime de la marge et les libellés (HTVA / TVAC) sont à
  valider avec votre comptable.

## API REST

Base : `http://localhost:4000/api`. Réponses :
`{ "success": true, "data": … }` ou `{ "success": false, "message": "…", "details"?: … }`.

| Ressource | Endpoints | Accès |
|---|---|---|
| Santé | `GET /health` | public |
| Entreprise | `GET /company` | public |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/mfa/setup` · `POST /auth/mfa/verify` · `POST /auth/logout` · `GET /auth/me` | public / cookie « 2FA en attente » pour `/mfa/*` / session pour `/me` |
| | `POST /auth/forgot-password` (`{ email, locale }`) · `POST /auth/reset-password` (`{ token, password, locale }`) | public (rate-limités) |
| Utilisateurs | `GET /users` (`?role=` `?search=`) · `PATCH /users/:id/role` · `GET /users/role-changes` (`?userId=` `?limit=`) · `DELETE /users/:id` (comptes `user` uniquement) | **super_admin** |
| Marques | `GET /brands` · `GET /brands/:id` · `POST /brands` · `PUT /brands/:id` · `DELETE /brands/:id` | **admin** |
| Catégories | `GET /categories` · `GET /categories/:id` · `POST` · `PUT` · `DELETE /categories/:id` | **admin** |
| Modèles | `GET /car-models` · `GET /car-models/:id` · `POST` · `PUT` · `DELETE /car-models/:id` | **admin** |
| Annonces | `GET /listings` · `GET /listings/:id` | public (non-admin : `published` uniquement) |
| | `POST` · `PUT /:id` · `PATCH /:id/status` · `DELETE /:id` | **admin** |

`GET /listings` accepte des filtres en query : `status`, `sellerId`, `brandId`,
`modelId`, `categoryId`, `fuelType`, `transmission`, `minPrice`, `maxPrice`,
`minYear`, `maxYear`, `maxMileage`, `search` (titre) et `sort`
(`recent` défaut · `price_asc` · `price_desc` · `year_desc` · `mileage_asc`).
Les filtres `status` et `sellerId` ne sont pris en compte que pour un admin
authentifié ; sinon la liste est forcée sur `status=published`. Les marques,
modèles et catégories étant réservés à l'admin, les filtres correspondants de
la page publique `/annonces` sont dérivés des annonces publiées.
Une annonce porte directement les caractéristiques du véhicule (modèle, année,
kilométrage, carburant, boîte, puissance, portes, couleur) : l'administrateur
crée tout dans le même formulaire, avec les photos.
| Photos | `GET /listings/:listingId/images` | public |
| | `POST /…` (multipart, champ `file`) · `PATCH /…/:imageId` · `DELETE /…/:imageId` | **admin** |
| Favoris | `GET /favorites` · `POST /favorites` · `DELETE /favorites/:listingId` | session (tout `user`) |
| Réservations | `POST /reservations` (`{ listingId, type: hold\|visit, phone, visitAt?, message?, locale }`, rate-limité) · `GET /reservations/mine` · `POST /reservations/:id/cancel` | session |
| | `GET /reservations` (`?status=` `?type=`) · `PATCH /reservations/:id` (`{ status: confirmed\|declined\|cancelled, holdDays?, visitAt?, adminNote? }`) · `DELETE /reservations/:id` | **admin** |
| Ventes | `GET /sales` (`?status=`) · `POST /sales` · `GET` / `PUT` / `DELETE /sales/:id` · `POST /sales/:id/payments` · `DELETE /sales/:id/payments/:paymentId` · `GET /sales/:id/documents/:documentId/pdf` | **admin** |
| Contact | `POST /contact` (formulaire public) | public |
| | `GET /contact` · `PATCH /contact/:id` · `DELETE /contact/:id` | **admin** |

**Authentification par cookie.** `POST /auth/login` et `/auth/register` posent
un cookie `chcars_token` **httpOnly** (le JWT n'est jamais dans le corps de la
réponse) et un cookie lisible `chcars_csrf`. Les requêtes doivent être envoyées
avec les cookies (`credentials: "include"` côté navigateur, `-c/-b` avec curl).
Toute requête **non‑GET** (hors `/auth/login`, `/auth/register`,
`/auth/forgot-password`, `/auth/reset-password` et `/contact`)
doit renvoyer la valeur du cookie `chcars_csrf` dans l'en‑tête `X-CSRF-Token`.

## Scripts npm

| Emplacement | Commande | Effet |
|---|---|---|
| `back/` | `npm run dev` | API en watch, `NODE_ENV=development` |
| `back/` | `npm run start` | API compilée, `NODE_ENV=production` |
| `back/` | `npm run start:test` | API, `NODE_ENV=test` |
| `back/` | `npm run build` / `npm run typecheck` | compilation / vérification TS |
| `back/` | `npm run migrate[:test\|:prod]` | applique les migrations en attente de `db/migrations/` |
| `back/` | `npm run create-admin[:prod]` | crée ou promeut un administrateur |
| `front/` | `npm run dev` / `npm run build` / `npm start` | Next.js |
| `front/` | `npm run lint` | ESLint |

## CI/CD et déploiement

```
GitHub ─► GitHub Actions ─► Tests ─► Docker build ─► GHCR ─► Préprod ─► Playwright E2E
                                   ─► approbation manuelle (e-mail) ─► Production ─► Release vX.Y.Z
```

| Étape | Où | Détail |
|---|---|---|
| Tests | `.github/workflows/ci-cd.yml` | back : typecheck, vitest, `migrate:test` sur un MariaDB vierge, build ; front : lint (non bloquant pour l'instant), vitest, build |
| Docker build → GHCR | job `docker` | `back/Dockerfile`, `front/Dockerfile` → `ghcr.io/<owner>/chcars-back` / `chcars-front`, tag `sha-<commit>` (+ `latest`). Sur une PR : build sans push |
| Préprod | `.github/workflows/deploy.yml` | SSH vers le serveur, `deploy/deploy.sh` : pull, `migrate`, `docker compose up --wait`, contrôle `/api/health` |
| Playwright E2E | `e2e/` | tests contre l'URL de préprod (rapport en artefact) |
| Approbation | environnement `production` | la prod attend qu'un reviewer clique **Approve** (notifié par e-mail, voir étape 4 ci-dessous) |
| Production | `deploy.yml` | **même image** que la préprod, promue après les E2E et l'approbation |
| Release | job `release` | après une prod réussie : tag annoté `vX.Y.Z` + GitHub Release (liste des commits, images `sha-<commit>`) |

**Numéro de version** : dernier tag `v*` + 1 en *patch* par défaut. Un message de
commit contenant `#minor` (ou `#major`) depuis la dernière release choisit une
version mineure (ou majeure). Ex. : `git commit -m "Refonte navigation #minor"`.
Un commit déjà tagué (relance du pipeline) n'est pas republié.

Seuls les push sur `main` déploient ; une PR s'arrête après le build Docker.

**Une image pour tous les environnements** : le front est construit avec
`NEXT_PUBLIC_API_URL=/api` ; le **nginx du serveur** (`deploy/nginx/chcars.conf`)
sert le front et l'API sur une **même origine** (`/api`, `/uploads` → back, le
reste → front), en HTTPS via certbot (Let's Encrypt). Les conteneurs n'écoutent
que sur `127.0.0.1` : seul nginx est exposé. La configuration qui change d'un environnement à l'autre vit
dans le `.env` du serveur.

### Mise en place (une fois)

Préprod et production tournent sur **le même serveur**, côte à côte : deux
dossiers de déploiement, deux projets compose (conteneurs, réseau, base et
photos séparés), deux plages de ports, deux sites nginx.

|  | Production | Préprod |
|---|---|---|
| `DEPLOY_PATH` | `/opt/chcars-prod` | `/opt/chcars-preprod` |
| `COMPOSE_PROJECT_NAME` | `chcars-prod` | `chcars-preprod` |
| Domaine (`SITE_DOMAIN`) | `brabuscars.be` | `preprod.brabuscars.be` |
| `FRONT_PORT` / `BACK_PORT` / `DB_HOST_PORT` | 3010 / 3011 / 3012 | 3013 / 3014 / 3015 |
| Site nginx | `/etc/nginx/sites-available/chcars-prod` | `/etc/nginx/sites-available/chcars-preprod` |

Les ports n'écoutent que sur `127.0.0.1` (nginx seul y accède ; `DB_HOST_PORT`
sert à administrer la base en local : `mariadb -h 127.0.0.1 -P 3012 -u …`).

1. **Serveur** : Docker + plugin compose, **nginx** + **certbot**
   (`apt install nginx certbot python3-certbot-nginx`), ports 80/443 ouverts,
   DNS des **deux** domaines pointé dessus, un utilisateur de déploiement
   membre du groupe `docker` avec une clé SSH dédiée.
2. **Un `.env` par environnement**, dans son `DEPLOY_PATH` (jamais versionné).
   Exemple préprod — en prod : `chcars-prod`, `brabuscars.be`, `chcars_prod`,
   `chcarsprod`, ports 3010 / 3011 / 3012 :

   ```dotenv
   COMPOSE_PROJECT_NAME=chcars-preprod      # OBLIGATOIRE et unique (deploy.sh le vérifie)
   SITE_DOMAIN=preprod.brabuscars.be            # sans https://
   FRONT_PORT=3013
   BACK_PORT=3014
   DB_HOST_PORT=3015
   DB_DATABASE=chcars_preprod
   DB_USERNAME=chcarspreprod
   DB_PASSWORD=<aléatoire>
   DB_ROOT_PASSWORD=<aléatoire>
   JWT_SECRET=<≥ 32 caractères, différent par environnement>
   MFA_ENCRYPTION_KEY=<openssl rand -hex 32, différent par environnement, ne jamais le changer>
   # Optionnels : JWT_EXPIRES_IN, COMPANY_*, COMPANY_INSTAGRAM_URL, COMPANY_FACEBOOK_URL,
   #              GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (connexion Google ; l'URI de
   #              redirection https://<SITE_DOMAIN>/api/auth/google/callback est déduite),
   #              BACKUP_KEEP (sauvegardes conservées avant migration, défaut 10)
   # E-mails (Brevo) — sans eux, aucun lien « mot de passe oublié » n'est envoyé :
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<identifiant SMTP Brevo, ex. xxxx@smtp-brevo.com>
   SMTP_PASSWORD=<clé SMTP Brevo>
   MAIL_FROM=BrabusCars <no-reply@brabuscars.be>   # expéditeur vérifié dans Brevo
   ```

   Au premier démarrage, l'image MariaDB crée la base et l'utilisateur à
   partir de ces variables ; `deploy.sh` applique ensuite les migrations en attente.
3. **Deux sites nginx** (en root, une fois), à partir du modèle
   `deploy/nginx/chcars.conf` :

   ```bash
   # Production
   sed -e 's/@ENV@/prod/g' -e 's/@DOMAIN@/brabuscars.be/g'        -e 's/@FRONT_PORT@/3010/g' -e 's/@BACK_PORT@/3011/g'        deploy/nginx/chcars.conf | sudo tee /etc/nginx/sites-available/chcars-prod >/dev/null
   # Préprod
   sed -e 's/@ENV@/preprod/g' -e 's/@DOMAIN@/preprod.brabuscars.be/g'        -e 's/@FRONT_PORT@/3013/g' -e 's/@BACK_PORT@/3014/g'        deploy/nginx/chcars.conf | sudo tee /etc/nginx/sites-available/chcars-preprod >/dev/null

   sudo ln -s /etc/nginx/sites-available/chcars-prod /etc/nginx/sites-available/chcars-preprod        /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d brabuscars.be --redirect
   sudo certbot --nginx -d preprod.brabuscars.be --redirect
   ```

   certbot ajoute lui-même le bloc HTTPS et renouvelle les certificats
   automatiquement. Les sites autorisent les envois jusqu'à 16 Mo (photos) et
   transmettent l'IP réelle du visiteur à l'API (`TRUST_PROXY=1`). Tant qu'une
   stack n'a pas été déployée, son site répond 502 : c'est normal.
4. **GitHub → Settings → Secrets and variables → Actions** (niveau dépôt) :

   - **Secrets** (communs, même serveur) : `DEPLOY_HOST`, `DEPLOY_USER`,
     `DEPLOY_SSH_KEY` (clé privée), `DEPLOY_KNOWN_HOSTS` (sortie de
     `ssh-keyscan -p <DEPLOY_PORT> <hôte>`).
   - **Variables** (un nom par environnement) :

     | Variable | Valeur |
     |---|---|
     | `SITE_URL_PREPROD` | `https://preprod.brabuscars.be` |
     | `SITE_URL_PROD` | `https://brabuscars.be` |
     | `DEPLOY_PATH_PREPROD` | `/opt/chcars-preprod` |
     | `DEPLOY_PATH_PROD` | `/opt/chcars-prod` |
     | `DEPLOY_PORT` | port SSH du serveur (**obligatoire**) |

   **Validation manuelle de la prod** (**Settings → Environments → production**,
   gratuit pour un dépôt public) : cocher **Required reviewers** et s'ajouter ;
   dans *Deployment branches and tags*, restreindre à `main`. À chaque push, le
   pipeline s'arrête avant la prod et GitHub envoie un e-mail « Review pending
   deployments » (activer *Settings → Notifications → Actions* sur le compte du
   reviewer) : *Review deployments* → **Approve** ou **Reject**. Sans réponse
   sous 30 jours, le déploiement est annulé.
5. **Premier administrateur** de chaque environnement, depuis son dossier
   (`cd /opt/chcars-prod` ou `/opt/chcars-preprod`) :
   `docker compose run --rm back node dist/scripts/createAdmin.js --email=… --password=… --super`
   À sa première connexion, il active la double authentification (QR code).
   Téléphone perdu : `docker compose run --rm back node dist/scripts/resetMfa.js --email=…`

### Rollback

Actions → **Deploy** → *Run workflow* : choisir l'environnement et un tag déjà
publié (`sha-<commit>`). Sur le serveur, `.previous_tag` garde la version
précédente.

Un rollback ne défait pas le schéma : les migrations restent appliquées (elles
doivent donc rester compatibles avec la version précédente). Pour revenir aussi
sur les données, restaurer la sauvegarde prise avant la migration (ci-dessous).

### Sauvegardes de la base

À chaque déploiement, `deploy.sh` exporte la base de l'environnement **juste
avant les migrations** dans `<dossier de déploiement>/backups/<date UTC>_<tag>.sql.gz`
(`mariadb-dump --single-transaction`, sans interruption du site ; dossier en
`700`, fichiers en `600`). Si l'export échoue ou est incomplet, le déploiement
s'arrête **avant** de toucher au schéma. Les `BACKUP_KEEP` plus récents sont
conservés (défaut `10`, réglable dans le `.env` du serveur).

Ces fichiers restent **sur le serveur** (préprod et prod comprises) : ils
protègent d'une migration ratée, pas d'une perte du serveur. Pour cela, copier
régulièrement `backups/` ailleurs (autre machine, stockage objet).

Restauration (dans le dossier de déploiement ; **écrase** les tables de la base
par celles du dump) :

```bash
docker compose stop back front        # plus d'écritures pendant la restauration
gunzip -c backups/<fichier>.sql.gz | docker compose exec -T mariadb \
  sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" exec mariadb -uroot'
# puis redéployer la version qui correspond à ce schéma (tag dans le nom du fichier) :
IMAGE_BACK=… IMAGE_FRONT=… IMAGE_TAG=<tag> sh deploy.sh   # ou Actions → Deploy
```

Le dump contient la table `schema_migrations` : après restauration, le prochain
déploiement réapplique les migrations manquantes. Les photos (volume `uploads`)
ne sont pas dans le dump.

### E2E en local

```bash
cd e2e && npm install && npx playwright install chromium
E2E_BASE_URL=http://localhost:3000 npm test
```

Les tests créent un compte `e2e+…@brabuscars.test` à chaque exécution : à lancer
contre la préprod ou le dev, jamais contre la production.

## Notes

- Les entités TypeORM (`back/src/entities/`) **mappent des tables existantes** ;
  `synchronize` est désactivé.
- Toute évolution du schéma : nouvelle migration dans `back/db/migrations/`,
  appliquée automatiquement à chaque déploiement (`npm run migrate` en local).
- Aucun fichier `.env*` n'est versionné (voir section 2 pour leur contenu).
- **Images** : à l'upload, chaque image est ré-encodée en WebP (≤ 2000 px) + une
  vignette 400 px, écrites dans `UPLOAD_DIR` (`back/uploads/` par défaut, non
  versionné). La base ne stocke que la clé de stockage. En dev, l'API sert
  `/uploads` ; en production, laisser Nginx (ou un CDN) servir ce dossier.
