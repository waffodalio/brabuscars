"use client";

import { useEffect, useRef, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useLanguage } from "@/context/LanguageContext";

const SHARE = "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13";

/**
 * « Partager » a listing: the phone's own share sheet when there is one,
 * otherwise a small menu — WhatsApp or copy the link (with a « copied » hint).
 */
export function ShareButton({ title }: { title: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const url = () => window.location.href;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard refused: nothing to show */
    }
  }

  async function nativeShare(event: React.MouseEvent) {
    if (typeof navigator.share !== "function") return; // the menu opens instead
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.share({ title, text: t.details.shareText(title), url: url() });
    } catch {
      /* cancelled by the user */
    }
  }

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        as="button"
        type="button"
        className="chc-fav-btn chc-share-btn"
        aria-label={t.details.share}
        title={copied ? t.details.shareCopied : t.details.share}
        onClickCapture={nativeShare}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={SHARE} />
        </svg>
      </Dropdown.Toggle>
      <Dropdown.Menu className="chc-share-menu">
        <Dropdown.Item
          href={`https://wa.me/?text=${encodeURIComponent(`${t.details.shareText(title)} ${typeof window === "undefined" ? "" : url()}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.details.shareWhatsapp}
        </Dropdown.Item>
        <Dropdown.Item as="button" onClick={() => void copy()}>
          {copied ? t.details.shareCopied : t.details.shareCopy}
        </Dropdown.Item>
      </Dropdown.Menu>
      <span className="visually-hidden" role="status">
        {copied ? t.details.shareCopied : ""}
      </span>
    </Dropdown>
  );
}
