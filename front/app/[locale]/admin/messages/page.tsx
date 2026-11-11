"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { contactService } from "@/services/contactService";
import type { ContactMessage } from "@/types/contact";
import { errorMessage } from "@/utils/errors";
import { ConfirmButton } from "@/components/ConfirmButton";
import { INTL_LOCALES } from "@/i18n/locales";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setStatus("loading");
    contactService
      .list()
      .then((data) => {
        setMessages(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setError(errorMessage(err, "Erreur inconnue"));
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(id: number, action: () => Promise<unknown>) {
    setPendingId(id);
    setError("");
    try {
      await action();
      load();
    } catch (err) {
      setError(errorMessage(err, "Action impossible"));
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(message: ContactMessage) {
    await run(message.id, () => contactService.remove(message.id));
  }

  if (status === "loading") {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }
  if (status === "error") {
    return <ErrorAlert message={error} />;
  }

  return (
    <section>
      <p className="text-secondary mb-4">
        Messages reçus via le formulaire de contact, les non-traités en premier.
      </p>

      <ErrorAlert message={error} />

      {messages.length === 0 ? (
        <Alert variant="light" className="border">
          Aucun message pour le moment.
        </Alert>
      ) : (
        <div className="d-flex flex-column gap-4">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={message.handled ? "opacity-75" : "border-primary-subtle"}
            >
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                  <div className="text-break" style={{ minWidth: 0 }}>
                    <span className="fw-semibold">{message.name}</span>{" "}
                    <a href={`mailto:${message.email}`} className="small">
                      {message.email}
                    </a>
                    <div className="text-secondary small">
                      {new Date(message.createdAt).toLocaleString(INTL_LOCALES.fr)}
                    </div>
                  </div>
                  {message.handled ? (
                    <Badge bg="secondary">Traité</Badge>
                  ) : (
                    <Badge bg="primary">Nouveau</Badge>
                  )}
                </div>

                <p className="mt-3 mb-4" style={{ whiteSpace: "pre-line" }}>
                  {message.message}
                </p>

                <div className="d-flex align-items-center gap-3">
                  <Form.Check
                    type="switch"
                    id={`handled-${message.id}`}
                    label="Traité"
                    checked={message.handled}
                    disabled={pendingId === message.id}
                    onChange={(event) =>
                      run(message.id, () =>
                        contactService.setHandled(
                          message.id,
                          event.target.checked,
                        ),
                      )
                    }
                  />
                  <ConfirmButton
                    className="ms-auto"
                    disabled={pendingId === message.id}
                    message={<>Supprimer le message de {message.name} ?</>}
                    confirmLabel="Oui, supprimer"
                    cancelLabel="Non"
                    onConfirm={() => handleDelete(message)}
                  >
                    Supprimer
                  </ConfirmButton>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
