"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import type { AuthUser, UserRole } from "@/types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  user: "Utilisateur",
  admin: "Administrateur",
  super_admin: "Super admin",
};

const ROLE_VARIANTS: Record<UserRole, string> = {
  user: "secondary",
  admin: "primary",
  super_admin: "dark",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, initializing, isSuperAdmin } = useAuth();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    if (!initializing && !isSuperAdmin) router.replace("/admin");
  }, [initializing, isSuperAdmin, router]);

  const load = useCallback((term?: string) => {
    setStatus("loading");
    userService
      .list(term ? { search: term } : {})
      .then((data) => {
        setUsers(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin, load]);

  async function toggleAdmin(target: AuthUser, makeAdmin: boolean) {
    setPendingId(target.id);
    setError("");
    try {
      const updated = await userService.setRole(
        target.id,
        makeAdmin ? "admin" : "user",
      );
      setUsers((current) =>
        current.map((u) => (u.id === updated.id ? updated : u)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible");
    } finally {
      setPendingId(null);
    }
  }

  if (initializing || !isSuperAdmin) {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  return (
    <section>
      <p className="text-secondary">
        Activez l&apos;interrupteur pour donner à un compte l&apos;accès
        administrateur (gestion du catalogue et des annonces). Les comptes
        « Super admin » et le vôtre ne sont pas modifiables ici.
      </p>

      <Form
        className="mb-3"
        style={{ maxWidth: 360 }}
        onSubmit={(event) => {
          event.preventDefault();
          load(search.trim() || undefined);
        }}
      >
        <InputGroup>
          <Form.Control
            placeholder="Rechercher (nom, e-mail)…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="btn btn-outline-secondary" type="submit">
            Rechercher
          </button>
        </InputGroup>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      {status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}

      {status === "ready" && (
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Rôle</th>
              <th className="text-end">Administrateur</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => {
              const isSelf = account.id === currentUser?.id;
              const isProtected = account.role === "super_admin" || isSelf;
              return (
                <tr key={account.id}>
                  <td>{account.id}</td>
                  <td>
                    {account.firstName} {account.lastName}
                    {isSelf && (
                      <span className="text-secondary"> (vous)</span>
                    )}
                  </td>
                  <td>{account.email}</td>
                  <td>
                    <Badge bg={ROLE_VARIANTS[account.role]}>
                      {ROLE_LABELS[account.role]}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Form.Check
                      type="switch"
                      id={`admin-switch-${account.id}`}
                      className="d-inline-block"
                      checked={
                        account.role === "admin" ||
                        account.role === "super_admin"
                      }
                      disabled={isProtected || pendingId === account.id}
                      onChange={(event) =>
                        toggleAdmin(account, event.target.checked)
                      }
                      aria-label={`Rôle administrateur pour ${account.email}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </section>
  );
}
