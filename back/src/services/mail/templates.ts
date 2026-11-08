import type { FrontLocale } from "../../dto/auth.dto";
import type { MailMessage } from "./mailer";

/** Escapes text inserted into the HTML body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface Copy {
  subject: string;
  greeting: (firstName: string) => string;
  paragraphs: string[];
  button?: string;
  footer: string;
}

/** Minimal, client-safe HTML layout (inline styles only). */
export function render(to: string, copy: Copy, firstName: string, link?: string): MailMessage {
  const greeting = copy.greeting(firstName);
  const textParts = [greeting, "", ...copy.paragraphs.flatMap((p) => [p, ""])];
  if (link) textParts.push(link, "");
  textParts.push(copy.footer);

  const button =
    link && copy.button
      ? `<p style="margin:24px 0"><a href="${escapeHtml(link)}" style="background:#0d6efd;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${escapeHtml(copy.button)}</a></p>
<p style="font-size:13px;color:#6c757d;word-break:break-all">${escapeHtml(link)}</p>`
      : "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#212529">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;padding:28px">
<p>${escapeHtml(greeting)}</p>
${copy.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n")}
${button}
<p style="font-size:13px;color:#6c757d;margin-top:28px">${escapeHtml(copy.footer)}</p>
</div></body></html>`;

  return { to, subject: copy.subject, text: textParts.join("\n"), html };
}

const RESET_COPY: Record<FrontLocale, (company: string, minutes: number) => Copy> = {
  fr: (company, minutes) => ({
    subject: `${company} — Réinitialisation de votre mot de passe`,
    greeting: (name) => `Bonjour ${name},`,
    paragraphs: [
      `Vous avez demandé à réinitialiser le mot de passe de votre compte ${company}.`,
      `Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe. Il est valable ${minutes} minutes et ne peut servir qu'une fois.`,
    ],
    button: "Choisir un nouveau mot de passe",
    footer:
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste inchangé.",
  }),
  en: (company, minutes) => ({
    subject: `${company} — Reset your password`,
    greeting: (name) => `Hello ${name},`,
    paragraphs: [
      `You asked to reset the password of your ${company} account.`,
      `Click the link below to choose a new password. It is valid for ${minutes} minutes and can only be used once.`,
    ],
    button: "Choose a new password",
    footer:
      "If you did not make this request, ignore this e-mail: your current password stays unchanged.",
  }),
  nl: (company, minutes) => ({
    subject: `${company} — Uw wachtwoord opnieuw instellen`,
    greeting: (name) => `Hallo ${name},`,
    paragraphs: [
      `U hebt gevraagd om het wachtwoord van uw ${company}-account opnieuw in te stellen.`,
      `Klik op de onderstaande link om een nieuw wachtwoord te kiezen. Hij is ${minutes} minuten geldig en kan maar één keer worden gebruikt.`,
    ],
    button: "Nieuw wachtwoord kiezen",
    footer:
      "Hebt u dit niet aangevraagd? Negeer dan deze e-mail: uw huidige wachtwoord blijft ongewijzigd.",
  }),
};

const CHANGED_COPY: Record<FrontLocale, (company: string, contact: string) => Copy> = {
  fr: (company, contact) => ({
    subject: `${company} — Votre mot de passe a été modifié`,
    greeting: (name) => `Bonjour ${name},`,
    paragraphs: [
      `Le mot de passe de votre compte ${company} vient d'être modifié. Vos autres sessions ont été déconnectées.`,
      `Si vous n'êtes pas à l'origine de ce changement, réinitialisez immédiatement votre mot de passe depuis la page de connexion (« Mot de passe oublié ? ») et contactez-nous : ${contact}.`,
    ],
    footer: "Cet e-mail est envoyé automatiquement pour la sécurité de votre compte.",
  }),
  en: (company, contact) => ({
    subject: `${company} — Your password was changed`,
    greeting: (name) => `Hello ${name},`,
    paragraphs: [
      `The password of your ${company} account has just been changed. Your other sessions have been signed out.`,
      `If you did not make this change, reset your password right away from the login page ("Forgot password?") and contact us: ${contact}.`,
    ],
    footer: "This e-mail is sent automatically to keep your account secure.",
  }),
  nl: (company, contact) => ({
    subject: `${company} — Uw wachtwoord is gewijzigd`,
    greeting: (name) => `Hallo ${name},`,
    paragraphs: [
      `Het wachtwoord van uw ${company}-account is zojuist gewijzigd. Uw andere sessies zijn afgemeld.`,
      `Hebt u dit niet zelf gedaan? Stel dan meteen een nieuw wachtwoord in via de inlogpagina ("Wachtwoord vergeten?") en neem contact met ons op: ${contact}.`,
    ],
    footer: "Deze e-mail wordt automatisch verstuurd voor de veiligheid van uw account.",
  }),
};

export function passwordResetEmail(params: {
  to: string;
  firstName: string;
  locale: FrontLocale;
  company: string;
  link: string;
  ttlMinutes: number;
}): MailMessage {
  const copy = RESET_COPY[params.locale](params.company, params.ttlMinutes);
  return render(params.to, copy, params.firstName, params.link);
}

export function passwordChangedEmail(params: {
  to: string;
  firstName: string;
  locale: FrontLocale;
  company: string;
  contact: string;
}): MailMessage {
  const copy = CHANGED_COPY[params.locale](params.company, params.contact);
  return render(params.to, copy, params.firstName);
}
