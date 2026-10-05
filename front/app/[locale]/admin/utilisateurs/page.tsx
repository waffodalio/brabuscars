"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { ErrorAlert } from "@/components/ErrorAlert";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { userService } from "@/services/userService";
import type { AuthUser, RoleChange, UserRole } from "@/types/auth";
import { errorMessage } from "@/utils/errors";

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

/** A role change awaiting the super admin's confirmation. */
interface PendingChange {
  target: AuthUser;
  makeAdmin: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, initializing, isSuperAdmin } = useAuth();
  const { locale } = useLanguage();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<AuthUser | null>(null);
  const [notice, setNotice] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<RoleChange[]>([]);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (!initializing && !isSuperAdmin) router.replace(`/${locale}/admin`);
  }, [initializing, isSuperAdmin, router, locale]);

  const load = useCallback((term?: string) => {
    setStatus("loading");
    userService
      .list(term ? { search: term } : {})
      .then((data) => {
        setUsers(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setError(errorMessage(err, "Erreur inconnue"));
        setStatus("error");
      });
  }, []);

  function askDelete(target: AuthUser) {
    setConfirmError("");
    setNotice("");
    setPendingDelete(target);
  }

  function cancelDelete() {
    if (!submitting) setPendingDelete(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setSubmitting(true);
    setConfirmError("");
    try {
      const { reassignedListings } = await userService.remove(target.id);
      setUsers((current) => current.filter((u) => u.id !== target.id));
      setPendingDelete(null);
      setNotice(
        `Compte ${target.email} supprimé.` +
          (reassignedListings > 0
            ? ` ${reassignedListings} annonce(s) vous ont été réattribuée(s).`
            : ""),
      );
    } catch (err) {
      setConfirmError(errorMessage(err, "Suppression impossible"));
    } finally {
      setSubmitting(false);
    }
  }

  const loadHistory = useCallback(() => {
    userService
      .listRoleChanges()
      .then((data) => {
        setHistory(data);
        setHistoryError("");
      })
      .catch((err: unknown) =>
        setHistoryError(errorMessage(err, "Historique indisponible")),
      );
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      load();
      loadHistory();
    }
  }, [isSuperAdmin, load, loadHistory]);

  function askRoleChange(target: AuthUser, makeAdmin: boolean) {
    setConfirmError("");
    setNotice("");
    setPendingChange({ target, makeAdmin });
  }

  function cancelRoleChange() {
    if (!submitting) setPendingChange(null);
  }

  async function confirmRoleChange() {
    if (!pendingChange) return;
    const { target, makeAdmin } = pendingChange;
    setSubmitting(true);
    setConfirmError("");
    try {
      const updated = await userService.setRole(
        target.id,
        makeAdmin ? "admin" : "user",
      );
      setUsers((current) =>
        current.map((u) => (u.id === updated.id ? updated : u)),
      );
      setPendingChange(null);
      loadHistory();
    } catch (err) {
      setConfirmError(errorMessage(err, "Modification impossible"));
    } finally {
      setSubmitting(false);
    }
  }

  if (initializing || !isSuperAdmin) {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  return (
    <section>
      <p className="text-secondary">
        Activez l&apos;interrupteur pour donner à un compte l&apos;accès
        administrateur (gestion du catalogue et des annonces). Chaque
        changement demande une confirmation, prend effet immédiatement et est
        enregistré dans l&apos;historique ci-dessous. Seuls les comptes
        clients (« Utilisateur ») peuvent être supprimés. Les comptes « Super
        admin » et le vôtre ne sont pas modifiables ici.
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

      <ErrorAlert message={error} />
      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      {status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}

      {status === "ready" && (
        <Table striped hover responsive className="chc-table-cards">
          <thead>
            <tr>
              <th>#</th>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Rôle</th>
              <th className="text-end">Administrateur</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => {
              const isSelf = account.id === currentUser?.id;
              const isProtected = account.role === "super_admin" || isSelf;
              return (
                <tr key={account.id}>
                  <td data-label="#">{account.id}</td>
                  <td data-label="Nom">
                    {account.firstName} {account.lastName}
                    {isSelf && (
                      <span className="text-secondary"> (vous)</span>
                    )}
                  </td>
                  <td data-label="E-mail">{account.email}</td>
                  <td data-label="Rôle">
                    <Badge bg={ROLE_VARIANTS[account.role]}>
                      {ROLE_LABELS[account.role]}
                    </Badge>
                  </td>
                  <td data-label="Administrateur" className="text-end">
                    <Form.Check
                      type="switch"
                      id={`admin-switch-${account.id}`}
                      className="d-inline-block"
                      checked={
                        account.role === "admin" ||
                        account.role === "super_admin"
                      }
                      disabled={isProtected || submitting}
                      onChange={(event) =>
                        askRoleChange(account, event.target.checked)
                      }
                      aria-label={`Rôle administrateur pour ${account.email}`}
                    />
                  </td>
                  <td data-label="Actions" className="text-end">
                    {account.role === "user" && !isSelf && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={submitting}
                        onClick={() => askDelete(account)}
                      >
                        Supprimer
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <h2 className="h5 mt-5">Historique des changements de rôle</h2>
      <ErrorAlert message={historyError} />
      {history.length === 0 && !historyError ? (
        <p className="text-secondary">Aucun changement de rôle enregistré.</p>
      ) : (
        <Table striped responsive size="sm" className="chc-table-cards">
          <thead>
            <tr>
              <th>Date</th>
              <th>Compte</th>
              <th>Changement</th>
              <th>Par</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id}>
                <td data-label="Date">
                  {new Date(entry.createdAt).toLocaleString("fr-FR")}
                </td>
                <td data-label="Compte">{entry.targetEmail}</td>
                <td data-label="Changement">
                  <Badge bg={ROLE_VARIANTS[entry.oldRole]}>
                    {ROLE_LABELS[entry.oldRole]}
                  </Badge>
                  {" → "}
                  <Badge bg={ROLE_VARIANTS[entry.newRole]}>
                    {ROLE_LABELS[entry.newRole]}
                  </Badge>
                </td>
                <td data-label="Par">{entry.actorEmail}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <AdminFormModal
        show={pendingChange !== null}
        title={
          pendingChange?.makeAdmin
            ? "Donner l'accès administrateur ?"
            : "Retirer l'accès administrateur ?"
        }
        error={confirmError}
        submitting={submitting}
        submitLabel="Confirmer"
        onSubmit={confirmRoleChange}
        onHide={cancelRoleChange}
      >
        {pendingChange && (
          <>
            <p>
              Compte :{" "}
              <strong>
                {pendingChange.target.firstName}{" "}
                {pendingChange.target.lastName}
              </strong>{" "}
              ({pendingChange.target.email})
            </p>
            <p className="mb-0">
              {pendingChange.makeAdmin
                ? "Ce compte pourra gérer tout le catalogue, les annonces, leurs photos et les messages de contact."
                : "Ce compte redeviendra un simple utilisateur et perdra immédiatement l'accès à l'administration."}
            </p>
          </>
        )}
      </AdminFormModal>

      <AdminFormModal
        show={pendingDelete !== null}
        title="Supprimer ce compte ?"
        error={confirmError}
        submitting={submitting}
        submitLabel="Supprimer définitivement"
        onSubmit={confirmDelete}
        onHide={cancelDelete}
      >
        {pendingDelete && (
          <>
            <p>
              Compte :{" "}
              <strong>
                {pendingDelete.firstName} {pendingDelete.lastName}
              </strong>{" "}
              ({pendingDelete.email})
            </p>
            <p className="mb-0">
              Le compte et ses favoris seront supprimés. Cette action est
              irréversible.
            </p>
          </>
        )}
      </AdminFormModal>
    </section>
  );
}
