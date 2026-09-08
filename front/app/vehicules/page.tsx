"use client";

import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
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
        <Alert variant="light" className="border text-center py-4">
          Aucun véhicule enregistré.
        </Alert>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <Card className="overflow-hidden">
          <Table hover responsive className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Véhicule</th>
                <th>Catégorie</th>
                <th>Année</th>
                <th>Kilométrage</th>
                <th>Carburant</th>
                <th className="pe-3">Boîte</th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="ps-3 fw-medium">{vehicleTitle(vehicle)}</td>
                  <td>{vehicle.category?.name ?? "—"}</td>
                  <td>{vehicle.year}</td>
                  <td>{vehicle.mileage.toLocaleString("fr-FR")} km</td>
                  <td>{FUEL_TYPE_LABELS[vehicle.fuelType]}</td>
                  <td className="pe-3">
                    {TRANSMISSION_LABELS[vehicle.transmission]}
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
