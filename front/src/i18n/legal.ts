import type { Locale } from "./locales";

/**
 * Texts of the legal notice (`/mentions-legales`) and privacy policy
 * (`/confidentialite`) pages, fr / en / nl. The dealership's details come
 * from `GET /api/company` (`COMPANY_*` variables), never written here.
 * Keep them in line with what the application really does (data collected,
 * processors, retention) whenever a feature changes.
 */

export interface LegalCompany {
  name: string;
  legalName: string;
  address: string;
  email: string;
  phone: string;
  vatNumber: string | null;
  hosting: string | null;
}

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalPage {
  title: string;
  intro?: string;
  sections: LegalSection[];
}

interface LegalTexts {
  updated: string;
  legalNotice: (c: LegalCompany) => LegalPage;
  privacy: (c: LegalCompany) => LegalPage;
}

/** Date shown under both titles: change it with the texts. */
const UPDATED: Record<Locale, string> = {
  fr: "Dernière mise à jour : 13 novembre 2026",
  en: "Last updated: 13 November 2026",
  nl: "Laatst bijgewerkt: 13 november 2026",
};

const APD = {
  fr: "Autorité de protection des données, rue de la Presse 35, 1000 Bruxelles — www.autoriteprotectiondonnees.be",
  en: "Belgian Data Protection Authority (Autorité de protection des données / Gegevensbeschermingsautoriteit), Rue de la Presse 35, 1000 Brussels — www.dataprotectionauthority.be",
  nl: "Gegevensbeschermingsautoriteit, Drukpersstraat 35, 1000 Brussel — www.gegevensbeschermingsautoriteit.be",
};

