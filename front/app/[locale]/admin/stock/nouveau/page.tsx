"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "react-bootstrap/Spinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { StockVehicleForm } from "@/components/admin/StockVehicleForm";
import { useLanguage } from "@/context/LanguageContext";
import { carModelService } from "@/services/carModelService";
import { stockService } from "@/services/stockService";
import type { CarModel } from "@/types/carModel";
import { errorMessage } from "@/utils/errors";

/** Back-office: enter a car into the garage register. */
export default function NewStockVehiclePage() {
  const router = useRouter();
  const { withLocale } = useLanguage();
  const [models, setModels] = useState<CarModel[] | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  useEffect(() => {
    carModelService
      .list()
      .then(setModels)
      .catch((err: unknown) => {
        setError(errorMessage(err, "Catalogue indisponible"));
        setModels([]);
      });
  }, []);

  return (
    <section style={{ maxWidth: 960 }}>
      <h1 className="h4 mb-4">Entrer un véhicule</h1>
      <ErrorAlert message={error} />
      {progress && <div className="alert alert-info py-2 small">{progress}</div>}
      {models === null ? (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      ) : (
        <StockVehicleForm
          models={models}
          submitLabel="Enregistrer l'entrée"
          offerListing
          onSubmit={async (input, thenListing, photos) => {
            const vehicle = await stockService.create(input);
            // Photos after the car exists (one request each, in the chosen order).
            for (let i = 0; i < photos.length; i += 1) {
              setProgress(`Envoi des photos… ${i + 1}/${photos.length}`);
              await stockService.uploadImage(vehicle.id, photos[i]);
            }
            router.replace(
              withLocale(thenListing ? `/admin/annonces/nouvelle?stock=${vehicle.id}` : `/admin/stock/${vehicle.id}`),
            );
          }}
        />
      )}
    </section>
  );
}
