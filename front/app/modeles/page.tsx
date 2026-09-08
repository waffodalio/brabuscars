"use client";

import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { useAsync } from "@/hooks/useAsync";
import { carModelService } from "@/services/carModelService";
import type { CarModel } from "@/types/carModel";

export default function CarModelsPage() {
  const state = useAsync<CarModel[]>(() => carModelService.list());

  return (
    <section>
      <h1 className="h3 mb-4">Modèles</h1>

      {state.status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}

      {state.status === "error" && (
        <Alert variant="danger">Erreur de chargement : {state.error}</Alert>
      )}

      {state.status === "ready" && state.data.length === 0 && (
        <Alert variant="light" className="border text-center py-4">
          Aucun modèle enregistré.
        </Alert>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <Card className="overflow-hidden">
          <Table hover responsive className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Marque</th>
                <th className="pe-3">Modèle</th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((carModel) => (
                <tr key={carModel.id}>
                  <td className="ps-3">
                    {carModel.brand?.name ?? carModel.brandId}
                  </td>
                  <td className="pe-3 fw-medium">{carModel.name}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </section>
  );
}
