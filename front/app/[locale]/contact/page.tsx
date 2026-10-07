"use client";

import { useState, type FormEvent } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useCompany } from "@/context/CompanyContext";
import { useLanguage } from "@/context/LanguageContext";
import { contactService } from "@/services/contactService";
import { errorMessage } from "@/utils/errors";
import { googleMapsDirectionsUrl, googleMapsEmbedUrl } from "@/utils/mapLinks";

export default function ContactPage() {
  const company = useCompany();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    website: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  function update(field: keyof typeof form) {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await contactService.submit(form);
      setStatus("sent");
      setForm({ name: "", email: "", message: "", website: "" });
    } catch (err) {
      setError(errorMessage(err, t.contact.error));
      setStatus("error");
    }
  }

  return (
    <section>
      <h1 className="h3 mb-4">{t.contact.title}</h1>

      <Row className="g-4 chc-stagger">
        <Col lg={5}>
          <Card className="h-100">
            <Card.Body>
              <h2 className="h6">{company?.name ?? "BrabusCars"}</h2>
              {company && (
                <address className="mb-3 text-body-secondary">
                  {company.address}
                  <br />
                  {company.postalCode} {company.city}
                  <br />
                  {company.country}
                </address>
              )}
              <dl className="row mb-0 small">
                <dt className="col-4 text-secondary fw-normal">
                  {t.contact.phone}
                </dt>
                <dd className="col-8">
                  {company ? (
                    <a href={`tel:${company.phone.replace(/\s/g, "")}`}>
                      {company.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt className="col-4 text-secondary fw-normal">
                  {t.contact.email}
                </dt>
                <dd className="col-8">
                  {company ? (
                    <a href={`mailto:${company.email}`}>{company.email}</a>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt className="col-4 text-secondary fw-normal">
                  {t.contact.hours}
                </dt>
                <dd className="col-8">{company?.hours ?? "—"}</dd>
              </dl>

              {company && (
                <div className="mt-3">
                  <div
                    className="rounded-3 overflow-hidden border"
                    style={{ aspectRatio: "4 / 3" }}
                  >
                    <iframe
                      src={googleMapsEmbedUrl(company)}
                      title={t.contact.mapTitle}
                      loading="lazy"
                      className="w-100 h-100 border-0"
                    />
                  </div>
                  <div className="d-flex justify-content-between align-items-baseline mt-2">
                    <a
                      href={googleMapsDirectionsUrl(company)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="small"
                    >
                      {t.contact.directions}
                    </a>
                    <span className="text-secondary" style={{ fontSize: "0.72rem" }}>
                      {t.contact.mapProvider}
                    </span>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card>
            <Card.Body>
              <h2 className="h6 mb-3">{t.contact.formTitle}</h2>

              {status === "sent" && (
                <Alert variant="success">{t.contact.success}</Alert>
              )}
              {status === "error" && <ErrorAlert message={error} />}

              <Form onSubmit={handleSubmit}>
                {/* Honeypot: hidden from users, tempting for bots */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={update("website")}
                  className="d-none"
                  aria-hidden="true"
                />

                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3" controlId="contact-name">
                      <Form.Label>{t.contact.name}</Form.Label>
                      <Form.Control
                        value={form.name}
                        onChange={update("name")}
                        required
                        minLength={2}
                        maxLength={120}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3" controlId="contact-email">
                      <Form.Label>{t.contact.emailField}</Form.Label>
                      <Form.Control
                        type="email"
                        value={form.email}
                        onChange={update("email")}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3" controlId="contact-message">
                  <Form.Label>{t.contact.message}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={form.message}
                    onChange={update("message")}
                    required
                    minLength={10}
                    maxLength={5000}
                  />
                </Form.Group>

                <Button type="submit" disabled={status === "sending"}>
                  {status === "sending" ? t.contact.sending : t.contact.send}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </section>
  );
}
