"use client";

import { useState, type FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { ApiClientError } from "@/services/apiClient";

interface MfaCodeFormProps {
  /** Offer the "use a recovery code" switch (not during enrollment). */
  allowRecovery: boolean;
  onVerify: (code: string) => Promise<void>;
  /** The 2FA-pending session expired: back to the password step. */
  onExpired: () => void;
}

/** 6-digit TOTP input, with an optional fallback to a recovery code. */
export function MfaCodeForm({
  allowRecovery,
  onVerify,
  onExpired,
}: MfaCodeFormProps) {
  const { t } = useLanguage();
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onVerify(code.trim());
    } catch (err) {
      setSubmitting(false);
      setCode("");
      if (err instanceof ApiClientError && err.status === 401) {
        onExpired();
      } else if (err instanceof ApiClientError && err.status === 429) {
        setError(t.auth.mfa.locked);
      } else {
        setError(t.auth.mfa.invalid);
      }
    }
  }

  function toggleRecovery() {
    setUseRecovery((current) => !current);
    setCode("");
    setError("");
  }

  return (
    <Form onSubmit={handleSubmit}>
      {allowRecovery && (
        <p className="small text-secondary">
          {useRecovery ? t.auth.mfa.recoveryIntro : t.auth.mfa.codeIntro}
        </p>
      )}

      <ErrorAlert message={error} />

      <Form.Group className="mb-3" controlId="mfa-code">
        <Form.Label>
          {useRecovery ? t.auth.mfa.recoveryLabel : t.auth.mfa.codeLabel}
        </Form.Label>
        {useRecovery ? (
          <Form.Control
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="XXXXX-XXXXX"
            maxLength={20}
            autoFocus
          />
        ) : (
          <Form.Control
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            placeholder="123456"
            className="font-monospace fs-5 text-center"
            autoFocus
          />
        )}
      </Form.Group>

      <Button type="submit" disabled={submitting} className="w-100">
        {submitting ? t.auth.mfa.verifying : t.auth.mfa.verify}
      </Button>

      {allowRecovery && (
        <Button
          variant="link"
          size="sm"
          className="w-100 mt-2"
          onClick={toggleRecovery}
        >
          {useRecovery ? t.auth.mfa.useTotp : t.auth.mfa.useRecovery}
        </Button>
      )}
    </Form>
  );
}
