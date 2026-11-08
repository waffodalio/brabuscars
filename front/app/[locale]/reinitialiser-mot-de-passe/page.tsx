"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePublicErrorMessage } from "@/hooks/usePublicErrorMessage";
import { ApiClientError } from "@/services/apiClient";
import { authService } from "@/services/authService";

/** Shape of the API's reset tokens (32 random bytes, base64url). */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Target of the e-mailed link (`?token=…`). The token is kept in memory and
 * removed from the address bar right away (history, screenshots, referrers).
 * On success the visitor signs in again with the new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { t, locale, withLocale } = useLanguage();
  const toMessage = usePublicErrorMessage();
  const [token] = useState(() => searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [linkInvalid, setLinkInvalid] = useState(() => !TOKEN_PATTERN.test(token));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.has("token")) {
      router.replace(withLocale("/reinitialiser-mot-de-passe"));
    }
    // Run once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t.auth.reset.mismatch);
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(token, password, locale);
      // The API revoked every session of the account: drop any local one.
      if (user) await logout().catch(() => undefined);
      router.push(withLocale("/connexion?reset=1"));
    } catch (err) {
      setSubmitting(false);
      // 400: unknown, expired or already used token (the form already
      // enforces the password rules).
      if (err instanceof ApiClientError && err.status === 400) setLinkInvalid(true);
      else setError(toMessage(err, t.auth.reset.error));
    }
  }

  return (
    <Card
      className="chc-animate-in mx-auto my-4 my-lg-5"
      style={{ maxWidth: 420 }}
    >
      <Card.Body className="p-4">
        <h1 className="h4 mb-3">{t.auth.reset.title}</h1>

        {linkInvalid ? (
          <>
            <Alert variant="warning">{t.auth.reset.invalidLink}</Alert>
            <Link
              href={withLocale("/mot-de-passe-oublie")}
              className="btn btn-primary w-100"
            >
              {t.auth.reset.requestNew}
            </Link>
          </>
        ) : (
          <>
            <p className="text-secondary small">{t.auth.reset.intro}</p>
            <ErrorAlert message={error} />
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="reset-password">
                <Form.Label>{t.auth.reset.password}</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  autoFocus
                />
                <Form.Text muted>{t.auth.reset.hint}</Form.Text>
              </Form.Group>
              <Form.Group className="mb-3" controlId="reset-confirm">
                <Form.Label>{t.auth.reset.confirm}</Form.Label>
                <Form.Control
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </Form.Group>
              <Button type="submit" disabled={submitting} className="w-100">
                {submitting ? t.auth.reset.submitting : t.auth.reset.submit}
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
