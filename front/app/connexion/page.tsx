"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto my-4 my-lg-5" style={{ maxWidth: 420 }}>
      <Card.Body className="p-4">
      <h1 className="h4 mb-4">Connexion</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="login-email">
          <Form.Label>Adresse e-mail</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="login-password">
          <Form.Label>Mot de passe</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </Form.Group>

        <Button type="submit" disabled={submitting} className="w-100">
          {submitting ? "Connexion…" : "Se connecter"}
        </Button>
      </Form>

      <p className="mt-3 mb-0 small text-secondary">
        Pas encore de compte ? <a href="/inscription">Créer un compte</a>
      </p>
      </Card.Body>
    </Card>
  );
}
