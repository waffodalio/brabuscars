import type { FrontLocale } from "../../dto/auth.dto";
import type { ReservationType } from "../../entities/Reservation";
import { DEALERSHIP_TIME_ZONE } from "../../utils/reservationRules";
import type { MailMessage } from "./mailer";
import { render, type Copy } from "./templates";

const INTL: Record<FrontLocale, string> = { fr: "fr-BE", en: "en-GB", nl: "nl-BE" };

/** "jeudi 6 novembre 2026 à 14:30" in the customer's language, dealership time. */
export function formatSlot(date: Date, locale: FrontLocale): string {
  return new Intl.DateTimeFormat(INTL[locale], {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: DEALERSHIP_TIME_ZONE,
  }).format(date);
}

export function formatDay(date: Date, locale: FrontLocale): string {
  return new Intl.DateTimeFormat(INTL[locale], {
    dateStyle: "full",
    timeZone: DEALERSHIP_TIME_ZONE,
  }).format(date);
}

/** What the customer asked for, as a phrase: "la mise de côté de « X »". */
const WHAT: Record<FrontLocale, (type: ReservationType, title: string) => string> = {
  fr: (type, title) =>
    type === "hold" ? `la mise de côté du véhicule « ${title} »` : `votre rendez-vous pour le véhicule « ${title} »`,
  en: (type, title) =>
    type === "hold" ? `your request to put "${title}" aside` : `your appointment for "${title}"`,
  nl: (type, title) =>
    type === "hold" ? `uw reservering van "${title}"` : `uw afspraak voor "${title}"`,
};

const GREETING: Record<FrontLocale, (name: string) => string> = {
  fr: (name) => `Bonjour ${name},`,
  en: (name) => `Hello ${name},`,
  nl: (name) => `Hallo ${name},`,
};

const AUTO_FOOTER: Record<FrontLocale, (company: string) => string> = {
  fr: (company) => `${company} — cet e-mail est envoyé automatiquement, merci de ne pas y répondre.`,
  en: (company) => `${company} — this e-mail is sent automatically, please do not reply.`,
  nl: (company) => `${company} — deze e-mail wordt automatisch verstuurd, gelieve niet te antwoorden.`,
};

interface Base {
  to: string;
  firstName: string;
  locale: FrontLocale;
  company: string;
  type: ReservationType;
  listingTitle: string;
}

/** The request reached the dealership (pending its answer). */
export function reservationReceivedEmail(p: Base & { visitAt: Date | null }): MailMessage {
  const what = WHAT[p.locale](p.type, p.listingTitle);
  const slot = p.visitAt ? formatSlot(p.visitAt, p.locale) : null;
  const copies: Record<FrontLocale, Copy> = {
    fr: {
      subject: `${p.company} — Demande bien reçue`,
      greeting: GREETING.fr,
      paragraphs: [
        `Nous avons bien reçu ${what}${slot ? `, souhaité le ${slot}` : ""}.`,
        "Nous revenons vers vous rapidement pour la confirmer.",
      ],
      footer: AUTO_FOOTER.fr(p.company),
    },
    en: {
      subject: `${p.company} — Request received`,
      greeting: GREETING.en,
      paragraphs: [
        `We have received ${what}${slot ? `, requested for ${slot}` : ""}.`,
        "We will get back to you shortly to confirm it.",
      ],
      footer: AUTO_FOOTER.en(p.company),
    },
    nl: {
      subject: `${p.company} — Aanvraag ontvangen`,
      greeting: GREETING.nl,
      paragraphs: [
        `We hebben ${what} goed ontvangen${slot ? `, gevraagd voor ${slot}` : ""}.`,
        "We nemen snel contact met u op om ze te bevestigen.",
      ],
      footer: AUTO_FOOTER.nl(p.company),
    },
  };
  return render(p.to, copies[p.locale], p.firstName);
}

