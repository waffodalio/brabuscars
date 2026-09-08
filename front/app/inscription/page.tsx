"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
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
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 480 }}>
      <h1 className="h3 mb-4">Créer un compte</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="register-firstName">
              <Form.Label>Prénom</Form.Label>
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
              <Form.Label>Nom</Form.Label>
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
          <Form.Label>Adresse e-mail</Form.Label>
          <Form.Control
            type="email"
            value={form.email}
            onChange={update("email")}
            required
            autoComplete="email"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="register-password">
          <Form.Label>Mot de passe</Form.Label>
          <Form.Control
            type="password"
            value={form.password}
            onChange={update("password")}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Form.Text muted>8 caractères minimum.</Form.Text>
        </Form.Group>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Création…" : "Créer le compte"}
        </Button>
      </Form>

      <p className="mt-3 mb-0 small text-secondary">
        Déjà inscrit ? <a href="/connexion">Se connecter</a>
      </p>
    </div>
  );
}
