"use client";

import Alert from "react-bootstrap/Alert";
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
        <Alert variant="info">Aucun modèle enregistré.</Alert>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Marque</th>
              <th>Modèle</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((carModel) => (
              <tr key={carModel.id}>
                <td>{carModel.id}</td>
                <td>{carModel.brand?.name ?? carModel.brandId}</td>
                <td>{carModel.name}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </section>
  );
}
