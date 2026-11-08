import nodemailer, { type Transporter } from "nodemailer";
import { env, isProduction, isSmtpEnabled } from "../../config/env";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends transactional e-mails. */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** Real delivery through the SMTP relay (Brevo). */
class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // 465 = TLS from the start; otherwise STARTTLS, which is then required.
      secure: env.SMTP_PORT === 465,
      requireTLS: env.SMTP_PORT !== 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({ from: env.MAIL_FROM, ...message });
  }
}

/**
 * Development / test without SMTP: the e-mail is printed to the console so
 * the reset link can be followed locally.
 */
class ConsoleMailer implements Mailer {
  async send(message: MailMessage): Promise<void> {
    console.info(
      `[mail] (SMTP non configuré — e-mail non envoyé)\nÀ : ${message.to}\nObjet : ${message.subject}\n\n${message.text}\n`,
    );
  }
}

/**
 * Production without SMTP: nothing is sent, and the content (reset link!)
 * is never written to the logs.
 */
class DisabledMailer implements Mailer {
  async send(message: MailMessage): Promise<void> {
    console.warn(
      `[mail] SMTP non configuré : e-mail « ${message.subject} » non envoyé.`,
    );
  }
}

function createMailer(): Mailer {
  if (isSmtpEnabled) return new SmtpMailer();
  return isProduction ? new DisabledMailer() : new ConsoleMailer();
}

export const mailer: Mailer = createMailer();