const fr: LegalTexts = {
  updated: UPDATED.fr,
  legalNotice: (c) => ({
    title: "Mentions légales",
    sections: [
      {
        title: "Éditeur du site",
        items: [
          c.legalName,
          c.address,
          `E-mail : ${c.email}`,
          `Téléphone : ${c.phone}`,
          ...(c.vatNumber ? [`N° d'entreprise (BCE) / TVA : ${c.vatNumber}`] : []),
        ],
      },
      ...(c.hosting ? [{ title: "Hébergement", paragraphs: [c.hosting] }] : []),
      {
        title: "Annonces",
        paragraphs: [
          "Les informations des annonces (caractéristiques, équipements, kilométrage, prix…) sont publiées de bonne foi et à titre indicatif. Elles peuvent contenir des erreurs et ne constituent pas une offre contractuelle : seuls le bon de commande et la facture remis lors de la vente font foi. Une réservation en ligne est une demande, confirmée ou non par la concession.",
        ],
      },
      {
        title: "Propriété intellectuelle",
        paragraphs: [
          `Les textes, photos, logos et la présentation du site sont la propriété de ${c.legalName} ou utilisés avec autorisation. Toute reproduction sans accord écrit préalable est interdite.`,
        ],
      },
      {
        title: "Données personnelles et cookies",
        paragraphs: [
          "Le traitement de vos données et l'utilisation des cookies sont décrits dans notre politique de confidentialité. Vos choix de cookies sont modifiables à tout moment via « Gérer les cookies » en bas de page.",
        ],
      },
      {
        title: "Droit applicable",
        paragraphs: ["Le présent site et ces mentions sont soumis au droit belge."],
      },
    ],
  }),
  privacy: (c) => ({
    title: "Politique de confidentialité",
    intro: `Cette politique explique quelles données personnelles ${c.name} traite lorsque vous utilisez ce site, pourquoi, combien de temps, et comment exercer vos droits (Règlement général sur la protection des données — RGPD).`,
    sections: [
      {
        title: "Responsable du traitement",
        items: [
          c.legalName,
          c.address,
          ...(c.vatNumber ? [`N° d'entreprise (BCE) / TVA : ${c.vatNumber}`] : []),
          `Contact pour vos données : ${c.email}`,
        ],
      },
      {
        title: "Données traitées, finalités et bases légales",
        items: [
          "Compte client : prénom, nom, adresse e-mail et mot de passe (stocké chiffré, jamais lisible) ; avec la connexion Google, votre identifiant Google et votre e-mail. Finalité : gérer votre compte, vos favoris et vos réservations. Base : l'exécution du contrat (conditions d'utilisation du compte).",
          "Réservations (mise de côté, essai, visite) : identité du compte, téléphone, date souhaitée et message éventuel. Finalité : traiter votre demande et vous tenir informé par e-mail. Base : mesures précontractuelles prises à votre demande.",
          "Formulaire de contact : nom, adresse e-mail et message. Finalité : vous répondre. Base : notre intérêt légitime à répondre aux demandes qui nous sont adressées.",
          "Achat d'un véhicule : coordonnées de l'acheteur sur le bon de commande et la facture. Base : l'exécution du contrat de vente et nos obligations légales comptables et fiscales.",
          "Mesure d'audience interne, uniquement avec votre accord : un identifiant aléatoire (cookie chcars_visitor_id), la page vue et sa date. Ni adresse IP, ni navigateur, ni paramètres d'adresse ne sont enregistrés, et rien n'est transmis à un tiers. Base : votre consentement, retirable à tout moment.",
          "Sécurité du site : votre adresse IP est utilisée en mémoire, quelques minutes, pour limiter les tentatives abusives (connexion, formulaires). Base : notre intérêt légitime à protéger le site et vos comptes.",
        ],
      },
      {
        title: "Destinataires et sous-traitants",
        paragraphs: [
          "Vos données ne sont ni vendues ni louées. Seule la concession y a accès, ainsi que les prestataires suivants, uniquement pour le service qu'ils nous rendent :",
        ],
        items: [
          c.hosting ? `Hébergement du site et des données : ${c.hosting}.` : "Hébergement du site et des données : notre hébergeur.",
          "Envoi des e-mails du site (réinitialisation de mot de passe, suivi des réservations) : Brevo (Sendinblue SAS, France).",
          "Connexion avec Google, si vous la choisissez, et carte Google Maps de la page Contact, chargée seulement si vous cliquez pour l'afficher : Google Ireland Limited. Google peut transférer des données vers les États-Unis, dans le cadre du EU-US Data Privacy Framework.",
        ],
      },
      {
        title: "Durées de conservation",
        items: [
          "Compte : tant qu'il existe ; supprimé sur simple demande, ou après 3 ans sans connexion.",
          "Réservations et messages de contact : 3 ans après la fin de la demande.",
          "Bons de commande et factures : 7 ans (obligation comptable belge).",
          "Mesure d'audience : 13 mois, puis effacement automatique.",
          "Lien de réinitialisation du mot de passe : 30 minutes, à usage unique.",
          "Sauvegardes de la base : remplacées au fil des mises à jour du site (10 dernières).",
        ],
      },
      {
        title: "Cookies",
        items: [
          "chcars_token et chcars_csrf : connexion et protection contre les attaques (essentiels).",
          "chcars_theme et chcars_locale : thème clair / sombre et langue choisis, 1 an (essentiels).",
          "chcars_visitor_id : mesure d'audience interne, 1 an, uniquement avec votre accord.",
        ],
        paragraphs: [
          "Aucun cookie publicitaire. Vous pouvez modifier vos choix à tout moment via « Gérer les cookies » en bas de page.",
        ],
      },
      {
        title: "Vos droits",
        paragraphs: [
          `Vous pouvez demander l'accès à vos données, leur rectification, leur effacement, la limitation du traitement, vous y opposer, en recevoir une copie dans un format réutilisable (portabilité) et retirer votre consentement à tout moment. Écrivez-nous à ${c.email} : nous répondons dans un délai d'un mois. Une preuve d'identité peut vous être demandée en cas de doute.`,
          `Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'${APD.fr}.`,
        ],
      },
      {
        title: "Sécurité",
        paragraphs: [
          "Connexion chiffrée (HTTPS), mots de passe hachés, double authentification obligatoire pour l'administration, documents de vente non accessibles publiquement, accès limité aux personnes habilitées de la concession.",
        ],
      },
    ],
  }),
};

