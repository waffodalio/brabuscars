"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import { ErrorAlert } from "@/components/ErrorAlert";
import { MfaCodeForm } from "@/components/auth/MfaCodeForm";
import { MfaEnrollment } from "@/components/auth/MfaEnrollment";
import { RecoveryCodes } from "@/components/auth/RecoveryCodes";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { MfaEnrollment as MfaEnrollmentData } from "@/types/auth";
import { errorMessage } from "@/utils/errors";

/**
 * Login steps: password → (admins) 2FA code, preceded on the first login by
 * the enrollment QR code and followed by the one-time recovery codes.
 */
type Step =
  | { kind: "credentials" }
  | { kind: "enroll"; enrollment: MfaEnrollmentData }
  | { kind: "code" }
  | { kind: "recovery"; codes: string[] };

export default function LoginPage() {
  const router = useRouter();
  const { login, startMfaEnrollment, verifyMfa } = useAuth();
  const { t, withLocale } = useLanguage();
  const [step, setStep] = useState<Step>({ kind: "credentials" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const goHome = () => router.push(withLocale("/"));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login({ email, password });
      if (!result.mfaRequired) {
        goHome();
        return;
      }
      setPassword("");
      setSubmitting(false);
      setStep(
        result.enrollmentRequired
          ? { kind: "enroll", enrollment: await startMfaEnrollment() }
          : { kind: "code" },
      );
    } catch (err) {
      setError(errorMessage(err, t.auth.login.error));
      setSubmitting(false);
    }
  }

  async function handleVerify(code: string) {
    const recoveryCodes = await verifyMfa(code);
    if (recoveryCodes?.length) setStep({ kind: "recovery", codes: recoveryCodes });
    else goHome();
  }

  function restart(message = "") {
    setStep({ kind: "credentials" });
    setError(message);
  }

  const handleExpired = () => restart(t.auth.mfa.expired);

  const title = {
    credentials: t.auth.login.title,
    enroll: t.auth.mfa.enrollTitle,
    code: t.auth.mfa.codeTitle,
    recovery: t.auth.mfa.recoveryTitle,
  }[step.kind];

  return (
    <Card
      className="chc-animate-in mx-auto my-4 my-lg-5"
      style={{ maxWidth: 420 }}
    >
      <Card.Body className="p-4">
      <h1 className="h4 mb-4">{title}</h1>

      {step.kind === "credentials" && (
        <>
          <ErrorAlert message={error} />

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="login-email">
              <Form.Label>{t.auth.login.email}</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="login-password">
              <Form.Label>{t.auth.login.password}</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </Form.Group>

            <Button type="submit" disabled={submitting} className="w-100">
              {submitting ? t.auth.login.submitting : t.auth.login.submit}
            </Button>
          </Form>

          <p className="mt-3 mb-0 small text-secondary">
            {t.auth.login.noAccount}{" "}
            <a href={withLocale("/inscription")}>
              {t.auth.login.createAccount}
            </a>
          </p>
        </>
      )}

      {step.kind === "enroll" && (
        <MfaEnrollment
          enrollment={step.enrollment}
          onVerify={handleVerify}
          onExpired={handleExpired}
        />
      )}

      {step.kind === "code" && (
        <MfaCodeForm
          allowRecovery
          onVerify={handleVerify}
          onExpired={handleExpired}
        />
      )}

      {step.kind === "recovery" && (
        <RecoveryCodes codes={step.codes} onContinue={goHome} />
      )}

      {(step.kind === "enroll" || step.kind === "code") && (
        <Button
          variant="link"
          size="sm"
          className="w-100 mt-2 text-secondary"
          onClick={() => restart()}
        >
          {t.auth.mfa.back}
        </Button>
      )}
      </Card.Body>
    </Card>
  );
}
