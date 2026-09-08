"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import { VehicleImagePanel } from "@/components/VehicleImagePanel";
import { vehicleService } from "@/services/vehicleService";
import type { Vehicle } from "@/types/vehicle";
import { vehicleTitle } from "@/utils/vehicleLabels";

export default function AdminVehicleImagesPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    vehicleService
      .getById(id)
      .then(setVehicle)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erreur inconnue"),
      );
  }, [id]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!vehicle) {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  return (
    <article>
      <Link href="/admin/vehicules" className="small">
        ← Retour aux véhicules
      </Link>
      <h2 className="h4 mt-2">
        {vehicleTitle(vehicle)} <span className="text-secondary">({vehicle.year})</span>
      </h2>

      <VehicleImagePanel vehicleId={vehicle.id} canManage />
    </article>
  );
}
