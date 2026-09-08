"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { contactService } from "@/services/contactService";
import type { ContactMessage } from "@/types/contact";

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
        setError(err instanceof Error ? err.message : "Erreur inconnue");
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
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(message: ContactMessage) {
    if (!window.confirm(`Supprimer le message de ${message.name} ?`)) return;
    await run(message.id, () => contactService.remove(message.id));
  }

  if (status === "loading") {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }
  if (status === "error") {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <section>
      <p className="text-secondary">
        Messages reçus via le formulaire de contact, les non-traités en premier.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      {messages.length === 0 ? (
        <Alert variant="light" className="border">
          Aucun message pour le moment.
        </Alert>
      ) : (
        <div className="d-flex flex-column gap-3">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={message.handled ? "opacity-75" : "border-primary-subtle"}
            >
              <Card.Body>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <span className="fw-semibold">{message.name}</span>{" "}
                    <a href={`mailto:${message.email}`} className="small">
                      {message.email}
                    </a>
                    <div className="text-secondary small">
                      {new Date(message.createdAt).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  {message.handled ? (
                    <Badge bg="secondary">Traité</Badge>
                  ) : (
                    <Badge bg="primary">Nouveau</Badge>
                  )}
                </div>

                <p className="mt-2 mb-3" style={{ whiteSpace: "pre-line" }}>
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
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="ms-auto"
                    disabled={pendingId === message.id}
                    onClick={() => handleDelete(message)}
                  >
                    Supprimer
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
