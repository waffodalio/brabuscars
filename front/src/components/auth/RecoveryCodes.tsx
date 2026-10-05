"use client";

import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useLanguage } from "@/context/LanguageContext";

interface RecoveryCodesProps {
  codes: string[];
  onContinue: () => void;
}

/** Shown once, right after 2FA activation. */
export function RecoveryCodes({ codes, onContinue }: RecoveryCodesProps) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      /* clipboard unavailable: the codes stay selectable on screen */
    }
  }

  return (
    <>
      <p className="small text-secondary">{t.auth.mfa.recoveryCodesIntro}</p>

      <ul className="list-unstyled row row-cols-2 g-2 font-monospace bg-body-tertiary rounded p-3 mx-0 user-select-all">
        {codes.map((code) => (
          <li key={code} className="col text-center">
            {code}
          </li>
        ))}
      </ul>

      <Button
        variant="outline-secondary"
        size="sm"
        className="w-100 mb-3"
        onClick={copy}
      >
        {copied ? t.auth.mfa.copied : t.auth.mfa.copy}
      </Button>

      <Form.Check
        id="recovery-saved"
        className="mb-3"
        label={t.auth.mfa.confirmSaved}
        checked={saved}
        onChange={(event) => setSaved(event.target.checked)}
      />

      <Button className="w-100" disabled={!saved} onClick={onContinue}>
        {t.auth.mfa.continue}
      </Button>
    </>
  );
}