const en: LegalTexts = {
  updated: UPDATED.en,
  legalNotice: (c) => ({
    title: "Legal notice",
    sections: [
      {
        title: "Website publisher",
        items: [
          c.legalName,
          c.address,
          `E-mail: ${c.email}`,
          `Phone: ${c.phone}`,
          ...(c.vatNumber ? [`Company number (BCE) / VAT: ${c.vatNumber}`] : []),
        ],
      },
      ...(c.hosting ? [{ title: "Hosting", paragraphs: [c.hosting] }] : []),
      {
        title: "Listings",
        paragraphs: [
          "Listing information (specifications, equipment, mileage, price…) is published in good faith and for information only. It may contain errors and is not a contractual offer: only the purchase order and the invoice issued at the sale are binding. An online booking is a request, which the dealership confirms or not.",
        ],
      },
      {
        title: "Intellectual property",
        paragraphs: [
          `The texts, photos, logos and layout of this website belong to ${c.legalName} or are used with permission. Any reproduction without prior written consent is prohibited.`,
        ],
      },
      {
        title: "Personal data and cookies",
        paragraphs: [
          "How your data is processed and how cookies are used is described in our privacy policy. You can change your cookie choices at any time with « Manage cookies » at the bottom of the page.",
        ],
      },
      {
        title: "Applicable law",
        paragraphs: ["This website and this notice are governed by Belgian law."],
      },
    ],
  }),
  privacy: (c) => ({
    title: "Privacy policy",
    intro: `This policy explains which personal data ${c.name} processes when you use this website, why, for how long, and how to exercise your rights (General Data Protection Regulation — GDPR).`,
    sections: [
      {
        title: "Data controller",
        items: [
          c.legalName,
          c.address,
          ...(c.vatNumber ? [`Company number (BCE) / VAT: ${c.vatNumber}`] : []),
          `Contact about your data: ${c.email}`,
        ],
      },
      {
        title: "Data processed, purposes and legal bases",
        items: [
          "Customer account: first name, last name, e-mail address and password (stored hashed, never readable); with Google sign-in, your Google identifier and e-mail. Purpose: managing your account, favourites and bookings. Basis: performance of the contract (account terms of use).",
          "Bookings (hold, test drive, visit): account identity, phone number, requested date and optional message. Purpose: handling your request and keeping you informed by e-mail. Basis: pre-contractual steps taken at your request.",
          "Contact form: name, e-mail address and message. Purpose: replying to you. Basis: our legitimate interest in answering the requests sent to us.",
          "Buying a vehicle: the buyer's details on the purchase order and invoice. Basis: performance of the sale contract and our legal accounting and tax obligations.",
          "Internal audience measurement, only with your consent: a random identifier (cookie chcars_visitor_id), the page viewed and its date. No IP address, browser or address parameters are recorded, and nothing is shared with a third party. Basis: your consent, which you can withdraw at any time.",
          "Website security: your IP address is used in memory, for a few minutes, to limit abusive attempts (sign-in, forms). Basis: our legitimate interest in protecting the website and your accounts.",
        ],
      },
      {
        title: "Recipients and processors",
        paragraphs: [
          "Your data is never sold or rented. Only the dealership has access to it, along with the following providers, solely for the service they provide to us:",
        ],
        items: [
          c.hosting ? `Hosting of the website and data: ${c.hosting}.` : "Hosting of the website and data: our hosting provider.",
          "Sending the website's e-mails (password reset, booking updates): Brevo (Sendinblue SAS, France).",
          "Google sign-in, if you choose it, and the Google Maps map on the Contact page, loaded only if you click to show it: Google Ireland Limited. Google may transfer data to the United States under the EU-US Data Privacy Framework.",
        ],
      },
      {
        title: "Retention periods",
        items: [
          "Account: as long as it exists; deleted on request, or after 3 years without sign-in.",
          "Bookings and contact messages: 3 years after the request ends.",
          "Purchase orders and invoices: 7 years (Belgian accounting obligation).",
          "Audience measurement: 13 months, then deleted automatically.",
          "Password reset link: 30 minutes, single use.",
          "Database backups: replaced as the website is updated (last 10).",
        ],
      },
      {
        title: "Cookies",
        items: [
          "chcars_token and chcars_csrf: sign-in and protection against attacks (essential).",
          "chcars_theme and chcars_locale: chosen light / dark theme and language, 1 year (essential).",
          "chcars_visitor_id: internal audience measurement, 1 year, only with your consent.",
        ],
        paragraphs: [
          "No advertising cookies. You can change your choices at any time with « Manage cookies » at the bottom of the page.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          `You can request access to your data, its rectification or erasure, the restriction of its processing, object to it, receive a copy in a reusable format (portability) and withdraw your consent at any time. Write to us at ${c.email}: we reply within one month. Proof of identity may be requested if in doubt.`,
          `If you believe your rights are not respected, you can lodge a complaint with the ${APD.en}.`,
        ],
      },
      {
        title: "Security",
        paragraphs: [
          "Encrypted connection (HTTPS), hashed passwords, mandatory two-factor authentication for administration, sales documents not publicly accessible, access limited to authorised dealership staff.",
        ],
      },
    ],
  }),
};

