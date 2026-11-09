"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import Button, { type ButtonProps } from "react-bootstrap/Button";
import Overlay from "react-bootstrap/Overlay";
import Popover from "react-bootstrap/Popover";
import type { Placement } from "react-bootstrap/types";
import { useLanguage } from "@/context/LanguageContext";

interface ConfirmButtonProps {
  /** Question shown in the bubble, e.g. "Delete this listing?". */
  message: ReactNode;
  /** Label of the button that carries out the action, e.g. "Yes, delete". */
  confirmLabel: string;
  /** Label of the button that closes the bubble (default: "No"). */
  cancelLabel?: string;
  /** Runs on confirmation; the bubble closes first. */
  onConfirm: () => void | Promise<void>;
  /** The trigger button's content. */
  children: ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  placement?: Placement;
}

/**
 * A button that asks for confirmation in a bubble anchored to it, instead of
 * the browser's `confirm()` dialog: "Delete X?  [No] [Yes, delete]". Closes
 * on "No", Escape or a click outside.
 */
export function ConfirmButton({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  children,
  variant = "outline-danger",
  size = "sm",
  className,
  disabled,
  placement = "top",
  ...rest
}: ConfirmButtonProps) {
  const { t } = useLanguage();
  const [target, setTarget] = useState<HTMLButtonElement | null>(null);
  const [show, setShow] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  function confirm() {
    setShow(false);
    void onConfirm();
  }

  return (
    <>
      <Button
        ref={setTarget}
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        aria-label={rest["aria-label"]}
        aria-haspopup="dialog"
        aria-expanded={show}
        aria-controls={show ? id : undefined}
        onClick={() => setShow((open) => !open)}
      >
        {children}
      </Button>
      <Overlay
        target={target}
        show={show}
        placement={placement}
        rootClose
        onHide={() => setShow(false)}
        // Focus the action once the bubble is in place — not before (it
        // would make the page jump to wherever the bubble is first drawn).
        onEntered={() => confirmRef.current?.focus({ preventScroll: true })}
      >
        <Popover id={id} role="dialog" className="chc-confirm">
          <Popover.Body>
            <div className="chc-confirm-message">{message}</div>
            <div className="d-flex justify-content-end gap-2 mt-2">
              <Button size="sm" variant="outline-secondary" onClick={() => setShow(false)}>
                {cancelLabel ?? t.common.no}
              </Button>
              <Button ref={confirmRef} size="sm" variant="danger" onClick={confirm}>
                {confirmLabel}
              </Button>
            </div>
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
  );
}
