"use client";

import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { useAsync } from "@/hooks/useAsync";

export interface ReferenceRow {
  id: number;
  name: string;
  slug: string;
}

interface ReferenceTableProps<T extends ReferenceRow> {
  title: string;
  emptyLabel: string;
  fetcher: () => Promise<T[]>;
}

/**
 * Shared read view for simple reference data (id / name / slug): brands,
 * categories, … Handles the loading, error and empty states.
 */
export function ReferenceTable<T extends ReferenceRow>({
  title,
  emptyLabel,
  fetcher,
}: ReferenceTableProps<T>) {
  const state = useAsync<T[]>(fetcher);

  return (
    <section>
      <h1 className="h3 mb-4">{title}</h1>

      {state.status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}

      {state.status === "error" && (
        <Alert variant="danger">Erreur de chargement : {state.error}</Alert>
      )}

      {state.status === "ready" && state.data.length === 0 && (
        <Alert variant="info">{emptyLabel}</Alert>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Nom</th>
              <th>Slug</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>
                  <code>{row.slug}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </section>
  );
}
