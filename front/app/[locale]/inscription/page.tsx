"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { ErrorAlert } from "@/components/ErrorAlert";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { errorMessage } from "@/utils/errors";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t, withLocale } = useLanguage();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      router.push(withLocale("/"));
    } catch (err) {
      setError(errorMessage(err, t.auth.register.error));
      setSubmitting(false);
    }
  }

  return (
    <Card
      className="chc-animate-in mx-auto my-4 my-lg-5"
      style={{ maxWidth: 480 }}
    >
      <Card.Body className="p-4">
      <h1 className="h4 mb-4">{t.auth.register.title}</h1>

      <ErrorAlert message={error} />

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="register-firstName">
              <Form.Label>{t.auth.register.firstName}</Form.Label>
              <Form.Control
                value={form.firstName}
                onChange={update("firstName")}
                required
                autoComplete="given-name"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="register-lastName">
              <Form.Label>{t.auth.register.lastName}</Form.Label>
              <Form.Control
                value={form.lastName}
                onChange={update("lastName")}
                required
                autoComplete="family-name"
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="register-email">
          <Form.Label>{t.auth.register.email}</Form.Label>
          <Form.Control
            type="email"
            value={form.email}
            onChange={update("email")}
            required
            autoComplete="email"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="register-password">
          <Form.Label>{t.auth.register.password}</Form.Label>
          <Form.Control
            type="password"
            value={form.password}
            onChange={update("password")}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Form.Text muted>{t.auth.register.passwordHint}</Form.Text>
        </Form.Group>

        <Button type="submit" disabled={submitting} className="w-100">
          {submitting ? t.auth.register.submitting : t.auth.register.submit}
        </Button>
      </Form>

      <GoogleSignInButton />

      <p className="mt-3 mb-0 small text-secondary">
        {t.auth.register.hasAccount}{" "}
        <a href={withLocale("/connexion")}>{t.auth.register.login}</a>
      </p>
      </Card.Body>
    </Card>
  );
}
