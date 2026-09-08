"use client";

import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { useAsync } from "@/hooks/useAsync";
import { vehicleService } from "@/services/vehicleService";
import type { Vehicle } from "@/types/vehicle";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  vehicleTitle,
} from "@/utils/vehicleLabels";

export default function VehiclesPage() {
  const state = useAsync<Vehicle[]>(() => vehicleService.list());

  return (
    <section>
      <h1 className="h3 mb-4">Véhicules</h1>

      {state.status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}

      {state.status === "error" && (
        <Alert variant="danger">Erreur de chargement : {state.error}</Alert>
      )}

      {state.status === "ready" && state.data.length === 0 && (
        <Alert variant="info">Aucun véhicule enregistré.</Alert>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Véhicule</th>
              <th>Catégorie</th>
              <th>Année</th>
              <th>Kilométrage</th>
              <th>Carburant</th>
              <th>Boîte</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>{vehicle.id}</td>
                <td>{vehicleTitle(vehicle)}</td>
                <td>{vehicle.category?.name ?? "—"}</td>
                <td>{vehicle.year}</td>
                <td>{vehicle.mileage.toLocaleString("fr-FR")} km</td>
                <td>{FUEL_TYPE_LABELS[vehicle.fuelType]}</td>
                <td>{TRANSMISSION_LABELS[vehicle.transmission]}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </section>
  );
}
