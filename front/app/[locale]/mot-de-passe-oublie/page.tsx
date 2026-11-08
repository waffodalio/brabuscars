"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { usePublicErrorMessage } from "@/hooks/usePublicErrorMessage";
import { authService } from "@/services/authService";

/**
 * "Forgot password": asks for the account's e-mail and has a reset link
 * sent. The confirmation is the same whether or not the account exists.
 */
export default function ForgotPasswordPage() {
  const { t, locale, withLocale } = useLanguage();
  const toMessage = usePublicErrorMessage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim(), locale);
      setSent(true);
    } catch (err) {
      setError(toMessage(err, t.auth.forgot.error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      className="chc-animate-in mx-auto my-4 my-lg-5"
      style={{ maxWidth: 420 }}
    >
      <Card.Body className="p-4">
        <h1 className="h4 mb-3">{t.auth.forgot.title}</h1>

        {sent ? (
          <Alert variant="success" role="status">
            {t.auth.forgot.sent}
          </Alert>
        ) : (
          <>
            <p className="text-secondary small">{t.auth.forgot.intro}</p>
            <ErrorAlert message={error} />
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="forgot-email">
                <Form.Label>{t.auth.forgot.email}</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </Form.Group>
              <Button type="submit" disabled={submitting} className="w-100">
                {submitting ? t.auth.forgot.submitting : t.auth.forgot.submit}
              </Button>
            </Form>
          </>
        )}

        <p className="mt-3 mb-0 small">
          <Link href={withLocale("/connexion")}>{t.auth.forgot.backToLogin}</Link>
        </p>
      </Card.Body>
    </Card>
  );
}