const nl: LegalTexts = {
  updated: UPDATED.nl,
  legalNotice: (c) => ({
    title: "Wettelijke vermeldingen",
    sections: [
      {
        title: "Uitgever van de website",
        items: [
          c.legalName,
          c.address,
          `E-mail: ${c.email}`,
          `Telefoon: ${c.phone}`,
          ...(c.vatNumber ? [`Ondernemingsnummer (KBO) / btw: ${c.vatNumber}`] : []),
        ],
      },
      ...(c.hosting ? [{ title: "Hosting", paragraphs: [c.hosting] }] : []),
      {
        title: "Advertenties",
        paragraphs: [
          "De informatie in de advertenties (kenmerken, uitrusting, kilometerstand, prijs…) wordt te goeder trouw en ter informatie gepubliceerd. Ze kan fouten bevatten en is geen contractueel aanbod: alleen de bestelbon en de factuur die bij de verkoop worden afgegeven, zijn bindend. Een online reservering is een aanvraag, die de concessie al dan niet bevestigt.",
        ],
      },
      {
        title: "Intellectuele eigendom",
        paragraphs: [
          `De teksten, foto's, logo's en vormgeving van de website zijn eigendom van ${c.legalName} of worden met toestemming gebruikt. Elke reproductie zonder voorafgaande schriftelijke toestemming is verboden.`,
        ],
      },
      {
        title: "Persoonsgegevens en cookies",
        paragraphs: [
          "Hoe uw gegevens worden verwerkt en hoe cookies worden gebruikt, staat in ons privacybeleid. U kunt uw cookiekeuzes altijd wijzigen via « Cookies beheren » onderaan de pagina.",
        ],
      },
      {
        title: "Toepasselijk recht",
        paragraphs: ["Deze website en deze vermeldingen vallen onder het Belgisch recht."],
      },
    ],
  }),
  privacy: (c) => ({
    title: "Privacybeleid",
    intro: `Dit beleid legt uit welke persoonsgegevens ${c.name} verwerkt wanneer u deze website gebruikt, waarom, hoe lang, en hoe u uw rechten uitoefent (Algemene Verordening Gegevensbescherming — AVG).`,
    sections: [
      {
        title: "Verwerkingsverantwoordelijke",
        items: [
          c.legalName,
          c.address,
          ...(c.vatNumber ? [`Ondernemingsnummer (KBO) / btw: ${c.vatNumber}`] : []),
          `Contact over uw gegevens: ${c.email}`,
        ],
      },
      {
        title: "Verwerkte gegevens, doeleinden en rechtsgronden",
        items: [
          "Klantaccount: voornaam, naam, e-mailadres en wachtwoord (gehasht opgeslagen, nooit leesbaar); bij aanmelden met Google uw Google-id en e-mailadres. Doel: uw account, favorieten en reserveringen beheren. Grondslag: uitvoering van de overeenkomst (gebruiksvoorwaarden van het account).",
          "Reserveringen (opzijzetten, proefrit, bezoek): identiteit van het account, telefoonnummer, gewenste datum en eventueel bericht. Doel: uw aanvraag behandelen en u per e-mail op de hoogte houden. Grondslag: precontractuele maatregelen op uw verzoek.",
          "Contactformulier: naam, e-mailadres en bericht. Doel: u antwoorden. Grondslag: ons gerechtvaardigd belang om de aanvragen die we ontvangen te beantwoorden.",
          "Aankoop van een voertuig: gegevens van de koper op de bestelbon en de factuur. Grondslag: uitvoering van de koopovereenkomst en onze wettelijke boekhoudkundige en fiscale verplichtingen.",
          "Interne bezoekersmeting, alleen met uw toestemming: een willekeurige id (cookie chcars_visitor_id), de bekeken pagina en de datum. Geen IP-adres, browser of adresparameters, en niets wordt met derden gedeeld. Grondslag: uw toestemming, die u altijd kunt intrekken.",
          "Beveiliging van de website: uw IP-adres wordt enkele minuten in het geheugen gebruikt om misbruik te beperken (aanmelden, formulieren). Grondslag: ons gerechtvaardigd belang om de website en uw accounts te beschermen.",
        ],
      },
      {
        title: "Ontvangers en verwerkers",
        paragraphs: [
          "Uw gegevens worden nooit verkocht of verhuurd. Alleen de concessie heeft er toegang toe, samen met de volgende dienstverleners, uitsluitend voor de dienst die ze ons leveren:",
        ],
        items: [
          c.hosting ? `Hosting van de website en de gegevens: ${c.hosting}.` : "Hosting van de website en de gegevens: onze hostingprovider.",
          "Verzending van de e-mails van de website (wachtwoordherstel, opvolging van reserveringen): Brevo (Sendinblue SAS, Frankrijk).",
          "Aanmelden met Google, als u daarvoor kiest, en de Google Maps-kaart op de contactpagina, alleen geladen als u klikt om ze te tonen: Google Ireland Limited. Google kan gegevens doorgeven aan de Verenigde Staten in het kader van het EU-US Data Privacy Framework.",
        ],
      },
      {
        title: "Bewaartermijnen",
        items: [
          "Account: zolang het bestaat; verwijderd op eenvoudig verzoek, of na 3 jaar zonder aanmelding.",
          "Reserveringen en contactberichten: 3 jaar na het einde van de aanvraag.",
          "Bestelbonnen en facturen: 7 jaar (Belgische boekhoudverplichting).",
          "Bezoekersmeting: 13 maanden, daarna automatisch gewist.",
          "Link voor wachtwoordherstel: 30 minuten, eenmalig bruikbaar.",
          "Back-ups van de database: vervangen bij de updates van de website (laatste 10).",
        ],
      },
      {
        title: "Cookies",
        items: [
          "chcars_token en chcars_csrf: aanmelding en bescherming tegen aanvallen (essentieel).",
          "chcars_theme en chcars_locale: gekozen licht / donker thema en taal, 1 jaar (essentieel).",
          "chcars_visitor_id: interne bezoekersmeting, 1 jaar, alleen met uw toestemming.",
        ],
        paragraphs: [
          "Geen advertentiecookies. U kunt uw keuzes altijd wijzigen via « Cookies beheren » onderaan de pagina.",
        ],
      },
      {
        title: "Uw rechten",
        paragraphs: [
          `U kunt inzage in uw gegevens vragen, rectificatie of wissing ervan, beperking van de verwerking, bezwaar maken, een kopie in een herbruikbaar formaat ontvangen (overdraagbaarheid) en uw toestemming altijd intrekken. Schrijf ons op ${c.email}: we antwoorden binnen een maand. Bij twijfel kan een identiteitsbewijs worden gevraagd.`,
          `Als u vindt dat uw rechten niet worden gerespecteerd, kunt u een klacht indienen bij de ${APD.nl}.`,
        ],
      },
      {
        title: "Beveiliging",
        paragraphs: [
          "Versleutelde verbinding (HTTPS), gehashte wachtwoorden, verplichte tweestapsverificatie voor het beheer, verkoopdocumenten niet publiek toegankelijk, toegang beperkt tot bevoegde medewerkers van de concessie.",
        ],
      },
    ],
  }),
};

export const LEGAL_TEXTS: Record<Locale, LegalTexts> = { fr, en, nl };