/** The dealership's answer: confirmed, declined or cancelled. */
export function reservationDecisionEmail(
  p: Base & {
    status: "confirmed" | "declined" | "cancelled";
    visitAt: Date | null;
    holdUntil: Date | null;
    note: string | null;
    contact: string;
  },
): MailMessage {
  const what = WHAT[p.locale](p.type, p.listingTitle);
  const lead: Record<FrontLocale, string> = {
    fr:
      p.status === "confirmed"
        ? p.type === "hold"
          ? `Bonne nouvelle : ${what} est confirmée. Le véhicule vous est réservé jusqu'au ${formatDay(p.holdUntil ?? new Date(), "fr")}.`
          : `Bonne nouvelle : ${what} est confirmé pour le ${formatSlot(p.visitAt ?? new Date(), "fr")}.`
        : p.status === "declined"
          ? `Nous ne pouvons malheureusement pas donner suite à ${what}.`
          : `${what.charAt(0).toUpperCase()}${what.slice(1)} a été annulé(e).`,
    en:
      p.status === "confirmed"
        ? p.type === "hold"
          ? `Good news: ${what} is confirmed. The car is kept for you until ${formatDay(p.holdUntil ?? new Date(), "en")}.`
          : `Good news: ${what} is confirmed for ${formatSlot(p.visitAt ?? new Date(), "en")}.`
        : p.status === "declined"
          ? `Unfortunately we cannot follow up on ${what}.`
          : `${what.charAt(0).toUpperCase()}${what.slice(1)} has been cancelled.`,
    nl:
      p.status === "confirmed"
        ? p.type === "hold"
          ? `Goed nieuws: ${what} is bevestigd. Het voertuig wordt voor u gereserveerd tot ${formatDay(p.holdUntil ?? new Date(), "nl")}.`
          : `Goed nieuws: ${what} is bevestigd voor ${formatSlot(p.visitAt ?? new Date(), "nl")}.`
        : p.status === "declined"
          ? `Helaas kunnen we niet ingaan op ${what}.`
          : `${what.charAt(0).toUpperCase()}${what.slice(1)} is geannuleerd.`,
  };
  const noteLabel: Record<FrontLocale, string> = { fr: "Message de la concession", en: "Message from the dealership", nl: "Bericht van de garage" };
  const contactLine: Record<FrontLocale, string> = {
    fr: `Une question ? Contactez-nous : ${p.contact}.`,
    en: `Any question? Contact us: ${p.contact}.`,
    nl: `Een vraag? Neem contact met ons op: ${p.contact}.`,
  };
  const subjects: Record<FrontLocale, string> = {
    fr: p.status === "confirmed" ? "Réservation confirmée" : p.status === "declined" ? "Réponse à votre demande" : "Réservation annulée",
    en: p.status === "confirmed" ? "Booking confirmed" : p.status === "declined" ? "About your request" : "Booking cancelled",
    nl: p.status === "confirmed" ? "Reservering bevestigd" : p.status === "declined" ? "Over uw aanvraag" : "Reservering geannuleerd",
  };
  const copy: Copy = {
    subject: `${p.company} — ${subjects[p.locale]}`,
    greeting: GREETING[p.locale],
    paragraphs: [
      lead[p.locale],
      ...(p.note ? [`${noteLabel[p.locale]}${p.locale === "fr" ? " :" : ":"} ${p.note}`] : []),
      contactLine[p.locale],
    ],
    footer: AUTO_FOOTER[p.locale](p.company),
  };
  return render(p.to, copy, p.firstName);
}

/** Notice to the dealership (back-office is French-only). */
export function reservationAdminNotice(p: {
  to: string;
  company: string;
  event: "new" | "cancelled";
  type: ReservationType;
  listingTitle: string;
  customer: string;
  email: string;
  phone: string;
  visitAt: Date | null;
  message: string | null;
  link: string;
}): MailMessage {
  const kind = p.type === "hold" ? "Mise de côté" : "Essai / visite";
  const copy: Copy = {
    subject:
      p.event === "new"
        ? `${p.company} — Nouvelle demande : ${kind.toLowerCase()} « ${p.listingTitle} »`
        : `${p.company} — Demande annulée par le client : « ${p.listingTitle} »`,
    greeting: () => "Bonjour,",
    paragraphs: [
      p.event === "new"
        ? `${p.customer} a fait une demande (${kind.toLowerCase()}) pour « ${p.listingTitle} ».`
        : `${p.customer} a annulé sa demande (${kind.toLowerCase()}) pour « ${p.listingTitle} ».`,
      `Contact : ${p.email} · ${p.phone}`,
      ...(p.visitAt ? [`Créneau souhaité : ${formatSlot(p.visitAt, "fr")}`] : []),
      ...(p.message ? [`Message : ${p.message}`] : []),
    ],
    button: "Ouvrir les réservations",
    footer: "Notification automatique du back-office.",
  };
  return render(p.to, copy, "", p.link);
}
