"use client";

import type { FormEvent, ReactNode } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { ErrorAlert } from "@/components/ErrorAlert";

interface AdminFormModalProps {
  show: boolean;
  title: string;
  error?: string;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: () => void;
  onHide: () => void;
  children: ReactNode;
}

/** Shared create/edit modal for the admin section. */
export function AdminFormModal({
  show,
  title,
  error,
  submitting = false,
  submitLabel = "Enregistrer",
  onSubmit,
  onHide,
  children,
}: AdminFormModalProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <Modal show={show} onHide={onHide} backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h5">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert message={error} />
          {children}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "…" : submitLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
