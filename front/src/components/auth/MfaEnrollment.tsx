"use client";

import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "@/context/LanguageContext";
import type { MfaEnrollment as MfaEnrollmentData } from "@/types/auth";
import { MfaCodeForm } from "./MfaCodeForm";

interface MfaEnrollmentProps {
  enrollment: MfaEnrollmentData;
  onVerify: (code: string) => Promise<void>;
  onExpired: () => void;
}

/** First admin login: QR code to scan, then the first code to confirm. */
export function MfaEnrollment({
  enrollment,
  onVerify,
  onExpired,
}: MfaEnrollmentProps) {
  const { t } = useLanguage();
  // Groups of 4 characters are easier to type by hand.
  const groupedSecret = enrollment.secret.match(/.{1,4}/g)?.join(" ");

  return (
    <>
      <p className="small text-secondary">{t.auth.mfa.enrollIntro}</p>

      <div className="text-center my-3">
        <div className="d-inline-block bg-white p-3 rounded border">
          <QRCodeSVG value={enrollment.otpauthUri} size={180} />
        </div>
      </div>

      <p className="small text-secondary mb-1">{t.auth.mfa.manualEntry}</p>
      <p className="font-monospace small text-break user-select-all bg-body-tertiary rounded p-2">
        {groupedSecret}
      </p>

      <MfaCodeForm
        allowRecovery={false}
        onVerify={onVerify}
        onExpired={onExpired}
      />
    </>
  );
}
