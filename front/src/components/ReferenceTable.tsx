"use client";

import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
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
        <Alert variant="light" className="border text-center py-4">
          {emptyLabel}
        </Alert>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <Card className="overflow-hidden">
          <Table hover responsive className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="ps-3">#</th>
                <th>Nom</th>
                <th className="pe-3">Slug</th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((row) => (
                <tr key={row.id}>
                  <td className="ps-3 text-secondary">{row.id}</td>
                  <td className="fw-medium">{row.name}</td>
                  <td className="pe-3">
                    <code>{row.slug}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </section>
  );
}
